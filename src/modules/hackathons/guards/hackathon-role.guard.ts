import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HackathonsService } from '../hackathons.service';
import { MembersService } from '../../organizations/members.service';
import { REQUIRE_HACKATHON_ROLE_KEY } from '../decorators/require-hackathon-role.decorator';
import { MemberRole } from '../../organizations/enums/member-role.enum';

@Injectable()
export class HackathonRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private hackathonsService: HackathonsService,
    private membersService: MembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<MemberRole>(
      REQUIRE_HACKATHON_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const hackathonId = request.params.id || request.params.hackathonId;
    const slug = request.params.slug;

    if (!user) {
      return false;
    }

    let hackathon;
    try {
      if (hackathonId) {
        hackathon = await this.hackathonsService.findById(hackathonId);
      } else if (slug) {
        hackathon = await this.hackathonsService.findBySlug(slug);
      }
    } catch (error) {
      // If hackathon not found, the guard shouldn't necessarily block if it's a public route
      // but usually these routes are authenticated
      return true;
    }

    if (!hackathon) {
      return true;
    }

    const userId = user.id || user._id;

    // Check creator
    if (hackathon.createdBy.toString() === userId.toString()) {
      request.hackathon = hackathon;
      request.hackathonRole = MemberRole.ADMIN;
      return true;
    }

    // Check organization membership
    const member = await this.membersService.getMember(
      hackathon.organizationId.toString(),
      userId,
    );

    if (!member) {
      throw new ForbiddenException('You do not have access to this hackathon');
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

    // Attach to request
    request.hackathon = hackathon;
    request.organizationMember = member;
    request.hackathonRole = member.role;

    return true;
  }
}
