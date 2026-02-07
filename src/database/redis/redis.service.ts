import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Support both REDIS_URL (connection string) and individual parameters
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      // Use connection string if provided
      this.logger.log('Connecting to Redis using REDIS_URL');
      this.redisClient = new Redis(redisUrl);
    } else {
      // Fall back to individual configuration parameters
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      this.logger.log(`Connecting to Redis at ${host}:${port}`);

      this.redisClient = new Redis({
        host,
        port,
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        db: this.configService.get<number>('REDIS_DB', 0),
      });
    }

    // Handle connection events
    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redisClient.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
