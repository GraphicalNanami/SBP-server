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

@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async listMembers(@Param() params: UuidParamDto, @Query() query: any) {
    return this.membersService.findByOrganizationId(params.id, query);
  }

  @Post('invite')
  @RequireRole(MemberRole.ADMIN)
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
  async removeMember(
    @Param() params: MemberParamsDto,
    @Req() req: any,
  ) {
    return this.membersService.removeMember(params.id, params.memberId, req.user.uuid);
  }
}
