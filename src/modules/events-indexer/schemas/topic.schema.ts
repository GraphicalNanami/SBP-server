import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ 
  timestamps: true,
  collection: 'topics'
})
export class Topic {
  @Prop({ required: true, unique: true, lowercase: true })
  name: string;

  @Prop({ type: [String], default: [] })
  aliases: string[];

  @Prop({ 
    required: true, 
    enum: ['dictionary_match', 'ner', 'llm_classified'] 
  })
  type: 'dictionary_match' | 'ner' | 'llm_classified';

  @Prop()
  category?: string;

  @Prop({ default: 0 })
  frequency: number;

  @Prop()
  description?: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// Index for topic lookup
TopicSchema.index({ name: 1 }, { unique: true });
// Index for category filtering
TopicSchema.index({ category: 1, frequency: -1 });
// Index for alias search
TopicSchema.index({ aliases: 1 });