import { ApiProperty } from '@nestjs/swagger';

export class PublicSocialLinksDto {
  @ApiProperty({ required: false })
  github?: string;

  @ApiProperty({ required: false })
  twitter?: string;

  @ApiProperty({ required: false })
  linkedin?: string;

  @ApiProperty({ required: false })
  discord?: string;
}

export class PublicExperienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  organization: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ required: false })
  endDate?: string;

  @ApiProperty()
  current: boolean;
}

export class PublicProfileDto {
  @ApiProperty({ description: 'User UUID' })
  uuid: string;

  @ApiProperty({ description: 'Username', required: false })
  username?: string;

  @ApiProperty({ description: 'Full name', required: false })
  name?: string;

  @ApiProperty({ description: 'User bio', required: false })
  bio?: string;

  @ApiProperty({ description: 'City', required: false })
  city?: string;

  @ApiProperty({ description: 'Country', required: false })
  country?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  website?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'Social links', type: PublicSocialLinksDto, required: false })
  socialLinks?: PublicSocialLinksDto;

  @ApiProperty({ description: 'Public Stellar addresses', type: [String], required: false })
  stellarAddresses?: string[];

  @ApiProperty({ description: 'Work experience', type: [PublicExperienceDto], required: false })
  experience?: PublicExperienceDto[];

  @ApiProperty({ description: 'User joined date' })
  joinedAt: string;
}
