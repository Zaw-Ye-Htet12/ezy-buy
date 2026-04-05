import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus, FulfillmentType, Role } from '@prisma/client';
import { StoreService } from '../store/store.service';
import { AddressesService } from '../users/addresses.service';
import { getDistanceFromLatLonInKm } from '../common/utils/geo.util';
import { MailService } from '../mail/mail.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/types/paginated-result';
import { isStoreOpen } from '../common/utils/time.util';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private storeService: StoreService,
    private addressesService: AddressesService,
    private mailService: MailService,
  ) { }

  async create(userId: string, createDto: CreateOrderDto): Promise<Order> {
    const storeSettings = await this.storeService.getSettings();

    if (!storeSettings.isAcceptingOrders) {
      throw new ForbiddenException('Store is currently not accepting new orders');
    }

    if (!isStoreOpen(storeSettings.openingHours)) {
      throw new ForbiddenException('Store is currently closed');
    }

    // 1. Calculate Totals and Validate Products
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of createDto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, isDeleted: false, isAvailable: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}`,
        );
      }

      let itemPrice = Number(product.price);
      const selectedOptionsSnapshot: any[] = [];

      if (item.optionValueIds && item.optionValueIds.length > 0) {
        const optionValues = await this.prisma.productOptionValue.findMany({
          where: {
            id: { in: item.optionValueIds },
            option: { productId: product.id },
          },
          include: { option: true },
        });

        if (optionValues.length !== item.optionValueIds.length) {
          throw new BadRequestException(
            `Invalid options selected for product ${product.name}`,
          );
        }

        for (const val of optionValues) {
          const delta = Number(val.priceDelta);
          itemPrice += delta;
          selectedOptionsSnapshot.push({
            optionName: val.option.name,
            label: val.label,
            priceDelta: delta,
          });
        }
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice: itemPrice,
        quantity: item.quantity,
        selectedOptions: selectedOptionsSnapshot,
        itemTotal: itemTotal,
      });
    }

    // 2. Handle Fulfillment Fee, Distance, and Pickup Slot
    let deliveryFee = 0;
    let calculatedDistance = 0;
    let pickupSlotId: string | undefined;

    if (createDto.fulfillmentType === FulfillmentType.home_delivery) {
      if (!createDto.addressId) throw new BadRequestException('Address ID is required for delivery');

      const address = await this.addressesService.findOne(userId, createDto.addressId!);

      calculatedDistance = getDistanceFromLatLonInKm(
        Number(storeSettings.storeLatitude),
        Number(storeSettings.storeLongitude),
        Number(address.latitude),
        Number(address.longitude),
      );

      if (calculatedDistance > Number(storeSettings.deliveryRadiusKm)) {
        throw new BadRequestException('Address is outside of our delivery radius');
      }

      deliveryFee = Math.max(
        Number(storeSettings.minDeliveryFee),
        calculatedDistance * Number(storeSettings.deliveryFeePerKm),
      );
    } else if (createDto.fulfillmentType === FulfillmentType.click_and_collect) {
      const slot = await this.prisma.pickupSlot.findUnique({
        where: { id: createDto.slotId, isActive: true },
        include: { _count: { select: { collectSlots: true } } },
      });

      if (!slot) {
        throw new NotFoundException('Pickup slot not found or inactive');
      }

      if (slot._count.collectSlots >= slot.maxOrders) {
        throw new BadRequestException('The selected pickup slot is full');
      }

      pickupSlotId = slot.id;
    }

    const totalAmount = subtotal + deliveryFee;

    // 3. Generate Order Number (e.g. ORD-240325-1234)
    const orderNumber = `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Atomic Transaction Create Order & Update Stock
    const order = await this.prisma.$transaction(async (tx) => {
      // 4.1 Create the main order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          fulfillmentType: createDto.fulfillmentType,
          status: OrderStatus.pending,
          subtotal,
          deliveryFee,
          totalAmount,
          specialInstructions: createDto.specialInstructions,
          items: {
            create: orderItemsData.map(item => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions,
              itemTotal: item.itemTotal,
            })),
          },
        },
      });

      // 4.2 Decrement stock for each item
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4.3 Handle fulfillment details
      if (createDto.fulfillmentType === FulfillmentType.home_delivery) {
        await tx.delivery.create({
          data: {
            orderId: order.id,
            addressId: createDto.addressId!,
            distanceKm: calculatedDistance,
          },
        });
      } else if (createDto.fulfillmentType === FulfillmentType.click_and_collect) {
        await tx.collectSlot.create({
          data: {
            orderId: order.id,
            slotId: pickupSlotId,
          },
        });
      }

      return order;
    });

    // 5. Send confirmation email (async)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.email) {
      this.mailService.sendOrderConfirmation(
        user.email,
        user.fullName,
        orderNumber,
        totalAmount,
      );
    }

    return order;
  }

  async findAll(userId: string, paginationDto: PaginationDto): Promise<PaginatedResult<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: true,
        delivery: { include: { address: true } },
        collectSlot: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Admin APIs
  async findAllAdmin(paginationDto: PaginationDto): Promise<PaginatedResult<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          items: true,
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // 1. STRICT STATE MACHINE VALIDATION
    // Define what the next allowed steps are for each status
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.pending]: [OrderStatus.confirmed, OrderStatus.cancelled],
      [OrderStatus.confirmed]: [OrderStatus.preparing, OrderStatus.cancelled],
      [OrderStatus.preparing]: [OrderStatus.ready, OrderStatus.cancelled],
      [OrderStatus.ready]: [
        OrderStatus.out_for_delivery,
        OrderStatus.delivered,
        OrderStatus.cancelled,
      ],
      [OrderStatus.out_for_delivery]: [OrderStatus.delivered, OrderStatus.cancelled],
      [OrderStatus.delivered]: [], // Final state
      [OrderStatus.cancelled]: [], // Final state
    };

    const currentStatus = order.status;
    const isAllowed =
      allowedTransitions[currentStatus].includes(status) ||
      status === currentStatus; // Allow re-sending the same status

    if (!isAllowed) {
      throw new BadRequestException(
        `Invalid status transition: Cannot move from ${currentStatus} to ${status}. ` +
        `Expected next step: ${allowedTransitions[currentStatus].join(' or ') || 'None (order is finalized)'}`,
      );
    }

    // 2. If order is being cancelled, revert the stock
    if (
      status === OrderStatus.cancelled &&
      order.status !== OrderStatus.cancelled
    ) {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return tx.order.update({
          where: { id },
          data: { status },
        });
      });
    }

    // 3. Perform the update
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (updatedOrder.user && updatedOrder.user.email) {
      this.mailService.sendOrderStatusUpdate(
        updatedOrder.user.email,
        updatedOrder.user.fullName,
        updatedOrder.orderNumber,
        status,
      );
    }

    return updatedOrder;
  }

  async findOneAdmin(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { fullName: true, email: true, phone: true } },
        delivery: { include: { address: true, deliveryPerson: { select: { fullName: true, phone: true } } } },
        collectSlot: true,
        payments: true,
      },
    });

    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async assignRider(orderId: string, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.fulfillmentType !== FulfillmentType.home_delivery || !order.delivery) {
      throw new BadRequestException('This order is not a home delivery type');
    }

    const rider = await this.prisma.user.findUnique({
      where: { id: riderId },
    });

    if (!rider) throw new NotFoundException('Rider not found');

    // Check if the user has a valid staff role
    if (rider.role !== Role.rider && rider.role !== Role.admin) {
      throw new BadRequestException('User does not have an authorized delivery role (rider/admin)');
    }

    return this.prisma.delivery.update({
      where: { orderId },
      data: {
        deliveryPersonId: riderId,
      },
      include: {
        deliveryPerson: { select: { fullName: true, phone: true } },
      },
    });
  }

  async dispatchOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.fulfillmentType !== FulfillmentType.home_delivery || !order.delivery) {
      throw new BadRequestException('This order is not a delivery type');
    }

    if (!order.delivery.deliveryPersonId) {
      throw new BadRequestException('Please assign a rider before dispatching the order');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update timestamp in delivery table
      await tx.delivery.update({
        where: { orderId },
        data: { dispatchedAt: new Date() },
      });

      // 2. Advance the order status
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.out_for_delivery },
      });
    });
  }

  async generateOrderQrCode(userId: string, orderId: string): Promise<string> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Generate QR code for the order number
    // In a real app, this might be a URL to the order detail page
    try {
      const qrDataUrl = await QRCode.toDataURL(order.orderNumber);
      return qrDataUrl;
    } catch (err) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        user: { select: { fullName: true, email: true, phone: true } },
        delivery: {
          include: {
            address: true,
            deliveryPerson: { select: { fullName: true, phone: true } },
          },
        },
        collectSlot: { include: { slot: true } },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }
}



