import { IsEnum, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BuildCategory } from '../enums/build-category.enum';

export class ListBuildsDto {
  @ApiProperty({ enum: BuildCategory, required: false })
  @IsEnum(BuildCategory)
  @IsOptional()
  category?: BuildCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: ['newest', 'oldest', 'popular'], required: false })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
