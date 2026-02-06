import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthorDocument = Author & Document;

interface PlatformData {
  id: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

interface PlatformInfo {
  twitter?: PlatformData;
  reddit?: PlatformData;
  discord?: PlatformData;
}

@Schema({ 
  timestamps: true,
  collection: 'authors'
})
export class Author {
  @Prop({ required: true })
  display_name: string;

  @Prop({ type: Object, default: {} })
  platforms: PlatformInfo;

  @Prop({ default: 0 })
  post_count: number;

  @Prop({ required: true })
  first_seen: Date;

  @Prop()
  last_active?: Date;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);

// Sparse indexes for cross-platform author lookups
AuthorSchema.index({ 'platforms.twitter.id': 1 }, { sparse: true });
AuthorSchema.index({ 'platforms.reddit.id': 1 }, { sparse: true });
AuthorSchema.index({ 'platforms.discord.id': 1 }, { sparse: true });