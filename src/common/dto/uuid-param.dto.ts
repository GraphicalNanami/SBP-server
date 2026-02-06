import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @IsUUID(4, { message: 'Invalid UUID format' })
  id: string;
}
