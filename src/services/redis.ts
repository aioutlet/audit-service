import { createClient, RedisClientType } from 'redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class RedisService {
  private client: RedisClientType;
  private isInitialized = false;

  constructor() {
    this.client = createClient({
      url: config.redis.url,
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    this.client.on('end', () => {
      logger.info('Redis Client Disconnected');
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.client.connect();
      this.isInitialized = true;
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to initialize Redis connection:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Failed to set Redis key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Failed to get Redis key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Failed to delete Redis key ${key}:`, error);
      throw error;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const result = await this.client.incr(key);
      if (ttlSeconds && result === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      logger.error(`Failed to increment Redis key ${key}:`, error);
      throw error;
    }
  }

  async lpush(key: string, value: string): Promise<number> {
    try {
      return await this.client.lPush(key, value);
    } catch (error) {
      logger.error(`Failed to lpush to Redis key ${key}:`, error);
      throw error;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      logger.error(`Failed to rpop from Redis key ${key}:`, error);
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      logger.error(`Failed to get length of Redis key ${key}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }
}
