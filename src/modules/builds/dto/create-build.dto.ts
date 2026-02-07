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
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BuildCategory } from '../enums/build-category.enum';
import { SocialLinkDto } from './social-link.dto';
import { IsUrlOrDataUri, MaxImageSize } from '@/src/common/validators';

export class CreateBuildDto {
  @ApiProperty({ example: 'Stellar DeFi Wallet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'The best wallet for Stellar DeFi', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  tagline?: string;

  @ApiProperty({
    enum: BuildCategory,
    example: BuildCategory.DEFI,
    required: false,
  })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(BuildCategory)
  @IsOptional()
  category?: BuildCategory;

  @ApiProperty({ example: 'To revolutionize payments...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  vision?: string;

  @ApiProperty({ example: '# Features\n\n...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'Logo URL or base64 data URI (data:image/...;base64,...). Max size: 10MB',
    required: false,
  })
  @IsUrlOrDataUri()
  @MaxImageSize(10)
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

  @ApiProperty({
    example: 'A team of passionate developers...',
    required: false,
  })
  @IsString()
  @IsOptional()
  teamDescription?: string;

  @ApiProperty({ example: '@teamlead', required: false })
  @IsString()
  @IsOptional()
  teamLeadTelegram?: string;

  @ApiProperty({ example: 'contact@example.com', required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ example: ['https://twitter.com/team'], required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  teamSocials?: string[];
}
