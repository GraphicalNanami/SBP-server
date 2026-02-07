
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';

@Schema({ _id: false })
export class Host extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  role?: string;

  @Prop()
  avatar?: string;
}
export const HostSchema = SchemaFactory.createForClass(Host);

@Schema({ timestamps: true })
export class LiveEvent extends Document {
  @Prop({ required: true, unique: true, index: true })
  uuid: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: EventStatus,
    required: true,
    index: true,
  })
  status: EventStatus;

  @Prop({
    type: String,
    enum: EventType,
    required: true,
    index: true,
  })
  eventType: EventType;

  @Prop({ required: true, index: true })
  country: string;

  @Prop()
  location?: string;

  @Prop({ type: [HostSchema], required: true, validate: [(v: unknown[]) => v.length > 0, 'hosts array cannot be empty'] })
  hosts: Host[];

  @Prop()
  bannerUrl?: string;

  @Prop()
  externalUrl?: string;

  @Prop([String])
  tags?: string[];

  @Prop({ required: true })
  createdByUserUuid: string;
}

export const LiveEventSchema = SchemaFactory.createForClass(LiveEvent);
