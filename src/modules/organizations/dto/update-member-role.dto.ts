import { IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: MemberRole,
    example: MemberRole.ADMIN,
    description: 'New role to assign to the member',
  })
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;
}
