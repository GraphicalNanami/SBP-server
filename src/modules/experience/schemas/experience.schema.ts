import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Web3SkillLevel } from '@/src/modules/experience/enums/web3-skill-level.enum';

@Schema({ timestamps: true })
export class Experience extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  roles: string[];

  @Prop({ min: 0, max: 60 })
  yearsOfExperience: number;

  @Prop({ type: String, enum: Web3SkillLevel })
  web3SkillLevel: Web3SkillLevel;

  @Prop({ type: [String], default: [] })
  programmingLanguages: string[];

  @Prop({ type: [String], default: [] })
  developerTools: string[];
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);
