import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CustomAnswerDto } from './custom-answer.dto';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'UUID of the build being submitted' })
  @IsUUID()
  @IsNotEmpty()
  buildUuid: string;

  @ApiProperty({ description: 'UUID of the hackathon' })
  @IsUUID()
  @IsNotEmpty()
  hackathonUuid: string;

  @ApiProperty({ description: 'Array of selected track UUIDs', type: [String] })
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
