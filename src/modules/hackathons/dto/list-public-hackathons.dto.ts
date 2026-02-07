import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum HackathonTimeFilter {
  ALL = 'all',
  UPCOMING = 'upcoming', // Not started yet (before startTime)
  ONGOING = 'ongoing', // Started but before submission deadline
  PAST = 'past', // After submission deadline
}

export class ListPublicHackathonsDto {
  @ApiProperty({
    enum: HackathonTimeFilter,
    description: 'Filter hackathons by time period',
    example: HackathonTimeFilter.UPCOMING,
    required: false,
    default: HackathonTimeFilter.ALL,
  })
  @IsEnum(HackathonTimeFilter)
  @IsOptional()
  filter?: HackathonTimeFilter = HackathonTimeFilter.ALL;

  @ApiProperty({
    example: 20,
    description: 'Number of hackathons to return',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    example: 0,
    description: 'Number of hackathons to skip (for pagination)',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
