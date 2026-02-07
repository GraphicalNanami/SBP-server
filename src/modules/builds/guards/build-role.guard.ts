import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BuildsService } from '../builds.service';
import { REQUIRE_BUILD_PERMISSION_KEY } from '../decorators/require-build-permission.decorator';

@Injectable()
export class BuildRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private buildsService: BuildsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      'canEdit' | 'canInvite' | 'canSubmit'
    >(REQUIRE_BUILD_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true; // No specific permission required, just authenticated (handled by JwtAuthGuard)
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const buildUuid = request.params.uuid || request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!buildUuid) {
      throw new ForbiddenException('Build UUID not found in request');
    }

    // Use service to validate permission
    // Note: service.validateUserPermission throws ForbiddenException if invalid
    await this.buildsService.validateUserPermission(
      await this.buildsService.findByUuid(buildUuid),
      user.uuid || user.id || user._id,
      requiredPermission,
    );

    return true;
  }
}
