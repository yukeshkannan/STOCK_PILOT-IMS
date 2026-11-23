const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Redis = require('ioredis');

async function flushCache() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('ℹ️  No REDIS_URL configured in .env. Skipping Redis flush.');
    process.exit(0);
  }

  console.log('🧹 Connecting to Redis Cloud cache...');
  const redis = new Redis(url, { connectTimeout: 8000 });

  try {
    const ping = await redis.ping();
    console.log(`Connected to Redis: ${ping}`);
    await redis.flushdb();
    console.log('✅ Redis Cache flushed successfully! All stale keys cleared.');
    await redis.quit();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to flush cache:', err.message);
    process.exit(1);
  }
}

flushCache();
