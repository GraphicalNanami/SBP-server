
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveEventsController } from './live-events.controller';
import { LiveEventsService } from './live-events.service';
import { LiveEvent, LiveEventSchema } from './schemas/live-event.schema';
import {
  LiveEventRegistration,
  LiveEventRegistrationSchema,
} from './schemas/live-event-registration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveEvent.name, schema: LiveEventSchema },
      { name: LiveEventRegistration.name, schema: LiveEventRegistrationSchema },
    ]),
  ],
  controllers: [LiveEventsController],
  providers: [LiveEventsService],
})
export class LiveEventsModule {}
