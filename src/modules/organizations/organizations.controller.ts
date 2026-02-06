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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateOrganizationDto) {
    const userId = req.user.id || req.user._id;
    return this.organizationsService.create(userId, createDto);
  }

  @Get('me')
  async getMyOrganizations(@Req() req: any) {
    const userId = req.user.id || req.user._id;
    return this.organizationsService.findUserOrganizations(userId);
  }

  @Get(':id')
  @UseGuards(OrganizationRoleGuard)
  async getById(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Patch(':id/profile')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  async updateProfile(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationProfileDto,
  ) {
    return this.organizationsService.updateProfile(id, updateDto);
  }

  @Patch(':id/social-links')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  async updateSocialLinks(
    @Param('id') id: string,
    @Body() updateDto: UpdateSocialLinksDto,
  ) {
    return this.organizationsService.updateSocialLinks(id, updateDto);
  }
}
