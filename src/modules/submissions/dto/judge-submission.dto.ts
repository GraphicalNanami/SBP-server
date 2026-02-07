import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JudgeSubmissionDto {
  @ApiProperty({ description: 'Score from 0 to 100', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ description: 'Feedback for the submission', required: false })
  @IsString()
  @IsOptional()
  feedback?: string;
}
