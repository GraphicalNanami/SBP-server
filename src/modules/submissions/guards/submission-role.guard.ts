import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubmissionsService } from '../submissions.service';
import { BuildsService } from '../../builds/builds.service';

@Injectable()
export class SubmissionRoleGuard implements CanActivate {
  constructor(
    private submissionsService: SubmissionsService,
    private buildsService: BuildsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const submissionUuid = request.params.uuid || request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!submissionUuid) {
      // If creating a submission, we can't check submission UUID.
      // But we can check buildUuid in body if this guard is used on POST /submissions
      // Plan says "Validate user can modify submission".
      // Usually applied to :uuid endpoints.
      return true;
    }

    const submission = await this.submissionsService.findByUuid(submissionUuid);
    const build = await this.buildsService.findByUuid(submission.buildUuid);

    // Check if user has canSubmit permission (which implies editing too for submissions)
    // Or we can be more granular. Plan says "Validate user is LEAD or has canSubmit".
    await this.buildsService.validateUserPermission(build, user.uuid || user.id || user._id, 'canSubmit');

    return true;
  }
}
