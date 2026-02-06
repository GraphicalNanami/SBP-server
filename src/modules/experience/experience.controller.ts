import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';

@Controller('experience')
export class ExperienceController {
  constructor(private experienceService: ExperienceService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.experienceService.findByUserId(req.user.userId);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() data: CreateExperienceDto) {
    return this.experienceService.upsert(req.user.userId, data);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Body() data: UpdateExperienceDto) {
    return this.experienceService.update(req.user.userId, data);
  }
}
