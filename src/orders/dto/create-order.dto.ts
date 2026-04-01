import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FulfillmentType } from '@prisma/client';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  optionValueIds?: string[];
}

export class CreateOrderDto {
  @IsEnum(FulfillmentType)
  @IsNotEmpty()
  fulfillmentType: FulfillmentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsUUID()
  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.home_delivery)
  @IsNotEmpty({ message: 'addressId is required for home delivery' })
  addressId?: string;

  @IsUUID()
  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.click_and_collect)
  @IsNotEmpty({ message: 'slotId is required for click and collect' })
  slotId?: string;

  @IsString()
  @IsOptional()
  specialInstructions?: string;
}
