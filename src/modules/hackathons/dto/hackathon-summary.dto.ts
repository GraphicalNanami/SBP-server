import { ApiProperty } from '@nestjs/swagger';
import { HackathonStatus } from '../enums/hackathon-status.enum';
import { HackathonCategory } from '../enums/hackathon-category.enum';
import { HackathonVisibility } from '../enums/hackathon-visibility.enum';

export class HackathonSummaryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Hackathon UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'stellar-defi-hackathon-2024',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiProperty({
    example: 'Stellar DeFi Hackathon 2024',
    description: 'Hackathon name',
  })
  name: string;

  @ApiProperty({
    enum: HackathonCategory,
    example: HackathonCategory.DEFI,
    description: 'Hackathon category',
  })
  category: HackathonCategory;

  @ApiProperty({
    example: 'Build the future of decentralized finance on Stellar',
    description: 'Short description',
  })
  description: string;

  @ApiProperty({
    example: 'https://example.com/poster.png',
    description: 'Poster/banner image URL',
    required: false,
  })
  posterUrl?: string;

  @ApiProperty({
    example: '25000',
    description: 'Total prize pool',
    required: false,
  })
  prizePool?: string;

  @ApiProperty({
    example: 'XLM',
    description: 'Prize asset',
    required: false,
  })
  prizeAsset?: string;

  @ApiProperty({
    example: ['DeFi', 'Soroban', 'Smart Contracts'],
    description: 'Hackathon tags',
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    example: '2024-06-01T09:00:00.000Z',
    description: 'Start time',
  })
  startTime: Date;

  @ApiProperty({
    example: '2024-06-03T17:00:00.000Z',
    description: 'Submission deadline',
  })
  submissionDeadline: Date;

  @ApiProperty({
    example: 'Online',
    description: 'Hackathon venue',
  })
  venue: string;

  @ApiProperty({
    enum: HackathonStatus,
    example: HackathonStatus.APPROVED,
    description: 'Hackathon status',
  })
  status: HackathonStatus;

  @ApiProperty({
    enum: HackathonVisibility,
    example: HackathonVisibility.PUBLIC,
    description: 'Visibility setting',
  })
  visibility: HackathonVisibility;

  @ApiProperty({
    example: 'e2ba96b2-5053-4f1e-aba6-89e6ff28641b',
    description: 'Organization UUID',
  })
  organizationId: string;

  @ApiProperty({
    example: '2024-02-01T09:00:00.000Z',
    description: 'Created at timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-06T10:30:00.000Z',
    description: 'Last updated timestamp',
  })
  updatedAt: Date;

  static fromHackathon(hackathon: any): HackathonSummaryDto {
    return {
      uuid: hackathon.uuid,
      slug: hackathon.slug,
      name: hackathon.name,
      category: hackathon.category,
      description: hackathon.description,
      posterUrl: hackathon.posterUrl,
      prizePool: hackathon.prizePool,
      prizeAsset: hackathon.prizeAsset,
      tags: hackathon.tags || [],
      startTime: hackathon.startTime,
      submissionDeadline: hackathon.submissionDeadline,
      venue: hackathon.venue,
      status: hackathon.status,
      visibility: hackathon.visibility,
      organizationId:
        hackathon.organizationId?.uuid || hackathon.organizationId?.toString(),
      createdAt: hackathon.createdAt,
      updatedAt: hackathon.updatedAt,
    };
  }
}
