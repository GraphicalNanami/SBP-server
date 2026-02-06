import { IsArray, IsEnum, IsInt, IsOptional, Max, Min, IsString, MaxLength, ArrayMaxSize } from 'class-validator';
import { Web3SkillLevel } from '@/src/modules/experience/enums/web3-skill-level.enum';

export class CreateExperienceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @MaxLength(50, { each: true })
  roles?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsEnum(Web3SkillLevel)
  web3SkillLevel?: Web3SkillLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(30, { each: true })
  programmingLanguages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @MaxLength(50, { each: true })
  developerTools?: string[];
}

export class UpdateExperienceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  addRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  addLanguages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeLanguages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  addTools?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeTools?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsEnum(Web3SkillLevel)
  web3SkillLevel?: Web3SkillLevel;
}

export class ExperienceResponseDto {
  roles: string[];
  yearsOfExperience?: number;
  web3SkillLevel?: Web3SkillLevel;
  programmingLanguages: string[];
  developerTools: string[];
}
