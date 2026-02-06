import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { MembersService } from '@/src/modules/organizations/members.service';
import { InviteMemberDto } from '@/src/modules/organizations/dto/invite-member.dto';
import { UpdateMemberRoleDto } from '@/src/modules/organizations/dto/update-member-role.dto';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '@/src/modules/organizations/guards/organization-role.guard';
import { RequireRole } from '@/src/modules/organizations/decorators/require-role.decorator';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';
import { MemberParamsDto } from '@/src/modules/organizations/dto/member-params.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Organization Members')
@ApiBearerAuth()
@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List organization members' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Return list of members.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async listMembers(@Param() params: UuidParamDto, @Query() query: any) {
    return this.membersService.findByOrganizationId(params.id, query);
  }

  @Post('invite')
  @RequireRole(MemberRole.ADMIN)
  @ApiOperation({ summary: 'Invite a member to the organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Member invited successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
  async inviteMember(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.membersService.inviteMember(
      params.id,
      req.user.uuid,
      inviteDto.email,
      inviteDto.role,
    );
  }

  @Patch(':memberId/role')
  @RequireRole(MemberRole.ADMIN)
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID (User ID)' })
  @ApiResponse({ status: 200, description: 'Member role updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
  async updateRole(
    @Param() params: MemberParamsDto,
    @Req() req: any,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(
      params.id,
      params.memberId,
      updateDto.role,
      req.user.uuid,
    );
  }

  @Delete(':memberId')
  @RequireRole(MemberRole.ADMIN)
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID (User ID)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
  async removeMember(@Param() params: MemberParamsDto, @Req() req: any) {
    return this.membersService.removeMember(
      params.id,
      params.memberId,
      req.user.uuid,
    );
  }
}
