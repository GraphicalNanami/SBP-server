import { IsOptional, IsUrl } from 'class-validator';

export class UpdateSocialLinksDto {
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  telegram?: string;

  @IsOptional()
  @IsUrl()
  github?: string;

  @IsOptional()
  @IsUrl()
  discord?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;
}
