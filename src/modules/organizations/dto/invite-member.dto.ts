import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the user to invite',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: MemberRole,
    example: MemberRole.VIEWER,
    description: 'Role to assign to the invited user',
    default: MemberRole.VIEWER,
  })
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole = MemberRole.VIEWER;
}
