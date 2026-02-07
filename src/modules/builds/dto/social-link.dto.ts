import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SocialLinkDto {
  @ApiProperty({ example: 'Twitter' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ example: 'https://twitter.com/example' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}
