import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gender } from '@/src/common/enums/gender.enum';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ type: String, enum: Gender })
  gender: Gender;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  website: string;

  @Prop()
  profilePictureUrl: string;

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
