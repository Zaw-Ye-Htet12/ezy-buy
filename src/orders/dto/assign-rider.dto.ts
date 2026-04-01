import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRiderDto {
  @IsUUID()
  @IsNotEmpty()
  riderId: string;
}
