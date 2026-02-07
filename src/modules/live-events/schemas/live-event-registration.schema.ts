
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'registeredAt' } })
export class LiveEventRegistration extends Document {
  @Prop({ required: true, index: true })
  eventUuid: string;

  @Prop({ required: true, index: true })
  userUuid: string;

  @Prop()
  registeredAt: Date;
}

export const LiveEventRegistrationSchema = SchemaFactory.createForClass(LiveEventRegistration);

LiveEventRegistrationSchema.index({ eventUuid: 1, userUuid: 1 }, { unique: true });
