import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationProfileDto {
  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'The URL of the organization logo',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid logo URL' })
  logo?: string;

  @ApiProperty({
    example: 'Building the future of finance',
    description: 'A short tagline for the organization',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tagline?: string;

  @ApiProperty({
    example: 'We are a non-profit organization...',
    description: 'A detailed description of the organization',
    required: false,
  })
  @IsOptional()
  @IsString()
  about?: string;
}
