import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { redis, KEYS } from '@/lib/redis';
import type { StoredSubscription } from '@/lib/webpush';

interface SubscribeBody {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime: number | null;
  };
  stationName: string;
  regionName: string;
}

function endpointHash(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 24);
}

// POST /api/subscribe — 푸시 구독 등록
export async function POST(request: NextRequest) {
  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { subscription, stationName, regionName } = body;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: '구독 정보가 올바르지 않습니다.' }, { status: 400 });
  }

  if (!stationName) {
    return NextResponse.json({ error: 'stationName이 필요합니다.' }, { status: 400 });
  }

  const stored: StoredSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    expirationTime: subscription.expirationTime,
    stationName,
    regionName,
  };

  const key = endpointHash(subscription.endpoint);
  await redis.hset(KEYS.subscriptions, { [key]: JSON.stringify(stored) });

  return NextResponse.json({ ok: true });
}

// DELETE /api/subscribe — 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  let body: { endpoint: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  if (!body?.endpoint) {
    return NextResponse.json({ error: 'endpoint가 필요합니다.' }, { status: 400 });
  }

  const key = endpointHash(body.endpoint);
  await redis.hdel(KEYS.subscriptions, key);

  return NextResponse.json({ ok: true });
}
