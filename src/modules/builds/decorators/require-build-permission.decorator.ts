import { SetMetadata } from '@nestjs/common';

export const REQUIRE_BUILD_PERMISSION_KEY = 'requireBuildPermission';
export const RequireBuildPermission = (permission: 'canEdit' | 'canInvite' | 'canSubmit') =>
  SetMetadata(REQUIRE_BUILD_PERMISSION_KEY, permission);
