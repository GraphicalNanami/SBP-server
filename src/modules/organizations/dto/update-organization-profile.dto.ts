import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUrlOrDataUri, MaxImageSize } from '@/src/common/validators';

export class UpdateOrganizationProfileDto {
  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL of the organization logo or base64 data URI (data:image/...;base64,...). Max size: 10MB',
    required: false,
  })
  @IsOptional()
  @IsUrlOrDataUri()
  @MaxImageSize(10)
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
