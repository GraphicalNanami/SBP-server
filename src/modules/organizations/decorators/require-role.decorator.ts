import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';

export const REQUIRE_ROLE_KEY = 'require_role';
export const RequireRole = (role: MemberRole) =>
  SetMetadata(REQUIRE_ROLE_KEY, role);
