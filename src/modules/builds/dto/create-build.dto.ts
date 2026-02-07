import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
  IsEmail,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BuildCategory } from '../enums/build-category.enum';
import { SocialLinkDto } from './social-link.dto';

export class CreateBuildDto {
  @ApiProperty({ example: 'Stellar DeFi Wallet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'The best wallet for Stellar DeFi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tagline: string;

  @ApiProperty({ enum: BuildCategory, example: BuildCategory.DEFI })
  @IsEnum(BuildCategory)
  category: BuildCategory;

  @ApiProperty({ example: 'To revolutionize payments...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  vision: string;

  @ApiProperty({ example: '# Features\n\n...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty({ example: 'https://github.com/example/repo', required: false })
  @IsUrl()
  @IsOptional()
  githubRepository?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'https://youtube.com/watch?v=...', required: false })
  @IsUrl()
  @IsOptional()
  demoVideo?: string;

  @ApiProperty({ type: [SocialLinkDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  @IsOptional()
  socialLinks?: SocialLinkDto[];

  @ApiProperty({ example: 'A team of passionate developers...' })
  @IsString()
  @IsNotEmpty()
  teamDescription: string;

  @ApiProperty({ example: '@teamlead' })
  @IsString()
  @IsNotEmpty()
  teamLeadTelegram: string;

  @ApiProperty({ example: 'contact@example.com' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiProperty({ example: ['https://twitter.com/team'], required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  teamSocials?: string[];
}
