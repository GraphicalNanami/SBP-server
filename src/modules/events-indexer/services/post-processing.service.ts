import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { Author, AuthorDocument } from '../schemas/author.schema';
import { TopicMatchingService } from './topic-matching.service';
import { TogetherAiService } from './together-ai.service';

interface ProcessedPost {
  platform: 'twitter' | 'reddit' | 'discord';
  platform_id: string;
  content: string;
  author_id: string;
  author_username: string;
  author_name: string;
  created_at: Date;
  url?: string;
  raw_data?: any;
}

interface PlatformData {
  id?: string;
  username?: string;
  display_name?: string;
  profile_image_url?: string;
  verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

@Injectable()
export class PostProcessingService {
  private readonly logger = new Logger(PostProcessingService.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    private topicMatchingService: TopicMatchingService,
    private togetherAiService: TogetherAiService,
  ) {}

  async processPosts(posts: ProcessedPost[]): Promise<{
    processed: number;
    skipped: number;
    errors: number;
  }> {
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    this.logger.log(`Starting to process ${posts.length} posts`);

    for (const post of posts) {
      try {
        // Filter out short posts (likely spam)
        if (post.content.length < 80) {
          skipped++;
          this.logger.debug(
            `Skipping short post: ${post.content.length} chars`,
          );
          continue;
        }

        // Check if post already exists
        const existing = await this.postModel
          .findOne({
            platform: post.platform,
            platform_id: post.platform_id,
          })
          .exec();

        if (existing) {
          skipped++;
          continue;
        }

        // Find or create author
        const authorId = await this.findOrCreateAuthor(post);

        // Step 1: Dictionary matching (Aho-Corasick) with minimum length filter
        const dictionaryTopics = this.topicMatchingService.matchTopics(
          post.content,
          80,
        );

        // Step 2: LLM extraction for NER and additional topics
        const llmExtraction =
          await this.togetherAiService.extractTopicsAndEntities(post.content);

        // Combine topics from both methods
        const allTopics = new Set([
          ...dictionaryTopics,
          ...llmExtraction.topics,
        ]);

        // Step 3: Save post to database
        const newPost = new this.postModel({
          platform: post.platform,
          platform_id: post.platform_id,
          content: post.content,
          author_id: authorId,
          author_name: post.author_name,
          created_at: post.created_at,
          url: post.url,
          topics: Array.from(allTopics),
          extracted_entities: llmExtraction.entities.map((entity) => ({
            ...entity,
            method: 'ner',
          })),
          processed_at: new Date(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
          raw_data: post.raw_data,
        });

        await newPost.save();

        // Update topic frequencies
        for (const topic of allTopics) {
          await this.topicMatchingService.updateTopicFrequency(topic);
        }

        // Update author post count
        await this.authorModel
          .updateOne(
            { _id: authorId },
            {
              $inc: { post_count: 1 },
              $set: { last_active: post.created_at },
            },
          )
          .exec();

        processed++;
      } catch (error) {
        this.logger.error(
          `Error processing post ${post.platform_id}: ${error.message}`,
          error.stack,
        );
        errors++;
      }
    }

    this.logger.log(
      `Processing complete: ${processed} processed, ${skipped} skipped, ${errors} errors`,
    );

    return { processed, skipped, errors };
  }

  private async findOrCreateAuthor(
    post: ProcessedPost,
  ): Promise<Types.ObjectId> {
    const platformKey = `platforms.${post.platform}.id`;

    // Try to find existing author by platform ID
    let author = await this.authorModel
      .findOne({
        [platformKey]: post.author_id,
      })
      .exec();

    if (author) {
      // Update display name if changed
      if (author.display_name !== post.author_name) {
        await this.authorModel
          .updateOne(
            { _id: author._id },
            {
              $set: {
                display_name: post.author_name,
                [`platforms.${post.platform}.username`]: post.author_username,
                [`platforms.${post.platform}.display_name`]: post.author_name,
              },
            },
          )
          .exec();
      }
      return author._id;
    }

    // Create new author
    author = new this.authorModel({
      display_name: post.author_name,
      platforms: {
        [post.platform]: {
          id: post.author_id,
          username: post.author_username,
          display_name: post.author_name,
        },
      },
      post_count: 0,
      first_seen: post.created_at,
      last_active: post.created_at,
    });

    await author.save();
    return author._id;
  }

  async getCoOccurringTopics(
    targetTopic: string,
    options: {
      limit?: number;
      hours?: number;
      platform?: 'twitter' | 'reddit' | 'discord';
    } = {},
  ): Promise<
    Array<{
      topic: string;
      count: number;
      platforms: string[];
    }>
  > {
    const { limit = 20, hours = 24, platform } = options;
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const matchStage: any = {
        topics: targetTopic.toLowerCase(),
        created_at: { $gte: cutoffDate },
      };

      if (platform) {
        matchStage.platform = platform;
      }

      const pipeline: any[] = [
        { $match: matchStage },
        { $unwind: '$topics' },
        { $match: { topics: { $ne: targetTopic.toLowerCase() } } },
        {
          $group: {
            _id: '$topics',
            count: { $sum: 1 },
            platforms: { $addToSet: '$platform' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            topic: '$_id',
            count: 1,
            platforms: 1,
          },
        },
      ];

      return this.postModel.aggregate(pipeline).exec();
    } catch (error) {
      this.logger.error(`Error getting co-occurring topics: ${error.message}`);
      return [];
    }
  }

  async getTopicPosts(
    topic: string,
    options: {
      limit?: number;
      hours?: number;
      platform?: 'twitter' | 'reddit' | 'discord';
    } = {},
  ): Promise<PostDocument[]> {
    const { limit = 20, hours = 24, platform } = options;
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const query: any = {
        topics: topic.toLowerCase(),
        created_at: { $gte: cutoffDate },
      };

      if (platform) {
        query.platform = platform;
      }

      return this.postModel
        .find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .populate('author_id', 'display_name platforms')
        .exec();
    } catch (error) {
      this.logger.error(`Error getting topic posts: ${error.message}`);
      return [];
    }
  }

  async getAuthorStats(authorId: Types.ObjectId): Promise<{
    total_posts: number;
    platforms: string[];
    top_topics: Array<{ topic: string; count: number }>;
    recent_activity: Date;
  } | null> {
    try {
      const author = await this.authorModel.findById(authorId).exec();
      if (!author) return null;

      const posts = await this.postModel.find({ author_id: authorId }).exec();

      // Count topics
      const topicCounts = new Map<string, number>();
      for (const post of posts) {
        for (const topic of post.topics) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }

      const topTopics = Array.from(topicCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      const platforms = Object.keys(author.platforms);

      return {
        total_posts: posts.length,
        platforms,
        top_topics: topTopics,
        recent_activity: author.last_active || author.first_seen,
      };
    } catch (error) {
      this.logger.error(`Error getting author stats: ${error.message}`);
      return null;
    }
  }

  async getAuthors(
    options: {
      limit?: number;
      platform?: 'twitter' | 'reddit' | 'discord';
    } = {},
  ): Promise<any[]> {
    try {
      const { limit = 50, platform } = options;

      const query: any = {};
      if (platform) {
        query[`platforms.${platform}`] = { $exists: true };
      }

      const authors = await this.authorModel
        .find(query)
        .sort({ last_active: -1 })
        .limit(limit)
        .exec(); // Remove .select() to get all fields

      return authors.map((author) => {
        // Convert Mongoose document to plain object
        const authorObj = author.toObject ? author.toObject() : author;

        // Extract platform-specific info with proper typing
        const platformData: PlatformData = platform
          ? authorObj.platforms?.[platform] || {}
          : authorObj.platforms?.twitter ||
            authorObj.platforms?.reddit ||
            authorObj.platforms?.discord ||
            {};

        const detectedPlatform =
          platform ||
          (authorObj.platforms?.twitter
            ? 'twitter'
            : authorObj.platforms?.reddit
              ? 'reddit'
              : 'discord');

        return {
          id: authorObj._id,
          display_name: authorObj.display_name,
          username: platformData.username || 'unknown',
          platform: detectedPlatform,
          followers_count: platformData.followers_count || 0,
          verified: platformData.verified || false,
          post_count: authorObj.post_count || 0,
          first_seen: authorObj.first_seen,
          last_active: authorObj.last_active,
        };
      });
    } catch (error) {
      this.logger.error(`Error getting authors: ${error.message}`);
      return [];
    }
  }

  async getRecentPosts(
    hours?: number, // Optional now - undefined means all posts
    platform?: 'twitter' | 'reddit' | 'discord',
  ): Promise<PostDocument[]> {
    const query: any = {};
    
    // Only apply time filter if hours is specified
    if (hours !== undefined) {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      query.created_at = { $gte: cutoffDate };
    }
    
    if (platform) {
      query.platform = platform;
    }

    return this.postModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(100)
      .populate('author_id', 'display_name platforms')
      .exec();
  }
}
