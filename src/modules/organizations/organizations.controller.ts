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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Req() req: any, @Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.uuid, createDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my organizations' })
  @ApiResponse({
    status: 200,
    description: 'Return list of user organizations.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyOrganizations(@Req() req: any) {
    return this.organizationsService.findUserOrganizations(req.user.uuid);
  }

  @Get(':id')
  @UseGuards(OrganizationRoleGuard)
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Return organization details.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getById(@Param() params: UuidParamDto) {
    return this.organizationsService.findById(params.id);
  }

  @Patch(':id/profile')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  @ApiOperation({ summary: 'Update organization profile' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization profile updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
  async updateProfile(
    @Param() params: UuidParamDto,
    @Body() updateDto: UpdateOrganizationProfileDto,
  ) {
    return this.organizationsService.updateProfile(params.id, updateDto);
  }

  @Patch(':id/social-links')
  @UseGuards(OrganizationRoleGuard)
  @RequireRole(MemberRole.ADMIN)
  @ApiOperation({ summary: 'Update organization social links' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({
    status: 200,
    description: 'Organization social links updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
  async updateSocialLinks(
    @Param() params: UuidParamDto,
    @Body() updateDto: UpdateSocialLinksDto,
  ) {
    return this.organizationsService.updateSocialLinks(params.id, updateDto);
  }
}
