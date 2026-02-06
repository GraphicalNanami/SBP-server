import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

export interface ExtractedEntity {
  text: string;
  type: 'PERSON' | 'ORG' | 'EVENT' | 'PRODUCT' | 'LOCATION';
  method: 'ner' | 'llm' | 'dictionary_match';
  confidence?: number;
}

interface PlatformSpecificData {
  // Twitter specific
  public_metrics?: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
  };
  // Reddit specific
  score?: number;
  num_comments?: number;
  subreddit?: string;
  permalink?: string;
  // Discord specific
  guild_id?: string;
  channel_id?: string;
  message_type?: number;
}

@Schema({ 
  timestamps: true,
  collection: 'posts'
})
export class Post {
  @Prop({ required: true, enum: ['twitter', 'reddit', 'discord'] })
  platform: 'twitter' | 'reddit' | 'discord';

  @Prop({ required: true })
  platform_id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  author_id: Types.ObjectId;

  @Prop({ required: true })
  author_name: string;

  @Prop({ required: true })
  created_at: Date;

  @Prop()
  url?: string;

  @Prop({ type: [String], default: [], index: true })
  topics: string[];

  @Prop({ type: [Object], default: [] })
  extracted_entities: ExtractedEntity[];

  @Prop()
  processed_at?: Date;

  @Prop({ type: Date, expires: '30d' })
  expires_at?: Date;

  @Prop({ type: Object })
  raw_data?: PlatformSpecificData;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Create compound index for topic filtering + time range queries
PostSchema.index({ topics: 1, created_at: -1 });
// Unique index for deduplication
PostSchema.index({ platform: 1, platform_id: 1 }, { unique: true });
// Author lookup index
PostSchema.index({ author_id: 1, created_at: -1 });
// Platform + time index
PostSchema.index({ platform: 1, created_at: -1 });