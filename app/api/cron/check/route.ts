import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/lib/redis';
import type { StoredSubscription } from '@/lib/webpush';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawSubs =
    ((await redis.hgetall(KEYS.subscriptions)) as Record<string, string> | null) ?? {};

  const stationMap = new Map<string, Array<{ key: string; sub: StoredSubscription }>>();
  for (const [key, value] of Object.entries(rawSubs)) {
    try {
      const sub = JSON.parse(value) as StoredSubscription;
      if (!stationMap.has(sub.stationName)) stationMap.set(sub.stationName, []);
      stationMap.get(sub.stationName)!.push({ key, sub });
    } catch {
      // 파싱 실패 시 무시
    }
  }

  const stats = { processed: 0, notified: 0, deleted: 0, skipped: 0 };

  return NextResponse.json(stats);
}
