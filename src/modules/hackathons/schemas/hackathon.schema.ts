import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { HackathonStatus } from '../enums/hackathon-status.enum';
import { HackathonVisibility } from '../enums/hackathon-visibility.enum';
import { HackathonCategory } from '../enums/hackathon-category.enum';
import { QuestionType } from '../enums/question-type.enum';
import { User } from '../../users/schemas/user.schema';
import { Organization } from '../../organizations/schemas/organization.schema';

@Schema()
export class Track {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: () => new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema()
export class Placement {
  @Prop({ required: true })
  placement: number;

  @Prop({ required: true })
  amount: number;
}

@Schema()
export class Prize {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: () => new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  trackId?: Types.ObjectId;

  @Prop({ type: [Placement], default: [] })
  placements: Placement[];

  @Prop({ default: true })
  isActive: boolean;
}

@Schema()
export class CustomQuestion {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: () => new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ required: true })
  questionText: string;

  @Prop({ type: String, enum: QuestionType, required: true })
  questionType: QuestionType;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ default: false })
  isRequired: boolean;

  @Prop({ default: 0 })
  order: number;
}

@Schema()
export class SubmissionRequirements {
  @Prop({ default: false })
  requireRepository: boolean;

  @Prop({ default: false })
  requireDemo: boolean;

  @Prop({ default: false })
  requireSorobanContractId: boolean;

  @Prop({ default: false })
  requireStellarAddress: boolean;

  @Prop({ default: false })
  requirePitchDeck: boolean;

  @Prop({ default: false })
  requireVideoDemo: boolean;

  @Prop()
  customInstructions?: string;
}

@Schema()
export class ApprovalDetails {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy?: User;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  submittedForReviewAt?: Date;
}

@Schema()
export class AnalyticsTracking {
  @Prop({ default: 0 })
  pageViews: number;

  @Prop({ default: 0 })
  uniqueVisitors: number;

  @Prop({ default: 0 })
  registrationCount: number;

  @Prop({ default: 0 })
  submissionCount: number;
}

@Schema()
export class StatusHistory {
  @Prop({ type: String, enum: HackathonStatus, required: true })
  status: HackathonStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  changedBy: User | Types.ObjectId;

  @Prop({ default: Date.now })
  changedAt: Date;

  @Prop()
  reason?: string;
}

@Schema({ timestamps: true })
export class Hackathon extends Document {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, enum: HackathonCategory, required: true })
  category: HackathonCategory;

  @Prop({
    type: String,
    enum: HackathonVisibility,
    default: HackathonVisibility.PUBLIC,
  })
  visibility: HackathonVisibility;

  @Prop()
  posterUrl?: string;

  @Prop()
  prizePool?: string;

  @Prop()
  prizeAsset?: string;

  @Prop({ type: [String], index: true, default: [] })
  tags: string[];

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  preRegistrationEndTime?: Date;

  @Prop({ required: true })
  submissionDeadline: Date;

  @Prop()
  judgingDeadline?: Date;

  @Prop({ required: true })
  venue: string;

  @Prop()
  description: string;

  @Prop()
  overview?: string;

  @Prop()
  rules?: string;

  @Prop()
  schedule?: string;

  @Prop()
  resources?: string;

  @Prop()
  faq?: string;

  @Prop()
  adminContact: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Organization | Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: User | Types.ObjectId;

  @Prop({
    type: String,
    enum: HackathonStatus,
    default: HackathonStatus.DRAFT,
    index: true,
  })
  status: HackathonStatus;

  @Prop({ type: [Track], default: [] })
  tracks: Track[];

  @Prop({ type: [Prize], default: [] })
  prizes: Prize[];

  @Prop({ type: [CustomQuestion], default: [] })
  customRegistrationQuestions: CustomQuestion[];

  @Prop({ type: SubmissionRequirements, default: () => ({}) })
  submissionRequirements: SubmissionRequirements;

  @Prop({ type: ApprovalDetails, default: () => ({}) })
  approvalDetails: ApprovalDetails;

  @Prop({ type: AnalyticsTracking, default: () => ({}) })
  analytics: AnalyticsTracking;

  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];
}

export const HackathonSchema = SchemaFactory.createForClass(Hackathon);

// Indexes
HackathonSchema.index({ organizationId: 1, name: 1 }, { unique: true });
HackathonSchema.index({ status: 1, startTime: -1 });
