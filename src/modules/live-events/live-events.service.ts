import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LiveEvent } from './schemas/live-event.schema';
import { LiveEventRegistration } from './schemas/live-event-registration.schema';
import { CreateLiveEventDto } from './dto/create-live-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { EventStatus } from './enums/event-status.enum';

@Injectable()
export class LiveEventsService {
  private readonly logger = new Logger(LiveEventsService.name);

  constructor(
    @InjectModel(LiveEvent.name) private liveEventModel: Model<LiveEvent>,
    @InjectModel(LiveEventRegistration.name)
    private liveEventRegistrationModel: Model<LiveEventRegistration>,
  ) {}

  private getStatus(startDate: Date, endDate: Date): EventStatus {
    const now = new Date();
    if (now < startDate) return EventStatus.UPCOMING;
    if (now > endDate) return EventStatus.COMPLETED;
    return EventStatus.ONGOING;
  }

  async create(
    createLiveEventDto: CreateLiveEventDto,
    createdByUserUuid: string,
  ): Promise<LiveEvent> {
    const { startDate, endDate } = createLiveEventDto;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const newEvent = new this.liveEventModel({
      ...createLiveEventDto,
      uuid: uuidv4(),
      startDate: start,
      endDate: end,
      status: this.getStatus(start, end),
      createdByUserUuid,
    });

    return newEvent.save();
  }

  async findAll(query: GetEventsQueryDto) {
    // This is a simplified implementation. A background job would be better for status updates.
    await this.updateStatuses();

    const filters: any = {};
    if (query.status) filters.status = query.status;
    if (query.eventType) filters.eventType = query.eventType;
    if (query.country) filters.country = query.country;

    const events = await this.liveEventModel
      .find(filters)
      .sort({ startDate: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean();

    const total = await this.liveEventModel.countDocuments(filters);

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await this.getRegistrationCount(event.uuid);
        return { ...event, registeredCount };
      }),
    );

    return { events: eventsWithCount, total, limit: query.limit, skip: query.skip };
  }

  async findOne(uuid: string) {
    const event = await this.liveEventModel.findOne({ uuid }).lean();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    await this.updateStatuses();
    const registeredCount = await this.getRegistrationCount(uuid);
    return { ...event, registeredCount };
  }

  async register(
    eventUuid: string,
    userUuid: string,
    eventData?: CreateLiveEventDto,
  ) {
    this.logger.log(
      `Registration attempt: eventUuid=${eventUuid}, userUuid=${userUuid}, hasEventData=${!!eventData}`,
    );

    // Check if event exists in database
    let event = await this.liveEventModel.findOne({ uuid: eventUuid });

    // If event doesn't exist AND eventData is provided, auto-create it (hybrid mock event flow)
    if (!event && eventData) {
      this.logger.log(
        `Auto-creating event from frontend mock data: ${eventUuid}`,
      );

      const { startDate, endDate } = eventData;
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new BadRequestException('endDate must be after startDate');
      }

      // Create the event with the provided UUID (from mock)
      const eventDoc = {
        ...eventData,
        uuid: eventUuid, // Use the mock ID as UUID
        startDate: start,
        endDate: end,
        status: this.getStatus(start, end),
        createdByUserUuid: userUuid, // User who first registered becomes creator
      };

      event = await this.liveEventModel.create(eventDoc);
      
      this.logger.log(
        `Event auto-created successfully: ${eventUuid} - ${event.title}`,
      );
    }

    // If event still doesn't exist after auto-creation attempt, throw error
    if (!event) {
      throw new NotFoundException(
        'Event not found and no event data provided for auto-creation',
      );
    }

    // Check if user already registered
    const existingRegistration = await this.liveEventRegistrationModel.findOne({
      eventUuid,
      userUuid,
    });

    if (existingRegistration) {
      const registeredCount = await this.getRegistrationCount(eventUuid);
      return {
        eventUuid,
        userUuid,
        registered: true,
        alreadyRegistered: true,
        registeredCount,
        registeredAt: existingRegistration.registeredAt,
      };
    }

    // Create new registration
    const newRegistration = new this.liveEventRegistrationModel({
      eventUuid,
      userUuid,
    });
    await newRegistration.save();

    const registeredCount = await this.getRegistrationCount(eventUuid);

    this.logger.log(
      `User ${userUuid} registered for event ${eventUuid}. Total registrations: ${registeredCount}`,
    );

    return {
      eventUuid,
      userUuid,
      registered: true,
      alreadyRegistered: false,
      registeredCount,
      registeredAt: newRegistration.registeredAt,
    };
  }

  async getMyRegistrations(userUuid: string) {
    const registrations = await this.liveEventRegistrationModel.find({ userUuid }).sort({ registeredAt: -1 }).lean();
    
    const events = await Promise.all(
      registrations.map(async (reg) => {
        const event = await this.liveEventModel.findOne({ uuid: reg.eventUuid }).lean();
        return { event, registeredAt: reg.registeredAt };
      })
    );
    
    await this.updateStatuses();
    
    return {
      userUuid,
      registrations: events,
      total: events.length,
    }
  }

  async unregister(eventUuid: string, userUuid: string) {
    const result = await this.liveEventRegistrationModel.deleteOne({ eventUuid, userUuid });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Registration not found');
    }
    const registeredCount = await this.getRegistrationCount(eventUuid);
    return {
      eventUuid,
      userUuid,
      unregistered: true,
      registeredCount,
    };
  }

  async getRegistrationCount(eventUuid: string): Promise<number> {
    return this.liveEventRegistrationModel.countDocuments({ eventUuid });
  }

  private async updateStatuses() {
    const now = new Date();
    // Update UPCOMING to ONGOING
    await this.liveEventModel.updateMany(
      { status: EventStatus.UPCOMING, startDate: { $lte: now }, endDate: { $gte: now } },
      { $set: { status: EventStatus.ONGOING } },
    );
    // Update ONGOING to COMPLETED
    await this.liveEventModel.updateMany(
      { status: EventStatus.ONGOING, endDate: { $lt: now } },
      { $set: { status: EventStatus.COMPLETED } },
    );
  }
}