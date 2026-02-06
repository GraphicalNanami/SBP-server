import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    hashtags?: Array<{ start: number; end: number; tag: string }>;
    mentions?: Array<{ start: number; end: number; username: string }>;
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expanded_url: string;
    }>;
  };
  lang?: string;
  conversation_id?: string;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified_type?: string;
}

interface TwitterApiResponse {
  data: TwitterPost[];
  includes?: {
    users: TwitterUser[];
  };
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token?: string;
  };
  errors?: Array<{ detail: string; title: string; resource_type: string }>;
}

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);
  private readonly bearerToken: string;
  private readonly baseUrl = 'https://api.x.com/2';

  constructor(private configService: ConfigService) {
    this.bearerToken =
      this.configService.get<string>('TWITTER_BEARER_TOKEN') || '';
    if (!this.bearerToken) {
      this.logger.warn('TWITTER_BEARER_TOKEN not configured');
    }
  }

  async searchRecentPosts(
    query: string,
    maxResults: number = 100,
    sinceId?: string,
  ): Promise<{
    posts: Array<{
      id: string;
      text: string;
      created_at: Date;
      author_id: string;
      author_username: string;
      author_name: string;
      url: string;
      metrics: any;
      raw_data: any;
    }>;
    meta: { newest_id: string; oldest_id: string };
  }> {
    if (!this.bearerToken) {
      this.logger.error('Twitter Bearer Token not configured');
      return { posts: [], meta: { newest_id: '', oldest_id: '' } };
    }

    try {
      // Build Stellar-focused query with proper Twitter syntax
      const stellarQuery = query
        ? `(${query}) lang:en -is:retweet -is:reply`
        : '(stellar OR "stellar lumens" OR xlm OR soroban OR "stellar network") lang:en -is:retweet -is:reply';

      this.logger.log(`Searching Twitter with query: ${stellarQuery}`);

      const params = new URLSearchParams({
        query: stellarQuery,
        max_results: Math.min(maxResults, 100).toString(),
        sort_order: 'recency',
        'tweet.fields':
          'id,text,created_at,author_id,public_metrics,entities,lang,conversation_id',
        expansions: 'author_id',
        'user.fields':
          'id,username,name,profile_image_url,public_metrics,verified_type',
      });

      if (sinceId) {
        params.set('since_id', sinceId);
      }

      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            'User-Agent': 'SBP-EventIndexer/1.0',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Twitter API error: ${response.status} ${errorText}`);
        return { posts: [], meta: { newest_id: '', oldest_id: '' } };
      }

      const data: TwitterApiResponse = await response.json();

      // Create user map for quick lookups
      const userMap = new Map<string, TwitterUser>();
      if (data.includes?.users) {
        data.includes.users.forEach((user) => userMap.set(user.id, user));
      }

      // Transform posts to our format
      const posts = (data.data || []).map((post) => {
        const user = userMap.get(post.author_id);
        return {
          id: post.id,
          text: post.text,
          created_at: new Date(post.created_at),
          author_id: post.author_id,
          author_username: user?.username || 'unknown',
          author_name: user?.name || 'Unknown User',
          url: `https://x.com/${user?.username || 'i'}/status/${post.id}`,
          metrics: post.public_metrics,
          raw_data: {
            public_metrics: post.public_metrics,
            entities: post.entities,
            lang: post.lang,
            conversation_id: post.conversation_id,
          },
        };
      });

      this.logger.log(`Fetched ${posts.length} posts from Twitter`);

      return {
        posts,
        meta: {
          newest_id: data.meta.newest_id,
          oldest_id: data.meta.oldest_id,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching from Twitter: ${error.message}`);
      return { posts: [], meta: { newest_id: '', oldest_id: '' } };
    }
  }

  async getUserById(userId: string): Promise<TwitterUser | null> {
    if (!this.bearerToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/users/${userId}?user.fields=id,username,name,profile_image_url,public_metrics,verified_type`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            'User-Agent': 'SBP-EventIndexer/1.0',
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Error fetching Twitter user: ${error.message}`);
      return null;
    }
  }
}
