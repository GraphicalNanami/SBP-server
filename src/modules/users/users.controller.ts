import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '@/src/modules/users/users.service';
import { SearchUsersDto } from '@/src/modules/users/dto/search-users.dto';
import { UserMinimalDto } from '@/src/modules/users/dto/user-minimal.dto';
import { UsersListQueryDto } from '@/src/modules/users/dto/users-list-query.dto';
import { UsersListResponseDto } from '@/src/modules/users/dto/users-list-response.dto';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search users by email or name',
    description:
      'Search for users using partial email or name matching. Returns minimal user information suitable for invitations and user selection. Case-insensitive search.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search term (email or name)',
    example: 'john',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results (1-50)',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of matching users with minimal information.',
    type: [UserMinimalDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  async searchUsers(
    @Query() searchDto: SearchUsersDto,
  ): Promise<UserMinimalDto[]> {
    const users = await this.usersService.searchUsers(
      searchDto.query,
      searchDto.limit,
    );
    return users.map((user) => UserMinimalDto.fromUser(user));
  }

  @Get('list')
  @ApiOperation({
    summary: 'Get paginated list of users',
    description:
      'Public endpoint to retrieve a paginated list of users with basic information. Supports search, filtering, and sorting. No authentication required.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page (1-100)',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by username or name',
    example: 'john',
    required: false,
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter by role',
    example: 'organizer',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort field (joinedAt, name, username)',
    example: 'joinedAt',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order (asc, desc)',
    example: 'desc',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users.',
    type: UsersListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters.',
  })
  async getUsersList(
    @Query() query: UsersListQueryDto,
  ): Promise<UsersListResponseDto> {
    return this.usersService.getUsersList(query);
  }
}
