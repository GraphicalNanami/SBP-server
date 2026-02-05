import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain alphanumeric characters, spaces, hyphens, and underscores',
  })
  name: string;

  @IsUrl({}, { message: 'Please provide a valid website URL' })
  @IsNotEmpty()
  website: string;

  @IsBoolean()
  @IsNotEmpty()
  agreeToTerms: boolean;
}
