import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '@/src/modules/users/users.service';
import { SearchUsersDto } from '@/src/modules/users/dto/search-users.dto';
import { UserMinimalDto } from '@/src/modules/users/dto/user-minimal.dto';
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
}
