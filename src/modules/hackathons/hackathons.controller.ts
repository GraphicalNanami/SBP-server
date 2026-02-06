import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new hackathon' })
  @ApiResponse({ status: 201, description: 'Hackathon created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Req() req: any, @Body() createDto: CreateHackathonDto) {
    const userId = req.user.id || req.user._id;
    return this.hackathonsService.create(userId, createDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hackathon by ID' })
  @ApiParam({ name: 'id', description: 'Hackathon UUID' })
  @ApiResponse({ status: 200, description: 'Return hackathon details.' })
  @ApiResponse({ status: 404, description: 'Hackathon not found.' })
  async findById(@Param('id') id: string) {
    return this.hackathonsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get hackathon by slug' })
  @ApiParam({ name: 'slug', description: 'Hackathon slug' })
  @ApiResponse({ status: 200, description: 'Return hackathon details.' })
  @ApiResponse({ status: 404, description: 'Hackathon not found.' })
  async findBySlug(@Param('slug') slug: string) {
    return this.hackathonsService.findBySlug(slug);
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
}
