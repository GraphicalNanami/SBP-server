import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembersService } from '../members.service';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';
import { MemberRole } from '../enums/member-role.enum';

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membersService: MembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<MemberRole>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.id;

    if (!user) {
      return false;
    }

    if (!orgId) {
      return true;
    }

    const member = await this.membersService.getMember(
      orgId,
      user.id || user._id,
    );
    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Role hierarchy check
    const rolePriority = {
      [MemberRole.ADMIN]: 3,
      [MemberRole.EDITOR]: 2,
      [MemberRole.VIEWER]: 1,
    };

    if (
      requiredRole &&
      rolePriority[member.role] < rolePriority[requiredRole]
    ) {
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${requiredRole}`,
      );
    }

    // Attach membership to request for later use
    request.organizationMember = member;

    return true;
  }
}
