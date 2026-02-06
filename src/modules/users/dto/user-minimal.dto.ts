import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/src/common/enums/user-role.enum';

export class UserMinimalDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User display name',
  })
  name: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: 'User avatar URL',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
  })
  role: UserRole;

  constructor(partial: Partial<UserMinimalDto>) {
    Object.assign(this, partial);
  }

  static fromUser(user: any): UserMinimalDto {
    return new UserMinimalDto({
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    });
  }
}
