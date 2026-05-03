import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis 키 상수
export const KEYS = {
  subscriptions: 'subscriptions',
  lastPm25: (stationName: string) => `last_pm25:${stationName}`,
} as const;
