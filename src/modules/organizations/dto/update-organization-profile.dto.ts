import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid logo URL' })
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tagline?: string;

  @IsOptional()
  @IsString()
  about?: string;
}
