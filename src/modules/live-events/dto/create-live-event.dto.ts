
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';

export class HostDto {
  @ApiProperty({ description: 'Name of the host', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Role of the host', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiPropertyOptional({ description: 'URL to the avatar of the host', maxLength: 500 })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar?: string;
}

export class CreateLiveEventDto {
  @ApiProperty({ description: 'Title of the event', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Description of the event', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Start date of the event in ISO 8601 format' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of the event in ISO 8601 format' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: EventType, description: 'Type of the event' })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ description: 'Country of the event', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ description: 'Location of the event', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiProperty({ type: [HostDto], description: 'List of hosts for the event' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HostDto)
  hosts: HostDto[];

  @ApiPropertyOptional({ description: 'URL of the event banner', maxLength: 500 })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'External URL for the event', maxLength: 500 })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  externalUrl?: string;

  @ApiPropertyOptional({
    description: 'Tags for the event',
    type: [String],
    maxLength: 50,
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(20)
  tags?: string[];
}
