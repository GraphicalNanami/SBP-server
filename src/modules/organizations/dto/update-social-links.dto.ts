import { IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSocialLinksDto {
  @ApiProperty({
    example: 'https://twitter.com/stellarorg',
    description: 'Twitter profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiProperty({
    example: 'https://t.me/stellar',
    description: 'Telegram group URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  telegram?: string;

  @ApiProperty({
    example: 'https://github.com/stellar',
    description: 'GitHub profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiProperty({
    example: 'https://discord.gg/stellar',
    description: 'Discord server URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  discord?: string;

  @ApiProperty({
    example: 'https://linkedin.com/company/stellar',
    description: 'LinkedIn profile URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;
}
