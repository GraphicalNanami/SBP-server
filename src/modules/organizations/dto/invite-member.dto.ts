import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from '../enums/member-role.enum';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole = MemberRole.VIEWER;
}
