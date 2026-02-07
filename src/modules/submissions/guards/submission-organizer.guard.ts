import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubmissionsService } from '../submissions.service';
import { HackathonsService } from '../../hackathons/hackathons.service';
import { MembersService } from '../../organizations/members.service';
import { MemberRole } from '../../organizations/enums/member-role.enum';

@Injectable()
export class SubmissionOrganizerGuard implements CanActivate {
  constructor(
    private submissionsService: SubmissionsService,
    private hackathonsService: HackathonsService,
    private membersService: MembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const submissionUuid = request.params.uuid || request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!submissionUuid) {
      return true;
    }

    const submission = await this.submissionsService.findByUuid(submissionUuid);
    const hackathon = await this.hackathonsService.findById(submission.hackathonUuid);
    
    // Check organization membership
    const member = await this.membersService.getMember(
      hackathon.organizationId.toString(),
      user.uuid || user.id || user._id,
    );

    if (!member) {
      throw new ForbiddenException('You do not have access to this hackathon's submissions');
    }

    // Default requirement: ADMIN or EDITOR (Organizer)
    // We can make this configurable via decorator if needed, but for judging/selecting winner usually requires high privs.
    // Judges might be external users later? For now assuming Org Members.
    // "Who can judge/select winners? Hackathon organizers (ADMIN or EDITOR role in organization)"
    
    if (member.role !== MemberRole.ADMIN && member.role !== MemberRole.EDITOR) {
      throw new ForbiddenException('Insufficient permissions to manage submissions');
    }

    request.organizationMember = member;
    return true;
  }
}
