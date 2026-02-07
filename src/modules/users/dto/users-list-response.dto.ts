import { ApiProperty } from '@nestjs/swagger';

export class UserListItemDto {
  @ApiProperty({ description: 'User UUID' })
  uuid: string;

  @ApiProperty({ description: 'Username', required: false })
  username?: string;

  @ApiProperty({ description: 'Full name', required: false })
  name?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'User bio (truncated to 150 chars)', required: false })
  bio?: string;

  @ApiProperty({ description: 'Location', required: false })
  location?: string;

  @ApiProperty({ description: 'User role', required: false })
  role?: string;

  @ApiProperty({ description: 'Joined date' })
  joinedAt: string;

  @ApiProperty({ description: 'Verified status', required: false })
  verified?: boolean;
}

export class PaginationDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class UsersListResponseDto {
  @ApiProperty({ description: 'List of users', type: [UserListItemDto] })
  users: UserListItemDto[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationDto })
  pagination: PaginationDto;
}
