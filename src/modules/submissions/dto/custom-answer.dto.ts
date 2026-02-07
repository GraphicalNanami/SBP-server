import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomAnswerDto {
  @ApiProperty({ description: 'UUID of the question' })
  @IsString()
  @IsNotEmpty()
  questionUuid: string;

  @ApiProperty({ description: 'Answer text' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}
