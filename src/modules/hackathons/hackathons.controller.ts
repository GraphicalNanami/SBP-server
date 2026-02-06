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

@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() createDto: CreateHackathonDto) {
    const userId = req.user.id || req.user._id;
    return this.hackathonsService.create(userId, createDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.hackathonsService.findById(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.hackathonsService.findBySlug(slug);
  }

  @Get('organization/:orgId')
  @UseGuards(JwtAuthGuard)
  async findAllByOrganization(@Param('orgId') orgId: string) {
    return this.hackathonsService.findAllByOrganization(orgId);
  }
}
