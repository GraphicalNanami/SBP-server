import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Web3SkillLevel } from '@/src/modules/experience/enums/web3-skill-level.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExperienceDto {
  @ApiProperty({
    example: ['Frontend Developer', 'Backend Developer'],
    description: 'List of roles',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @MaxLength(50, { each: true })
  roles?: string[];

  @ApiProperty({
    example: 5,
    description: 'Years of experience',
    required: false,
    minimum: 0,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @ApiProperty({
    enum: Web3SkillLevel,
    example: Web3SkillLevel.INTERMEDIATE,
    description: 'Web3 skill level',
    required: false,
  })
  @IsOptional()
  @IsEnum(Web3SkillLevel)
  web3SkillLevel?: Web3SkillLevel;

  @ApiProperty({
    example: ['JavaScript', 'TypeScript', 'Rust'],
    description: 'List of programming languages',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(30, { each: true })
  programmingLanguages?: string[];

  @ApiProperty({
    example: ['VS Code', 'Git'],
    description: 'List of developer tools',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @MaxLength(50, { each: true })
  developerTools?: string[];
}

export class UpdateExperienceDto {
  @ApiProperty({
    example: ['Full Stack Developer'],
    description: 'Roles to add',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  addRoles?: string[];

  @ApiProperty({
    example: ['Frontend Developer'],
    description: 'Roles to remove',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeRoles?: string[];

  @ApiProperty({
    example: ['Go'],
    description: 'Programming languages to add',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  addLanguages?: string[];

  @ApiProperty({
    example: ['JavaScript'],
    description: 'Programming languages to remove',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeLanguages?: string[];

  @ApiProperty({
    example: ['Docker'],
    description: 'Developer tools to add',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  addTools?: string[];

  @ApiProperty({
    example: ['VS Code'],
    description: 'Developer tools to remove',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeTools?: string[];

  @ApiProperty({
    example: 6,
    description: 'Years of experience',
    required: false,
    minimum: 0,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @ApiProperty({
    enum: Web3SkillLevel,
    example: Web3SkillLevel.ADVANCED,
    description: 'Web3 skill level',
    required: false,
  })
  @IsOptional()
  @IsEnum(Web3SkillLevel)
  web3SkillLevel?: Web3SkillLevel;
}

export class ExperienceResponseDto {
  @ApiProperty({
    example: ['Frontend Developer'],
    description: 'List of roles',
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    example: 5,
    description: 'Years of experience',
    required: false,
  })
  yearsOfExperience?: number;

  @ApiProperty({
    enum: Web3SkillLevel,
    example: Web3SkillLevel.INTERMEDIATE,
    description: 'Web3 skill level',
    required: false,
  })
  web3SkillLevel?: Web3SkillLevel;

  @ApiProperty({
    example: ['JavaScript'],
    description: 'List of programming languages',
    type: [String],
  })
  programmingLanguages: string[];

  @ApiProperty({
    example: ['VS Code'],
    description: 'List of developer tools',
    type: [String],
  })
  developerTools: string[];
}
