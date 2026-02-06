import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { HackathonCategory } from '../enums/hackathon-category.enum';
import { HackathonVisibility } from '../enums/hackathon-visibility.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHackathonDto {
  @ApiProperty({
    example: 'Stellar Hackathon 2024',
    description: 'Name of the hackathon',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization UUID',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    enum: HackathonCategory,
    example: HackathonCategory.GENERAL,
    description: 'Category of the hackathon',
  })
  @IsEnum(HackathonCategory)
  category: HackathonCategory;

  @ApiProperty({
    enum: HackathonVisibility,
    example: HackathonVisibility.PUBLIC,
    description: 'Visibility of the hackathon',
    required: false,
    default: HackathonVisibility.PUBLIC,
  })
  @IsEnum(HackathonVisibility)
  @IsOptional()
  visibility?: HackathonVisibility;

  @ApiProperty({
    example: 'https://example.com/poster.png',
    description: 'URL of the hackathon poster',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @ApiProperty({
    example: '10000',
    description: 'Prize pool amount',
    required: false,
  })
  @IsString()
  @IsOptional()
  prizePool?: string;

  @ApiProperty({
    example: 'XLM',
    description: 'Asset used for prizes',
    required: false,
  })
  @IsString()
  @IsOptional()
  prizeAsset?: string;

  @ApiProperty({
    example: ['DeFi', 'NFT', 'Soroban'],
    description: 'Tags related to the hackathon',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: '2024-01-01T09:00:00Z',
    description: 'Start time of the hackathon',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '2023-12-31T23:59:59Z',
    description: 'End time for pre-registration',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  preRegistrationEndTime?: string;

  @ApiProperty({
    example: '2024-01-03T17:00:00Z',
    description: 'Deadline for project submissions',
  })
  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @ApiProperty({
    example: '2024-01-05T17:00:00Z',
    description: 'Deadline for judging',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  judgingDeadline?: string;

  @ApiProperty({
    example: 'Online',
    description: 'Venue of the hackathon',
  })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({
    example: 'contact@stellar.org',
    description: 'Contact email for the admin',
  })
  @IsEmail()
  @IsNotEmpty()
  adminContact: string;

  @ApiProperty({
    example: 'A global hackathon for building on Stellar.',
    description: 'Short description of the hackathon',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: '# Overview\n\nThis hackathon is about...',
    description: 'Detailed overview (Markdown supported)',
    required: false,
  })
  @IsString()
  @IsOptional()
  overview?: string;

  @ApiProperty({
    example: '# Rules\n\n1. Be nice...',
    description: 'Hackathon rules (Markdown supported)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiProperty({
    example: '# Schedule\n\nDay 1...',
    description: 'Hackathon schedule (Markdown supported)',
    required: false,
  })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiProperty({
    example: '# Resources\n\n- [Docs](https://docs.stellar.org)...',
    description: 'Helpful resources (Markdown supported)',
    required: false,
  })
  @IsString()
  @IsOptional()
  resources?: string;

  @ApiProperty({
    example: '# FAQ\n\nQ: ...',
    description: 'Frequently Asked Questions (Markdown supported)',
    required: false,
  })
  @IsString()
  @IsOptional()
  faq?: string;
}
