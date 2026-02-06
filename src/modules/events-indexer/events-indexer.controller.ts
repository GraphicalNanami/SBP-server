import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { EventsIndexerService } from './services/events-indexer.service';
import { PostProcessingService } from './services/post-processing.service';
import { TopicMatchingService } from './services/topic-matching.service';
import {
  GetTopicPostsDto,
  GetRelatedTopicsDto,
  ProcessPostsDto,
} from './dto/query.dto';

@Controller('events-indexer')
export class EventsIndexerController {
  constructor(
    private eventsIndexerService: EventsIndexerService,
    private postProcessingService: PostProcessingService,
    private topicMatchingService: TopicMatchingService,
  ) {}

  @Post('index/run')
  async runIndexing(@Query(ValidationPipe) dto: ProcessPostsDto) {
    try {
      return await this.eventsIndexerService.runSingleIndexCycle({
        twitterQuery: dto.query,
        redditQuery: dto.query,
        maxResults: dto.limit,
      });
    } catch (error) {
      return {
        twitter: { fetched: 0, processed: 0, skipped: 0, errors: 1 },
        reddit: { fetched: 0, processed: 0, skipped: 0, errors: 1 },
        total_processed: 0,
        error: true,
        error_message: error.message,
        note: 'Check API configuration in /events-indexer/health',
      };
    }
  }

  @Post('index/twitter')
  async indexTwitter(@Query(ValidationPipe) dto: ProcessPostsDto) {
    return this.eventsIndexerService.indexTwitterPosts(dto.query, dto.limit);
  }

  @Post('index/reddit/:subreddit')
  async indexReddit(
    @Param('subreddit') subreddit: string,
    @Query(ValidationPipe) dto: ProcessPostsDto,
  ) {
    return this.eventsIndexerService.indexRedditPosts(
      subreddit,
      dto.query,
      dto.limit,
    );
  }

  @Get('topics/:topic/posts')
  async getTopicPosts(
    @Param('topic') topic: string,
    @Query(ValidationPipe) dto: GetTopicPostsDto,
  ) {
    const posts = await this.postProcessingService.getTopicPosts(topic, {
      limit: dto.limit,
      hours: dto.hours,
      platform: dto.platform,
    });

    return {
      topic,
      count: posts.length,
      posts: posts.map((post) => ({
        id: post._id,
        platform: post.platform,
        content:
          post.content.substring(0, 280) +
          (post.content.length > 280 ? '...' : ''),
        author_name: post.author_name,
        created_at: post.created_at,
        url: post.url,
        topics: post.topics,
        entities: post.extracted_entities,
      })),
    };
  }

  @Get('topics/:topic/related')
  async getRelatedTopics(
    @Param('topic') topic: string,
    @Query(ValidationPipe) dto: GetRelatedTopicsDto,
  ) {
    const relatedTopics = await this.postProcessingService.getCoOccurringTopics(
      topic,
      {
        limit: dto.limit,
        hours: dto.hours,
      },
    );

    return {
      topic,
      related_topics: relatedTopics,
      time_window_hours: dto.hours,
    };
  }

  @Get('topics')
  async getTopTopics(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const topics = await this.topicMatchingService.getTopTopics(limit);

    return {
      topics: topics.map((topic) => ({
        name: topic.name,
        category: topic.category,
        frequency: topic.frequency,
        aliases: topic.aliases,
      })),
    };
  }

  @Get('topics/categories/:category')
  async getTopicsByCategory(@Param('category') category: string) {
    const topics =
      await this.topicMatchingService.getTopicsByCategory(category);

    return {
      category,
      topics: topics.map((topic) => ({
        name: topic.name,
        frequency: topic.frequency,
        aliases: topic.aliases,
      })),
    };
  }

  @Get('authors/:id/stats')
  async getAuthorStats(@Param('id') authorId: string) {
    try {
      const stats = await this.postProcessingService.getAuthorStats(
        authorId as any,
      );
      if (!stats) {
        return { error: 'Author not found' };
      }
      return stats;
    } catch (error) {
      return { error: 'Invalid author ID' };
    }
  }

  @Get('authors')
  async getAuthors(
    @Query('limit') limitStr?: string,
    @Query('platform') platform?: 'twitter' | 'reddit' | 'discord',
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const authors = await this.postProcessingService.getAuthors({
      limit,
      platform,
    });

    return {
      count: authors.length,
      platform: platform || 'all',
      authors: authors.map((author) => ({
        id: author.id,
        username: author.username,
        display_name: author.display_name,
        platform: author.platform,
        followers_count: author.followers_count,
        verified: author.verified,
        post_count: author.post_count,
        first_seen: author.first_seen,
        last_active: author.last_active,
      })),
    };
  }

  @Get('stats')
  async getIndexingStats(@Query('hours') hoursStr?: string) {
    const hours = hoursStr ? parseInt(hoursStr, 10) : 24;
    return this.eventsIndexerService.getIndexingStats(hours);
  }

  @Get('posts/recent')
  async getRecentPosts(
    @Query('hours') hoursStr?: string,
    @Query('platform') platform?: 'twitter' | 'reddit' | 'discord',
  ) {
    const hours = hoursStr ? parseInt(hoursStr, 10) : 24;
    const posts = await this.postProcessingService.getRecentPosts(
      hours,
      platform,
    );

    return {
      count: posts.length,
      time_window_hours: hours,
      platform: platform || 'all',
      posts: posts.map((post) => ({
        id: post._id,
        platform: post.platform,
        content:
          post.content.substring(0, 200) +
          (post.content.length > 200 ? '...' : ''),
        author_name: post.author_name,
        created_at: post.created_at,
        url: post.url,
        topics: post.topics.slice(0, 5), // Limit to top 5 topics
        entity_count: post.extracted_entities.length,
      })),
    };
  }

  @Post('topics/:topic/match')
  async matchTopicInText(
    @Param('topic') topic: string,
    @Query('text') text: string,
  ) {
    if (!text) {
      return { error: 'Text parameter required' };
    }

    const matches = this.topicMatchingService.matchTopics(text);
    const isMatch = matches.includes(topic.toLowerCase());

    return {
      topic,
      text_snippet: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      is_match: isMatch,
      all_matches: matches,
    };
  }

  @Post('demo/process')
  async demoProcessing() {
    interface DemoPost {
      id: string;
      platform: 'twitter' | 'reddit';
      content: string;
      author_name: string;
      created_at: Date;
    }

    // Demo posts about Stellar Lumens for testing without API keys
    const demoStellarPosts: DemoPost[] = [
      {
        id: 'demo_twitter_1',
        platform: 'twitter',
        content:
          'Stellar Lumens (XLM) is revolutionizing cross-border payments with its lightning-fast settlement times and minimal fees.',
        author_name: 'CryptoAnalyst',
        created_at: new Date(),
      },
      {
        id: 'demo_reddit_1',
        platform: 'reddit',
        content:
          'Just read about Stellar blockchain technology - their consensus algorithm is fascinating. Instead of mining like Bitcoin, they use something called the Stellar Consensus Protocol (SCP).',
        author_name: 'BlockchainDev',
        created_at: new Date(),
      },
      {
        id: 'demo_twitter_2',
        platform: 'twitter',
        content:
          'The Stellar Development Foundation announced new partnerships with major financial institutions for cross-border remittances using XLM.',
        author_name: 'FinTechNews',
        created_at: new Date(),
      },
    ];

    // Process with our topic matching service
    const results = demoStellarPosts.map((post) => {
      const topics = this.topicMatchingService.matchTopics(post.content);
      return {
        ...post,
        topics: topics,
        content_length: post.content.length,
        passes_min_length: post.content.length >= 80,
      };
    });

    return {
      demo_mode: true,
      total_posts: demoStellarPosts.length,
      processed_posts: results,
      topic_extraction_demo: results.map((r) => ({
        platform: r.platform,
        content_preview: r.content.substring(0, 100) + '...',
        topics_found: r.topics,
        meets_length_requirement: r.passes_min_length,
      })),
    };
  }

  @Post('reset-topics')
  async resetTopics() {
    try {
      // Clear existing topics and reload
      await this.topicMatchingService.resetAndReloadTopics();
      return {
        success: true,
        message:
          'Topics database reset and reloaded with Stellar-focused terms',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'connected',
        topic_matching: 'initialized',
        apis: {
          twitter: process.env.TWITTER_BEARER_TOKEN
            ? 'configured'
            : 'not_configured',
          reddit: process.env.REDDIT_CLIENT_ID
            ? 'configured'
            : 'not_configured',
          together_ai: process.env.TOGETHER_API_KEY
            ? 'configured'
            : 'not_configured',
        },
      },
      setup_instructions: {
        reddit: {
          url: 'https://www.reddit.com/prefs/apps',
          steps:
            '1. Click "Create App", 2. Choose "script", 3. Get Client ID & Secret',
          env_vars: [
            'REDDIT_CLIENT_ID',
            'REDDIT_CLIENT_SECRET',
            'REDDIT_USERNAME',
            'REDDIT_PASSWORD',
          ],
        },
        twitter: {
          url: 'https://developer.x.com/en/portal/dashboard',
          steps: 'Create project, get Bearer Token',
          env_vars: ['TWITTER_BEARER_TOKEN'],
        },
        together_ai: {
          url: 'https://together.ai',
          steps: 'Sign up, get API key',
          env_vars: ['TOGETHER_API_KEY'],
        },
      },
    };
  }
}
