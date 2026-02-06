import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RedditPost {
  id: string;
  name: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  is_self: boolean;
  domain?: string;
  thumbnail?: string;
}

interface RedditListing {
  kind: string;
  data: {
    after?: string;
    before?: string;
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
  };
}

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly userAgent = 'script:sbp-event-indexer:v1.0 (by /u/yourname)';

  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('REDDIT_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('REDDIT_CLIENT_SECRET') || '';
    this.username = this.configService.get<string>('REDDIT_USERNAME') || '';
    this.password = this.configService.get<string>('REDDIT_PASSWORD') || '';

    if (
      !this.clientId ||
      !this.clientSecret ||
      !this.username ||
      !this.password
    ) {
      this.logger.warn('Reddit credentials not fully configured');
    }
  }

  private async getAccessToken(): Promise<string | null> {
    // Check if token is still valid (with 5 min buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 300000
    ) {
      return this.accessToken;
    }

    if (
      !this.clientId ||
      !this.clientSecret ||
      !this.username ||
      !this.password
    ) {
      this.logger.error('Reddit credentials not configured');
      return null;
    }

    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(
        'https://www.reddit.com/api/v1/access_token',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent,
          },
          body: `grant_type=password&username=${this.username}&password=${this.password}`,
        },
      );

      if (!response.ok) {
        this.logger.error(`Reddit auth failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      this.logger.log('Reddit access token refreshed');
      return this.accessToken || null;
    } catch (error) {
      this.logger.error(`Reddit authentication error: ${error.message}`);
      return null;
    }
  }

  async searchSubreddit(
    subreddit: string,
    query: string,
    limit: number = 100,
    sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'new',
    timeFilter: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day',
  ): Promise<
    Array<{
      id: string;
      title: string;
      content: string;
      author_id: string;
      author_username: string;
      author_name: string;
      created_at: Date;
      url: string;
      subreddit: string;
      score: number;
      raw_data: any;
    }>
  > {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query || 'bitcoin OR ethereum OR "defi protocol"',
        restrict_sr: 'true',
        sort,
        t: timeFilter,
        limit: Math.min(limit, 100).toString(),
        type: 'link',
      });

      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/search?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': this.userAgent,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Reddit search failed: ${response.status}`);
        return [];
      }

      const listing: RedditListing = await response.json();

      const posts = listing.data.children.map((child) => {
        const post = child.data;
        return {
          id: post.id,
          title: post.title,
          content: post.selftext || post.title, // Use title if no selftext
          author_id: post.author,
          author_username: post.author,
          author_name: post.author,
          created_at: new Date(post.created_utc * 1000),
          url: post.url,
          subreddit: post.subreddit,
          score: post.score,
          raw_data: {
            score: post.score,
            num_comments: post.num_comments,
            subreddit: post.subreddit,
            permalink: post.permalink,
            is_self: post.is_self,
            domain: post.domain,
            thumbnail: post.thumbnail,
          },
        };
      });

      this.logger.log(`Fetched ${posts.length} posts from r/${subreddit}`);
      return posts;
    } catch (error) {
      this.logger.error(`Error fetching from Reddit: ${error.message}`);
      return [];
    }
  }

  async getNewPosts(
    subreddit: string,
    limit: number = 100,
  ): Promise<
    Array<{
      id: string;
      title: string;
      content: string;
      author_id: string;
      author_username: string;
      author_name: string;
      created_at: Date;
      url: string;
      subreddit: string;
      score: number;
      raw_data: any;
    }>
  > {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/new?limit=${Math.min(limit, 100)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': this.userAgent,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Reddit new posts failed: ${response.status}`);
        return [];
      }

      const listing: RedditListing = await response.json();

      const posts = listing.data.children.map((child) => {
        const post = child.data;
        return {
          id: post.id,
          title: post.title,
          content: post.selftext || post.title,
          author_id: post.author,
          author_username: post.author,
          author_name: post.author,
          created_at: new Date(post.created_utc * 1000),
          url: post.url,
          subreddit: post.subreddit,
          score: post.score,
          raw_data: {
            score: post.score,
            num_comments: post.num_comments,
            subreddit: post.subreddit,
            permalink: post.permalink,
            is_self: post.is_self,
            domain: post.domain,
            thumbnail: post.thumbnail,
          },
        };
      });

      this.logger.log(`Fetched ${posts.length} new posts from r/${subreddit}`);
      return posts;
    } catch (error) {
      this.logger.error(
        `Error fetching new posts from Reddit: ${error.message}`,
      );
      return [];
    }
  }

  async getUserInfo(username: string): Promise<any | null> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(
        `https://oauth.reddit.com/user/${username}/about`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': this.userAgent,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Error fetching Reddit user: ${error.message}`);
      return null;
    }
  }
}
