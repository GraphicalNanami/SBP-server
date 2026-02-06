import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  IsUrl,
  IsEmail,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsObject,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonCategory } from '../enums/hackathon-category.enum';
import { HackathonVisibility } from '../enums/hackathon-visibility.enum';
import { QuestionType } from '../enums/question-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTrackDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Track UUID (for updates/deletes)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @ApiProperty({ example: 'DeFi Track', description: 'Track name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Build decentralized finance solutions',
    description: 'Track description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'Display order', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({
    example: true,
    description: 'Is track active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePlacementDto {
  @ApiProperty({ example: 1, description: 'Placement position' })
  @IsNumber()
  placement: number;

  @ApiProperty({ example: 5000, description: 'Prize amount' })
  @IsNumber()
  amount: number;
}

export class UpdatePrizeDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Prize UUID (for updates/deletes)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @ApiProperty({ example: 'Grand Prize', description: 'Prize name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Associated track UUID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  trackUuid?: string;

  @ApiProperty({
    type: [UpdatePlacementDto],
    description: 'Prize placements',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlacementDto)
  @IsOptional()
  placements?: UpdatePlacementDto[];

  @ApiProperty({
    example: true,
    description: 'Is prize active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCustomQuestionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Question UUID (for updates/deletes)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @ApiProperty({
    example: 'What is your team size?',
    description: 'Question text',
  })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.TEXT,
    description: 'Type of question',
  })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiProperty({
    example: ['1-2', '3-5', '6+'],
    description: 'Options for multiple choice questions',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiProperty({
    example: false,
    description: 'Is answer required',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ example: 0, description: 'Display order', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateSubmissionRequirementsDto {
  @ApiProperty({
    example: true,
    description: 'Require repository link',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireRepository?: boolean;

  @ApiProperty({
    example: true,
    description: 'Require demo link',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireDemo?: boolean;

  @ApiProperty({
    example: true,
    description: 'Require Soroban contract ID',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireSorobanContractId?: boolean;

  @ApiProperty({
    example: true,
    description: 'Require Stellar address',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireStellarAddress?: boolean;

  @ApiProperty({
    example: false,
    description: 'Require pitch deck',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requirePitchDeck?: boolean;

  @ApiProperty({
    example: false,
    description: 'Require video demo',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireVideoDemo?: boolean;

  @ApiProperty({
    example: 'Please include a README with setup instructions',
    description: 'Custom submission instructions',
    required: false,
  })
  @IsString()
  @IsOptional()
  customInstructions?: string;
}

export class UpdateHackathonDto {
  @ApiProperty({
    example: 'Stellar Hackathon 2024',
    description: 'Name of the hackathon',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    enum: HackathonCategory,
    example: HackathonCategory.GENERAL,
    description: 'Category of the hackathon',
    required: false,
  })
  @IsEnum(HackathonCategory)
  @IsOptional()
  category?: HackathonCategory;

  @ApiProperty({
    enum: HackathonVisibility,
    example: HackathonVisibility.PUBLIC,
    description: 'Visibility of the hackathon',
    required: false,
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
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

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
    required: false,
  })
  @IsDateString()
  @IsOptional()
  submissionDeadline?: string;

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
    required: false,
  })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiProperty({
    example: 'contact@stellar.org',
    description: 'Contact email for the admin',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  adminContact?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization UUID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    example: 'A global hackathon for building on Stellar.',
    description: 'Short description of the hackathon',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({
    type: [UpdateTrackDto],
    description: 'Hackathon tracks',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTrackDto)
  @IsOptional()
  tracks?: UpdateTrackDto[];

  @ApiProperty({
    type: [UpdatePrizeDto],
    description: 'Hackathon prizes',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePrizeDto)
  @IsOptional()
  prizes?: UpdatePrizeDto[];

  @ApiProperty({
    type: [UpdateCustomQuestionDto],
    description: 'Custom registration questions',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCustomQuestionDto)
  @IsOptional()
  customRegistrationQuestions?: UpdateCustomQuestionDto[];

  @ApiProperty({
    type: UpdateSubmissionRequirementsDto,
    description: 'Submission requirements',
    required: false,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateSubmissionRequirementsDto)
  @IsOptional()
  submissionRequirements?: UpdateSubmissionRequirementsDto;
}
