import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrganizationsService } from '@/src/modules/organizations/organizations.service';
import { CreateOrganizationDto } from '@/src/modules/organizations/dto/create-organization.dto';
import { UpdateOrganizationProfileDto } from '@/src/modules/organizations/dto/update-organization-profile.dto';
import { UpdateSocialLinksDto } from '@/src/modules/organizations/dto/update-social-links.dto';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '@/src/modules/organizations/guards/organization-role.guard';
import { RequireRole } from '@/src/modules/organizations/decorators/require-role.decorator';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.uuid, createDto);
  }

  @Get('me')
  async getMyOrganizations(@Req() req: any) {
    return this.organizationsService.findUserOrganizations(req.user.uuid);
  }

  @Get(':id')
  @UseGuards(OrganizationRoleGuard)
  async getById(@Param() params: UuidParamDto) {
    return this.organizationsService.findById(params.id);
  }

  @Patch(':id/profile')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  async updateProfile(
    @Param() params: UuidParamDto,
    @Body() updateDto: UpdateOrganizationProfileDto,
  ) {
    return this.organizationsService.updateProfile(params.id, updateDto);
  }

  @Patch(':id/social-links')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  async updateSocialLinks(
    @Param() params: UuidParamDto,
    @Body() updateDto: UpdateSocialLinksDto,
  ) {
    return this.organizationsService.updateSocialLinks(params.id, updateDto);
  }
}
