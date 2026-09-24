const Redis = require('ioredis');
const { logger } = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('[Redis] No REDIS_URL provided in environment. Caching will be disabled.');
      return;
    }

    try {
      const sanitizedUrl = redisUrl.replace(/:([^:@]+)@/, ':***@');
      logger.info(`[Redis] Connecting to Cloud Cache: ${sanitizedUrl.split('@')[1] || sanitizedUrl}`);

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 1000, 10000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        enableReadyCheck: true,
        lazyConnect: false
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('[Redis] Cloud Cache connected successfully.');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('[Redis] Cloud Cache ready to serve requests.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.warn(`[Redis] Connection warning: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      logger.error(`[Redis] Initialization failed: ${err.message}`);
      this.client = null;
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      logger.warn(`[Redis] Get failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.client || !this.isConnected) return false;
    try {
      const stringified = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, stringified, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringified);
      }
      return true;
    } catch (err) {
      logger.warn(`[Redis] Set failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.warn(`[Redis] Del failed for key "${key}": ${err.message}`);
      return false;
    }
  }

  async delByPattern(pattern) {
    if (!this.client || !this.isConnected) return false;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
      return true;
    } catch (err) {
      logger.warn(`[Redis] DelByPattern failed for pattern "${pattern}": ${err.message}`);
      return false;
    }
  }

  async healthCheck() {
    if (!this.client || !this.isConnected) return { status: 'offline' };
    try {
      const ping = await this.client.ping();
      return { status: 'online', ping };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

const cacheService = new CacheService();

module.exports = {
  cache: cacheService,
  CacheService
};
