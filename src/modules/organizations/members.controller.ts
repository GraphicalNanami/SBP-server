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
import { MembersService } from '@/modules/organizations/members.service';
import { InviteMemberDto } from '@/modules/organizations/dto/invite-member.dto';
import { UpdateMemberRoleDto } from '@/modules/organizations/dto/update-member-role.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '@/modules/organizations/guards/organization-role.guard';
import { RequireRole } from '@/modules/organizations/decorators/require-role.decorator';
import { MemberRole } from '@/modules/organizations/enums/member-role.enum';

@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async listMembers(@Param('id') orgId: string, @Query() query: any) {
    return this.membersService.findByOrganizationId(orgId, query);
  }

  @Post('invite')
  @RequireRole(MemberRole.ADMIN)
  async inviteMember(
    @Param('id') orgId: string,
    @Req() req: any,
    @Body() inviteDto: InviteMemberDto,
  ) {
    const userId = req.user.id || req.user._id;
    return this.membersService.inviteMember(
      orgId,
      userId,
      inviteDto.email,
      inviteDto.role,
    );
  }

  @Patch(':memberId/role')
  @RequireRole(MemberRole.ADMIN)
  async updateRole(
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    const userId = req.user.id || req.user._id;
    return this.membersService.updateMemberRole(
      orgId,
      memberId,
      updateDto.role,
      userId,
    );
  }

  @Delete(':memberId')
  @RequireRole(MemberRole.ADMIN)
  async removeMember(
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id || req.user._id;
    return this.membersService.removeMember(orgId, memberId, userId);
  }
}
