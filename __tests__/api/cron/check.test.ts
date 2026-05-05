/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/cron/check/route';
import { redis } from '@/lib/redis';
import { getRealtimeAirQuality } from '@/lib/airkorea';
import { sendPushNotification } from '@/lib/webpush';
import type { StoredSubscription } from '@/lib/webpush';

jest.mock('@/lib/redis', () => ({
  redis: {
    hgetall: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    hdel: jest.fn(),
  },
  KEYS: {
    subscriptions: 'subscriptions',
    lastPm25: (name: string) => `last_pm25:${name}`,
  },
}));

jest.mock('@/lib/airkorea', () => ({
  getRealtimeAirQuality: jest.fn(),
}));

jest.mock('@/lib/webpush', () => ({
  sendPushNotification: jest.fn(),
}));

const mockHgetall = redis.hgetall as jest.Mock;
const mockGet = redis.get as jest.Mock;
const mockSet = redis.set as jest.Mock;
const mockHdel = redis.hdel as jest.Mock;
const mockGetAirQuality = getRealtimeAirQuality as jest.Mock;
const mockSendPush = sendPushNotification as jest.Mock;

function makeRequest(token?: string): NextRequest {
  return new NextRequest('http://localhost/api/cron/check', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const mockSub: StoredSubscription = {
  endpoint: 'https://push.example.com/sub1',
  keys: { p256dh: 'key1', auth: 'auth1' },
  expirationTime: null,
  stationName: '강남구',
  regionName: '서울 강남구',
};

function subMap(key = 'abc123', sub = mockSub): Record<string, string> {
  return { [key]: JSON.stringify(sub) };
}

describe('POST /api/cron/check', () => {
  const SECRET = 'test-secret';

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    jest.clearAllMocks();
  });

  describe('임계값 미전환 (no-push)', () => {
    it('이전값 ≤ 35, 현재값 ≤ 35 이면 push를 발송하지 않는다', async () => {
      mockHgetall.mockResolvedValue(subMap());
      mockGetAirQuality.mockResolvedValue({ pm25Value: 20, pm25Grade: 2, dataTime: '', stationName: '강남구' });
      mockGet.mockResolvedValue('25');

      const res = await POST(makeRequest(SECRET));
      const body = await res.json();

      expect(mockSendPush).not.toHaveBeenCalled();
      expect(body.notified).toBe(0);
      expect(body.processed).toBe(1);
    });

    it('이전값 > 35, 현재값 > 35 이면 push를 발송하지 않는다', async () => {
      mockHgetall.mockResolvedValue(subMap());
      mockGetAirQuality.mockResolvedValue({ pm25Value: 50, pm25Grade: 3, dataTime: '', stationName: '강남구' });
      mockGet.mockResolvedValue('60');

      const res = await POST(makeRequest(SECRET));
      const body = await res.json();

      expect(mockSendPush).not.toHaveBeenCalled();
      expect(body.notified).toBe(0);
    });

    it('이전값이 없으면(첫 실행) push를 발송하지 않고 현재값을 저장한다', async () => {
      mockHgetall.mockResolvedValue(subMap());
      mockGetAirQuality.mockResolvedValue({ pm25Value: 20, pm25Grade: 2, dataTime: '', stationName: '강남구' });
      mockGet.mockResolvedValue(null);

      const res = await POST(makeRequest(SECRET));
      const body = await res.json();

      expect(mockSendPush).not.toHaveBeenCalled();
      expect(body.notified).toBe(0);
      expect(mockSet).toHaveBeenCalledWith('last_pm25:강남구', 20);
    });
  });

  describe('임계값 전환 (push 발송)', () => {
    it('이전값 > 35, 현재값 ≤ 35 이면 push를 발송하고 notified를 증가시킨다', async () => {
      mockHgetall.mockResolvedValue(subMap());
      mockGetAirQuality.mockResolvedValue({ pm25Value: 30, pm25Grade: 2, dataTime: '', stationName: '강남구' });
      mockGet.mockResolvedValue('50');
      mockSendPush.mockResolvedValue(undefined);

      const res = await POST(makeRequest(SECRET));
      const body = await res.json();

      expect(mockSendPush).toHaveBeenCalledWith(
        { endpoint: mockSub.endpoint, keys: mockSub.keys, expirationTime: mockSub.expirationTime },
        { title: '환기하기 좋은 날씨예요!', body: '서울 강남구 PM2.5 30 μg/m³ — 지금 환기하세요.' },
      );
      expect(body.notified).toBe(1);
      expect(body.processed).toBe(1);
    });
  });

  describe('구독 없음', () => {
    it('구독이 없으면 빈 통계를 반환한다', async () => {
      mockHgetall.mockResolvedValue(null);

      const res = await POST(makeRequest(SECRET));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ processed: 0, notified: 0, deleted: 0, skipped: 0 });
    });
  });

  describe('인증', () => {
    it('Authorization 헤더가 없으면 401을 반환한다', async () => {
      const res = await POST(makeRequest());
      expect(res.status).toBe(401);
    });

    it('잘못된 토큰이면 401을 반환한다', async () => {
      const res = await POST(makeRequest('wrong-token'));
      expect(res.status).toBe(401);
    });
  });
});
