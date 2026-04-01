import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Address } from '@prisma/client';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateAddressDto): Promise<Address> {
    if (createDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Checking if first address, make it default
    const count = await this.prisma.address.count({ where: { userId } });
    if (count === 0) {
      createDto.isDefault = true;
    }

    return this.prisma.address.create({
      data: {
        ...createDto,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Address> {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async remove(userId: string, id: string): Promise<Address> {
    const address = await this.findOne(userId, id);
    return this.prisma.address.delete({
      where: { id: address.id },
    });
  }
}
