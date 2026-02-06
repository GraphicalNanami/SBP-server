import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrganizationStatus } from '@/src/modules/organizations/enums/organization-status.enum';
import { User } from '@/src/modules/users/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

export class SocialLinks {
  @Prop()
  twitter?: string;

  @Prop()
  telegram?: string;

  @Prop()
  github?: string;

  @Prop()
  discord?: string;

  @Prop()
  linkedin?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Organization extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  website: string;

  @Prop()
  logo?: string;

  @Prop()
  tagline?: string;

  @Prop()
  about?: string;

  @Prop({ type: SocialLinks, default: {} })
  socialLinks: SocialLinks;

  @Prop({ required: true })
  termsAcceptedAt: Date;

  @Prop({ required: true })
  termsVersion: string;

  @Prop({
    type: String,
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status: OrganizationStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: User;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
