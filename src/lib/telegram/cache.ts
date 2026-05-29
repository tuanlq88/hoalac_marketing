import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;
  _redis = new Redis({
    url: import.meta.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });
  return _redis;
}

export async function isDuplicate(key: string, ttlSeconds: number): Promise<boolean> {
  const redis = getRedis();
  const existing = await redis.get(key);
  if (existing) return true;
  await redis.set(key, '1', { ex: ttlSeconds });
  return false;
}

export async function saveMessageId(leadId: string, messageId: string): Promise<void> {
  await getRedis().set(`msg:${leadId}`, messageId);
}

export async function getMessageId(leadId: string): Promise<string | null> {
  return await getRedis().get(`msg:${leadId}`);
}
