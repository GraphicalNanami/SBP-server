import { IsString, IsNotEmpty, IsEnum, IsArray, IsOptional, IsDateString, IsUrl, IsEmail } from 'class-validator';
import { HackathonCategory } from '../enums/hackathon-category.enum';
import { HackathonVisibility } from '../enums/hackathon-visibility.enum';

export class CreateHackathonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsEnum(HackathonCategory)
  category: HackathonCategory;

  @IsEnum(HackathonVisibility)
  @IsOptional()
  visibility?: HackathonVisibility;

  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @IsString()
  @IsOptional()
  prizePool?: string;

  @IsString()
  @IsOptional()
  prizeAsset?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsOptional()
  preRegistrationEndTime?: string;

  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @IsDateString()
  @IsOptional()
  judgingDeadline?: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsEmail()
  @IsNotEmpty()
  adminContact: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  overview?: string;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsString()
  @IsOptional()
  resources?: string;

  @IsString()
  @IsOptional()
  faq?: string;
}
