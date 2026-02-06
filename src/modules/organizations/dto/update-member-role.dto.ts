import { IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from '../enums/member-role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;
}
