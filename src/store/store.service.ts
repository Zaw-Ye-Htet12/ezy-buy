import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreSettingDto } from './dto/update-store-setting.dto';
import { StoreSetting } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<any> {
    const settings = await this.prisma.storeSetting.findFirst({
      include: { slots: true },
    });
    if (!settings) {
      // Create default settings if none exist
      const newSettings = await this.prisma.storeSetting.create({
        data: {
          storeName: 'Ezy Buy Store',
          storeLatitude: 16.8661, // Yangon default
          storeLongitude: 96.1951,
          deliveryRadiusKm: 5.0,
          deliveryFeePerKm: 500.0,
          minDeliveryFee: 1500.0,
          isAcceptingOrders: true,
          openingHours: {
            monday: { open: '09:00', close: '20:00' },
            tuesday: { open: '09:00', close: '20:00' },
            wednesday: { open: '09:00', close: '20:00' },
            thursday: { open: '09:00', close: '20:00' },
            friday: { open: '09:00', close: '20:00' },
            saturday: { open: '10:00', close: '18:00' },
            sunday: { open: 'closed' },
          },
        },
      });
      return { ...newSettings, slots: [] };
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateStoreSettingDto): Promise<any> {
    const settings = await this.getSettings();
    const { slots, ...otherData } = updateDto;

    return this.prisma.storeSetting.update({
      where: { id: settings.id },
      data: {
        ...otherData,
        slots: slots
          ? {
              deleteMany: {},
              create: slots
                .filter((slot) => slot.slotTime)
                .map((slot) => ({
                  slotTime: new Date(slot.slotTime!),
                  maxOrders: slot.maxOrders,
                  isActive: slot.isActive,
                })),
            }
          : undefined,
      },
      include: { slots: true },
    });
  }
}
