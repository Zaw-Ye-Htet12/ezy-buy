import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PickupSlotDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  slotTime?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxOrders?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateStoreSettingDto {
  @IsString()
  @IsOptional()
  storeName?: string;

  @IsNumber()
  @IsOptional()
  storeLatitude?: number;

  @IsNumber()
  @IsOptional()
  storeLongitude?: number;

  @IsNumber()
  @IsOptional()
  deliveryRadiusKm?: number;

  @IsNumber()
  @IsOptional()
  deliveryFeePerKm?: number;

  @IsNumber()
  @IsOptional()
  minDeliveryFee?: number;

  @IsBoolean()
  @IsOptional()
  isAcceptingOrders?: boolean;

  @IsObject()
  @IsOptional()
  openingHours?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickupSlotDto)
  @IsOptional()
  slots?: PickupSlotDto[];
}
