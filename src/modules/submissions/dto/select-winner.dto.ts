import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectWinnerDto {
  @ApiProperty({ description: 'UUID of the prize awarded' })
  @IsString()
  @IsNotEmpty()
  prizeUuid: string;

  @ApiProperty({ description: 'Placement (e.g., 1 for 1st place)', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  placement?: number;

  @ApiProperty({ description: 'Public announcement text', required: false })
  @IsString()
  @IsOptional()
  announcement?: string;
}
