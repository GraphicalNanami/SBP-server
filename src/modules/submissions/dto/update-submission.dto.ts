import { IsArray, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CustomAnswerDto } from './custom-answer.dto';

export class UpdateSubmissionDto {
  @ApiProperty({ description: 'Array of selected track UUIDs', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedTrackUuids?: string[];

  @ApiProperty({ description: 'Answers to custom questions', type: [CustomAnswerDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomAnswerDto)
  @IsOptional()
  customAnswers?: CustomAnswerDto[];
}
