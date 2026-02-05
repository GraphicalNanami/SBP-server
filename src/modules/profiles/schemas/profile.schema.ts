import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop()
  bio: string;

  @Prop()
  stellarAddress: string;

  @Prop({
    type: {
      twitter: String,
      linkedin: String,
      github: String,
    },
    _id: false,
  })
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
