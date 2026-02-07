import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { BuildStatus } from '../enums/build-status.enum';
import { BuildVisibility } from '../enums/build-visibility.enum';
import { BuildCategory } from '../enums/build-category.enum';
import { TeamMemberRole } from '../enums/team-member-role.enum';
import { TeamMemberStatus } from '../enums/team-member-status.enum';
import { User } from '../../users/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Schema({
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
export class SocialLink {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  url: string;
}

@Schema({
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
export class BuildPermissions {
  @Prop({ default: false })
  canEdit: boolean;

  @Prop({ default: false })
  canInvite: boolean;

  @Prop({ default: false })
  canSubmit: boolean;
}

@Schema({
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
export class TeamMember {
  @Prop({
    required: true,
    unique: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: User | Types.ObjectId;

  @Prop({
    type: String,
    enum: TeamMemberRole,
    required: true,
  })
  role: TeamMemberRole;

  @Prop({
    type: String,
    enum: TeamMemberStatus,
    default: TeamMemberStatus.PENDING,
  })
  status: TeamMemberStatus;

  @Prop({ type: BuildPermissions, default: () => ({}) })
  permissions: BuildPermissions;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  invitedBy?: User | Types.ObjectId;

  @Prop({ default: Date.now })
  invitedAt: Date;

  @Prop()
  acceptedAt?: Date;
}

@Schema()
export class StatusHistory {
  @Prop({ type: String, enum: BuildStatus, required: true })
  status: BuildStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  changedBy: User | Types.ObjectId;

  @Prop({ default: Date.now })
  changedAt: Date;

  @Prop()
  reason?: string;
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
export class Build extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, maxlength: 120 })
  tagline: string;

  @Prop({ type: String, enum: BuildCategory, required: true })
  category: BuildCategory;

  @Prop({
    type: String,
    enum: BuildStatus,
    default: BuildStatus.DRAFT,
    index: true,
  })
  status: BuildStatus;

  @Prop({
    type: String,
    enum: BuildVisibility,
    default: BuildVisibility.PRIVATE,
  })
  visibility: BuildVisibility;

  @Prop({ required: true, maxlength: 500 })
  vision: string;

  @Prop({ required: true, maxlength: 10000 })
  description: string;

  @Prop()
  logo?: string;

  @Prop()
  githubRepository?: string;

  @Prop()
  website?: string;

  @Prop()
  demoVideo?: string;

  @Prop({ type: [SocialLink], default: [] })
  socialLinks: SocialLink[];

  @Prop({ required: true })
  teamDescription: string;

  @Prop({ type: [TeamMember], default: [] })
  teamMembers: TeamMember[];

  @Prop({ type: [String], default: [] })
  teamSocials: string[];

  @Prop({ required: true })
  teamLeadTelegram: string;

  @Prop({ required: true })
  contactEmail: string;

  @Prop()
  contractAddress?: string;

  @Prop()
  stellarAddress?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: User | Types.ObjectId;

  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];

  @Prop()
  publishedAt?: Date;
}

export const BuildSchema = SchemaFactory.createForClass(Build);

// Indexes
BuildSchema.index({ name: 'text', tagline: 'text', description: 'text' });
BuildSchema.index({ status: 1, publishedAt: -1 });
BuildSchema.index({ createdBy: 1, status: 1 });
