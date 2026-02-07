import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { SubmissionStatus } from '../enums/submission-status.enum';
import { Build } from '../../builds/schemas/build.schema';
import { Hackathon } from '../../hackathons/schemas/hackathon.schema';
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
export class SelectedTrack {
  @Prop({ required: true })
  trackUuid: string;

  @Prop({ default: Date.now })
  selectedAt: Date;
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
export class CustomAnswer {
  @Prop({ required: true })
  questionUuid: string;

  @Prop({ required: true })
  answer: string; // Or mixed if multiple choice? Assuming string for now (JSON string or plain text)

  @Prop({ default: Date.now })
  answeredAt: Date;
}

@Schema()
export class Score {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  judgeId: User | Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop()
  feedback?: string;

  @Prop({ default: Date.now })
  judgedAt: Date;
}

@Schema()
export class JudgingDetails {
  @Prop({ type: [Score], default: [] })
  scores: Score[];

  @Prop()
  prizeUuid?: string;

  @Prop()
  placement?: number;

  @Prop()
  generalFeedback?: string;
}

@Schema()
export class SubmissionStatusHistory {
  @Prop({ type: String, enum: SubmissionStatus, required: true })
  status: SubmissionStatus;

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
export class Submission extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Build',
    required: true,
    index: true,
  })
  buildId: Build | Types.ObjectId;

  @Prop({ required: true, index: true })
  buildUuid: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Hackathon',
    required: true,
    index: true,
  })
  hackathonId: Hackathon | Types.ObjectId;

  @Prop({ required: true, index: true })
  hackathonUuid: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  submittedBy: User | Types.ObjectId;

  @Prop({ type: [SelectedTrack], default: [] })
  selectedTracks: SelectedTrack[];

  @Prop({ type: [CustomAnswer], default: [] })
  customAnswers: CustomAnswer[];

  @Prop({
    type: String,
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT,
    index: true,
  })
  status: SubmissionStatus;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: Date.now })
  lastEditedAt: Date;

  @Prop({ default: false })
  lockedForJudging: boolean;

  @Prop({ type: JudgingDetails, default: () => ({}) })
  judgingDetails: JudgingDetails;

  @Prop({ type: [SubmissionStatusHistory], default: [] })
  statusHistory: SubmissionStatusHistory[];
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Indexes
SubmissionSchema.index({ buildId: 1, hackathonId: 1 }, { unique: true });
SubmissionSchema.index({ hackathonUuid: 1, status: 1, submittedAt: -1 });
SubmissionSchema.index({ buildUuid: 1, status: 1 });
SubmissionSchema.index({ submittedBy: 1, status: 1 });
