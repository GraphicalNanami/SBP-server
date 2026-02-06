import { IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;
}
