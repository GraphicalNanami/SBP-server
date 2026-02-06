import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Stellar Foundation',
    description: 'The name of the organization',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message:
      'Name can only contain alphanumeric characters, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiProperty({
    example: 'https://stellar.org',
    description: 'The website URL of the organization',
  })
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  @IsNotEmpty()
  website: string;

  @ApiProperty({
    example: true,
    description: 'Whether the organization agrees to the terms and conditions',
  })
  @IsBoolean()
  @IsNotEmpty()
  agreeToTerms: boolean;
}
