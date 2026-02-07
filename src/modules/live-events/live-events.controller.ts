import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LiveEventsService } from './live-events.service';
import { CreateLiveEventDto } from './dto/create-live-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { EventUuidParamDto } from './dto/event-uuid-param.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';

@ApiTags('Live Events')
@Controller('live-events')
export class LiveEventsController {
  constructor(private readonly liveEventsService: LiveEventsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'The event has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createLiveEventDto: CreateLiveEventDto, @Request() req) {
    return this.liveEventsService.create(createLiveEventDto, req.user.uuid);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  @ApiResponse({ status: 200, description: 'List of events.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  findAll(@Query() query: GetEventsQueryDto) {
    return this.liveEventsService.findAll(query);
  }

  @Get('me/registrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's registered events" })
  @ApiResponse({ status: 200, description: "A list of the user's registered events." })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMyRegistrations(@Request() req) {
    return this.liveEventsService.getMyRegistrations(req.user.uuid);
  }

  @Get(':eventUuid')
  @ApiOperation({ summary: 'Get a single event by UUID' })
  @ApiResponse({ status: 200, description: 'The event details.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findOne(@Param() params: EventUuidParamDto) {
    return this.liveEventsService.findOne(params.eventUuid);
  }

  @Get(':eventUuid/count')
  @ApiOperation({ summary: 'Get registration count for an event' })
  @ApiResponse({ status: 200, description: 'The number of registrations.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  async getRegistrationCount(@Param() params: EventUuidParamDto) {
    const count = await this.liveEventsService.getRegistrationCount(params.eventUuid);
    return { eventUuid: params.eventUuid, registeredCount: count };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':eventUuid/register')
  @ApiOperation({
    summary: 'Register current user to an event',
    description:
      'Registers the authenticated user to an event. If the event does not exist in the backend (e.g., a frontend mock event), ' +
      'include the full event data in the request body to auto-create it. For existing backend events, send an empty body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully registered or already registered.',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format or validation errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Event not found and no event data provided.' })
  register(
    @Param() params: EventUuidParamDto,
    @Body() registerDto: RegisterEventDto,
    @Request() req,
  ) {
    return this.liveEventsService.register(
      params.eventUuid,
      req.user.uuid,
      registerDto.eventData,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':eventUuid/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister current user from an event' })
  @ApiResponse({ status: 200, description: 'Successfully unregistered.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Event or registration not found.' })
  unregister(@Param() params: EventUuidParamDto, @Request() req) {
    return this.liveEventsService.unregister(params.eventUuid, req.user.uuid);
  }
}