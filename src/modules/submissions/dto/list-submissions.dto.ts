import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../enums/submission-status.enum';

export class ListSubmissionsDto {
  @ApiProperty({ description: 'UUID of the hackathon' })
  @IsString()
  @IsNotEmpty()
  hackathonUuid: string;

  @ApiProperty({ enum: SubmissionStatus, required: false })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @ApiProperty({ description: 'Filter by track UUID', required: false })
  @IsString()
  @IsOptional()
  trackUuid?: string;

  @ApiProperty({ enum: ['newest', 'oldest', 'score'], required: false })
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
