import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Gender } from '@/src/common/enums/gender.enum';

export class UpdatePersonalInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
