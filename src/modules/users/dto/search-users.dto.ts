import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @ApiProperty({
    example: 'john@example.com',
    description:
      'Search query - can be email or name (partial match supported)',
    required: true,
  })
  @IsString()
  query: string;

  @ApiProperty({
    example: 10,
    description: 'Number of results to return',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
