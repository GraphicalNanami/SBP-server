import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { ListSubmissionsDto } from './dto/list-submissions.dto';
import { JudgeSubmissionDto } from './dto/judge-submission.dto';
import { SelectWinnerDto } from './dto/select-winner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmissionRoleGuard } from './guards/submission-role.guard';
import { SubmissionOrganizerGuard } from './guards/submission-organizer.guard';
import { HackathonRoleGuard } from '../hackathons/guards/hackathon-role.guard';
import { RequireHackathonRole } from '../hackathons/decorators/require-hackathon-role.decorator';
import { MemberRole } from '../organizations/enums/member-role.enum';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  // ============================================
  // TEAM ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new submission' })
  @ApiResponse({ status: 201, description: 'Submission created.' })
  async create(@Req() req: any, @Body() createDto: CreateSubmissionDto) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.create(userId, createDto);
  }

  @Get('my-submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user\'s submissions' })
  async listUserSubmissions(@Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.listUserSubmissions(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submission details' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  async getSubmission(@Param() params: UuidParamDto) {
    return this.submissionsService.findByUuid(params.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SubmissionRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update submission (DRAFT only)' })
  async update(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() updateDto: UpdateSubmissionDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.update(params.id, userId, updateDto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, SubmissionRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit to hackathon (finalize draft)' })
  async submit(@Param() params: UuidParamDto, @Req() req: any) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.submit(params.id, userId);
  }

  @Post(':id/withdraw')
  @UseGuards(JwtAuthGuard, SubmissionRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw submission' })
  async withdraw(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.withdraw(params.id, userId, reason);
  }

  // ============================================
  // ORGANIZER / JUDGE ENDPOINTS
  // ============================================

  @Get('hackathon/:hackathonId')
  @UseGuards(JwtAuthGuard, HackathonRoleGuard)
  @RequireHackathonRole(MemberRole.VIEWER) // Organizers/Judges
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List hackathon submissions (Organizer)' })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon UUID' })
  async listByHackathon(
    @Param('hackathonId') hackathonUuid: string,
    @Query() queryDto: ListSubmissionsDto,
    @Req() req: any,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.listByHackathon(hackathonUuid, queryDto, userId);
  }

  @Post('hackathon/:hackathonId/start-review')
  @UseGuards(JwtAuthGuard, HackathonRoleGuard)
  @RequireHackathonRole(MemberRole.ADMIN) // Only Admin can start review?
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start review period' })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon UUID' })
  async startReview(
    @Param('hackathonId') hackathonUuid: string,
    @Req() req: any,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.startReview(hackathonUuid, userId);
  }

  @Post(':id/judge')
  @UseGuards(JwtAuthGuard, SubmissionOrganizerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Judge submission' })
  async judge(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() dto: JudgeSubmissionDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.judgeSubmission(params.id, userId, dto);
  }

  @Post(':id/select-winner')
  @UseGuards(JwtAuthGuard, SubmissionOrganizerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select winner' })
  async selectWinner(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body() dto: SelectWinnerDto,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.selectWinner(params.id, userId, dto);
  }

  @Post(':id/disqualify')
  @UseGuards(JwtAuthGuard, SubmissionOrganizerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disqualify submission' })
  async disqualify(
    @Param() params: UuidParamDto,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.uuid || req.user.id || req.user._id;
    return this.submissionsService.disqualify(params.id, userId, reason);
  }
}