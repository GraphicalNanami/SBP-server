import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildDto } from './dto/update-build.dto';
import { PublishBuildDto } from './dto/publish-build.dto';
import { ListBuildsDto } from './dto/list-builds.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TransferLeadershipDto } from './dto/transfer-leadership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BuildRoleGuard } from './guards/build-role.guard';
import { RequireBuildPermission } from './decorators/require-build-permission.decorator';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';
import { BuildStatus } from './enums/build-status.enum';
import { BuildVisibility } from './enums/build-visibility.enum';

@ApiTags('Builds')
@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get('public/list')
  @ApiOperation({ summary: 'List published public builds' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of public builds.' })
  async listPublic(@Query() queryDto: ListBuildsDto) {
    return this.buildsService.listPublicBuilds(queryDto);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public build by slug' })
  @ApiResponse({ status: 200, description: 'Returns build details.' })
  @ApiResponse({ status: 404, description: 'Build not found.' })
  async getPublicBySlug(@Param('slug') slug: string) {
    const build = await this.buildsService.findBySlug(slug);
    if (build.status !== BuildStatus.PUBLISHED || build.visibility !== BuildVisibility.PUBLIC) {
      throw new NotFoundException(`Public build with slug ${slug} not found`);
    }
    return build;
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new build' })
  @ApiResponse({ status: 201, description: 'Build created successfully.' })
  async create(@Req() req: any, @Body() createDto: CreateBuildDto) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.create(userId, createDto);
  }

  @Get('my-builds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user\'s builds' })
  @ApiResponse({ status: 200, description: 'Returns list of builds where user is a member.' })
  async listUserBuilds(@Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.listUserBuilds(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get build details' })
  @ApiParam({ name: 'id', description: 'Build UUID' })
  async getBuildDetails(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.getBuildDetails(params.id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @RequireBuildPermission('canEdit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update build details' })
  async update(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() updateDto: UpdateBuildDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.update(params.id, userId, updateDto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish build' })
  async publish(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() publishDto: PublishBuildDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.publish(params.id, userId, publishDto);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive build' })
  async archive(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.archive(params.id, userId);
  }

  // ============================================
  // TEAM MANAGEMENT
  // ============================================

  @Post(':id/team/invite')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @RequireBuildPermission('canInvite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite team member' })
  async inviteTeamMember(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() inviteDto: InviteTeamMemberDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.inviteTeamMember(params.id, userId, inviteDto);
  }

  @Post(':id/team/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept team invitation' })
  async acceptInvitation(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.acceptInvitation(params.id, userId);
  }

  @Post(':id/team/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decline team invitation' })
  async declineInvitation(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.declineInvitation(params.id, userId);
  }

  @Delete(':id/team/:memberUuid')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove team member' })
  @ApiParam({ name: 'memberUuid', description: 'Team member UUID' })
  async removeTeamMember(
    @Param() params: UuidParamDto,
    @Param('memberUuid', ParseUUIDPipe) memberUuid: string,
    @Req() req: any,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.removeTeamMember(params.id, userId, memberUuid);
  }

  @Patch(':id/team/:memberUuid')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team member role/permissions' })
  async updateTeamMember(
    @Param() params: UuidParamDto,
    @Param('memberUuid', ParseUUIDPipe) memberUuid: string,
    @Req() req: any,
    @Body() updateDto: UpdateTeamMemberDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.updateTeamMember(params.id, userId, memberUuid, updateDto);
  }

  @Post(':id/team/transfer-leadership')
  @UseGuards(JwtAuthGuard, BuildRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer team leadership' })
  async transferLeadership(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() dto: TransferLeadershipDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.buildsService.transferLeadership(params.id, userId, dto.newLeadUuid);
  }
}