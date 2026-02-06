import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '../../organizations/enums/member-role.enum';

export const REQUIRE_HACKATHON_ROLE_KEY = 'require_hackathon_role';
export const RequireHackathonRole = (role: MemberRole) =>
  SetMetadata(REQUIRE_HACKATHON_ROLE_KEY, role);
