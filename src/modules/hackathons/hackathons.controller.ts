import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { ListPublicHackathonsDto } from './dto/list-public-hackathons.dto';
import { HackathonSummaryDto } from './dto/hackathon-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HackathonRoleGuard } from './guards/hackathon-role.guard';
import { RequireHackathonRole } from './decorators/require-hackathon-role.decorator';
import { MemberRole } from '../organizations/enums/member-role.enum';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  // ============================================
  // PUBLIC ENDPOINTS (No authentication required)
  // ============================================

  @Get('public/list')
  @ApiOperation({
    summary: 'List public hackathons',
    description:
      'Get a paginated list of public, approved hackathons. Filter by time period (upcoming, ongoing, past, or all). No authentication required.',
  })
  @ApiQuery({
    name: 'filter',
    enum: ['all', 'upcoming', 'ongoing', 'past'],
    required: false,
    description: 'Filter by time period',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of results (1-100)',
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Number to skip (pagination)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of public hackathons.',
    schema: {
      properties: {
        hackathons: {
          type: 'array',
          items: { $ref: '#/components/schemas/HackathonSummaryDto' },
        },
        total: { type: 'number', example: 42 },
        limit: { type: 'number', example: 20 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters.' })
  async listPublic(@Query() queryDto: ListPublicHackathonsDto) {
    const { hackathons, total } =
      await this.hackathonsService.listPublicHackathons(queryDto);

    return {
      hackathons: hackathons.map((h) => HackathonSummaryDto.fromHackathon(h)),
      total,
      limit: queryDto.limit || 20,
      offset: queryDto.offset || 0,
    };
  }

  @Get('public/:slug')
  @ApiOperation({
    summary: 'Get public hackathon by slug',
    description:
      'Get full details of a public hackathon using its URL-friendly slug. No authentication required.',
  })
  @ApiParam({ name: 'slug', description: 'Hackathon slug', example: 'stellar-defi-hackathon-2024' })
  @ApiResponse({
    status: 200,
    description: 'Returns full hackathon details.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon not found or not public.',
  })
  async findPublicBySlug(@Param('slug') slug: string) {
    return this.hackathonsService.findPublicBySlug(slug);
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new hackathon' })
  @ApiResponse({ status: 201, description: 'Hackathon created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Req() req: any, @Body() createDto: CreateHackathonDto) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.hackathonsService.create(userId, createDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get hackathon by ID (authenticated)',
    description: 'Get any hackathon by ID. Requires authentication. Use for organizer dashboard access to DRAFT/REJECTED hackathons.',
  })
  @ApiParam({ name: 'id', description: 'Hackathon UUID' })
  @ApiResponse({ status: 200, description: 'Return hackathon details.' })
  @ApiResponse({ status: 404, description: 'Hackathon not found.' })
  async findById(@Param() params: UuidParamDto) {
    return this.hackathonsService.findById(params.id);
  }

  @Get('organization/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hackathons by organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Return list of hackathons.' })
  async findAllByOrganization(@Param('orgId') orgId: string) {
    return this.hackathonsService.findAllByOrganization(orgId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, HackathonRoleGuard)
  @RequireHackathonRole(MemberRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update hackathon details',
    description:
      'Allows organizers (creator, org admin, or org editor) to update all aspects of a hackathon including basic info, tracks, prizes, custom questions, and submission requirements. All fields are optional - only provide the fields you want to update.',
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonDto })
  @ApiResponse({
    status: 200,
    description: 'Hackathon updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found.' })
  async update(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() updateDto: UpdateHackathonDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.hackathonsService.update(params.id, userId, updateDto);
  }

  @Post(':id/submit-for-review')
  @UseGuards(JwtAuthGuard, HackathonRoleGuard)
  @RequireHackathonRole(MemberRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit hackathon for admin review',
    description:
      'Submits a hackathon for admin approval. Only DRAFT or REJECTED hackathons can be submitted. Requires creator or organization admin permissions.',
  })
  @ApiParam({ name: 'id', description: 'Hackathon UUID or ID' })
  @ApiResponse({
    status: 200,
    description:
      'Hackathon submitted for review successfully. Status changed to UNDER_REVIEW.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Hackathon is not in DRAFT or REJECTED status.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only creator or org admin can submit for review.',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found.' })
  async submitForReview(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.hackathonsService.submitForReview(params.id, userId);
  }
}
