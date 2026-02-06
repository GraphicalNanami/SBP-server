import { Injectable, Logger } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { RedditService } from './reddit.service';
import { PostProcessingService } from './post-processing.service';

@Injectable()
export class EventsIndexerService {
  private readonly logger = new Logger(EventsIndexerService.name);

  constructor(
    private twitterService: TwitterService,
    private redditService: RedditService,
    private postProcessingService: PostProcessingService
  ) {}

  async indexTwitterPosts(query?: string, maxResults: number = 100): Promise<{
    fetched: number;
    processed: number;
    skipped: number;
    errors: number;
  }> {
    this.logger.log(`Starting Twitter indexing - max ${maxResults} posts`);

    try {
      // Fetch posts from Twitter with Stellar-focused query
      const stellarQuery = query || 'stellar OR "stellar lumens" OR xlm OR soroban';
      this.logger.log(`Twitter search query: ${stellarQuery}`);
      
      const response = await this.twitterService.searchRecentPosts(stellarQuery, maxResults);
      
      if (response.posts.length === 0) {
        return { fetched: 0, processed: 0, skipped: 0, errors: 0 };
      }

      // Transform to common format
      const transformedPosts = response.posts.map(post => ({
        platform: 'twitter' as const,
        platform_id: post.id,
        content: post.text,
        author_id: post.author_id,
        author_username: post.author_username,
        author_name: post.author_name,
        created_at: post.created_at,
        url: post.url,
        raw_data: post.raw_data
      }));

      // Process posts
      const result = await this.postProcessingService.processPosts(transformedPosts);

      this.logger.log(`Twitter indexing complete: ${response.posts.length} fetched, ${result.processed} processed`);

      return {
        fetched: response.posts.length,
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors
      };

    } catch (error) {
      this.logger.error(`Error indexing Twitter posts: ${error.message}`, error.stack);
      return { fetched: 0, processed: 0, skipped: 0, errors: 1 };
    }
  }

  async indexRedditPosts(
    subreddit: string = 'Bitcoin',
    query?: string,
    maxResults: number = 100
  ): Promise<{
    fetched: number;
    processed: number;
    skipped: number;
    errors: number;
  }> {
    this.logger.log(`Starting Reddit indexing - r/${subreddit}, max ${maxResults} posts`);

    try {
      // Fetch posts from Reddit
      let posts;
      if (query) {
        posts = await this.redditService.searchSubreddit(subreddit, query, maxResults);
      } else {
        posts = await this.redditService.getNewPosts(subreddit, maxResults);
      }
      
      if (posts.length === 0) {
        return { fetched: 0, processed: 0, skipped: 0, errors: 0 };
      }

      // Transform to common format
      const transformedPosts = posts.map(post => ({
        platform: 'reddit' as const,
        platform_id: post.id,
        content: `${post.title}\n\n${post.content}`.trim(),
        author_id: post.author_id,
        author_username: post.author_username,
        author_name: post.author_name,
        created_at: post.created_at,
        url: post.url,
        raw_data: post.raw_data
      }));

      // Process posts
      const result = await this.postProcessingService.processPosts(transformedPosts);

      this.logger.log(`Reddit indexing complete: ${posts.length} fetched, ${result.processed} processed`);

      return {
        fetched: posts.length,
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors
      };

    } catch (error) {
      this.logger.error(`Error indexing Reddit posts: ${error.message}`, error.stack);
      return { fetched: 0, processed: 0, skipped: 0, errors: 1 };
    }
  }

  async runSingleIndexCycle(options: {
    twitterQuery?: string;
    redditSubreddits?: string[];
    redditQuery?: string;
    maxResults?: number;
  } = {}): Promise<{
    twitter: { fetched: number; processed: number; skipped: number; errors: number };
    reddit: { fetched: number; processed: number; skipped: number; errors: number };
    total_processed: number;
  }> {
    const {
      twitterQuery,
      redditSubreddits = ['Bitcoin', 'ethereum', 'CryptoCurrency', 'defi'],
      redditQuery,
      maxResults = 100
    } = options;

    this.logger.log('Starting single index cycle (proof-of-concept)');

    // Index Twitter posts
    const twitterResult = await this.indexTwitterPosts(twitterQuery, maxResults);

    // Try Reddit posts, but continue if not configured
    let redditResult = { fetched: 0, processed: 0, skipped: 0, errors: 0 };
    
    const hasRedditConfig = process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET;
    if (hasRedditConfig) {
      const redditResults: Array<{
        fetched: number;
        processed: number;
        skipped: number;
        errors: number;
      }> = [];
      const postsPerSubreddit = Math.floor(maxResults / redditSubreddits.length);
      
      for (const subreddit of redditSubreddits) {
        const result = await this.indexRedditPosts(subreddit, redditQuery, postsPerSubreddit);
        redditResults.push(result);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Aggregate Reddit results
      redditResult = redditResults.reduce(
        (acc, curr) => ({
          fetched: acc.fetched + curr.fetched,
          processed: acc.processed + curr.processed,
          skipped: acc.skipped + curr.skipped,
          errors: acc.errors + curr.errors
        }),
        { fetched: 0, processed: 0, skipped: 0, errors: 0 }
      );
    } else {
      this.logger.log('Reddit API not configured, skipping Reddit indexing');
    }

    const totalProcessed = twitterResult.processed + redditResult.processed;

    this.logger.log(`Index cycle complete: ${totalProcessed} total posts processed`);

    return {
      twitter: twitterResult,
      reddit: redditResult,
      total_processed: totalProcessed
    };
  }

  // Analytics methods
  async getIndexingStats(hours: number = 24): Promise<{
    total_posts: number;
    by_platform: Record<string, number>;
    top_topics: Array<{ topic: string; count: number }>;
    recent_activity: any;
  }> {
    try {
      const recentPosts = await this.postProcessingService.getRecentPosts(hours);
      
      // Count by platform
      const byPlatform = recentPosts.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {});

      // Count topics
      const topicCounts = new Map<string, number>();
      for (const post of recentPosts) {
        for (const topic of post.topics) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }

      const topTopics = Array.from(topicCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([topic, count]) => ({ topic, count }));

      return {
        total_posts: recentPosts.length,
        by_platform: byPlatform,
        top_topics: topTopics,
        recent_activity: recentPosts.slice(0, 10).map(post => ({
          id: post._id,
          platform: post.platform,
          created_at: post.created_at,
          topics: post.topics.slice(0, 3),
          content_preview: post.content.substring(0, 100) + '...'
        }))
      };

    } catch (error) {
      this.logger.error(`Error getting indexing stats: ${error.message}`);
      return {
        total_posts: 0,
        by_platform: {},
        top_topics: [],
        recent_activity: []
      };
    }
  }
}