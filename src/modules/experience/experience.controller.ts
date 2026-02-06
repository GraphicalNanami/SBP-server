import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { ExperienceService } from '@/src/modules/experience/experience.service';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
} from '@/src/modules/experience/dto/experience.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Experience')
@ApiBearerAuth()
@Controller('experience')
export class ExperienceController {
  constructor(private experienceService: ExperienceService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user experience' })
  @ApiResponse({ status: 200, description: 'Return user experience.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@Req() req: any) {
    return this.experienceService.findByUserId(req.user._id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update user experience' })
  @ApiResponse({
    status: 200,
    description: 'Experience successfully created or updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Req() req: any, @Body() data: CreateExperienceDto) {
    return this.experienceService.upsert(req.user._id, data);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user experience' })
  @ApiResponse({ status: 200, description: 'Experience successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(@Req() req: any, @Body() data: UpdateExperienceDto) {
    return this.experienceService.update(req.user._id, data);
  }
}
