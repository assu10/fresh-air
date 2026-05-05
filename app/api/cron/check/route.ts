import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/lib/redis';
import { getRealtimeAirQuality } from '@/lib/airkorea';
import { sendPushNotification } from '@/lib/webpush';
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
  const stationEntries = [...stationMap.entries()];

  const results = await Promise.allSettled(
    stationEntries.map(([stationName]) => getRealtimeAirQuality(stationName)),
  );

  for (let i = 0; i < stationEntries.length; i++) {
    const [stationName, subscribers] = stationEntries[i];
    const result = results[i];

    if (result.status === 'rejected') {
      stats.skipped++;
      continue;
    }

    const { pm25Value } = result.value;
    stats.processed++;

    if (pm25Value === null) continue;

    const prevRaw = await redis.get(KEYS.lastPm25(stationName));
    const prev = prevRaw !== null ? Number(prevRaw) : null;

    const shouldNotify = prev !== null && prev > 35 && pm25Value <= 35;

    if (shouldNotify) {
      for (const { sub } of subscribers) {
        try {
          await sendPushNotification(
            { endpoint: sub.endpoint, keys: sub.keys, expirationTime: sub.expirationTime },
            { title: '환기하기 좋은 날씨예요!', body: `${sub.regionName} PM2.5 ${pm25Value} μg/m³ — 지금 환기하세요.` },
          );
          stats.notified++;
        } catch {
          // push 실패 로그 — 410 처리는 Task 5에서 추가
        }
      }
    }

    await redis.set(KEYS.lastPm25(stationName), pm25Value);
  }

  return NextResponse.json(stats);
}
