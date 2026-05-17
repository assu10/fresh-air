/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/air-quality/route';

jest.mock('@/lib/airkorea', () => ({
  getNearbyStations: jest.fn(),
  getRealtimeAirQuality: jest.fn(),
}));

jest.mock('@/lib/openweather', () => ({
  getOpenWeatherAirQuality: jest.fn(),
}));

jest.mock('@/lib/geo', () => ({
  wgs84ToTm: jest.fn(() => ({ tmX: 200000, tmY: 450000 })),
  getGradeInfo: jest.fn((pm25: number) => ({
    grade: pm25 <= 15 ? '좋음' : pm25 <= 35 ? '보통' : '나쁨',
    color: pm25 <= 15 ? '#3B82F6' : pm25 <= 35 ? '#22C55E' : '#F97316',
    canVentilate: pm25 <= 35,
  })),
}));

import { getNearbyStations, getRealtimeAirQuality } from '@/lib/airkorea';
import { getOpenWeatherAirQuality } from '@/lib/openweather';

const mockGetNearbyStations = getNearbyStations as jest.Mock;
const mockGetRealtimeAirQuality = getRealtimeAirQuality as jest.Mock;
const mockGetOpenWeather = getOpenWeatherAirQuality as jest.Mock;

function makeRequest(lat = 37.5, lng = 127.0) {
  return new NextRequest(`http://localhost/api/air-quality?lat=${lat}&lng=${lng}`);
}

describe('GET /api/air-quality', () => {
  beforeEach(() => jest.clearAllMocks());

  it('에어코리아 성공 시 정상 데이터를 반환한다', async () => {
    mockGetNearbyStations.mockResolvedValueOnce([
      { stationName: '강남구', addr: '서울 강남구', tm: 1.2 },
    ]);
    mockGetRealtimeAirQuality.mockResolvedValueOnce({
      pm25Value: 18,
      pm25Grade: 2,
      dataTime: '2026-05-17 14:00',
      stationName: '강남구',
    });

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pm25).toBe(18);
    expect(json.stationName).toBe('강남구');
    expect(json.source).toBe('airkorea');
  });

  it('에어코리아 실패 시 OpenWeatherMap 폴백을 사용한다', async () => {
    mockGetNearbyStations.mockRejectedValueOnce(new Error('SERVICE_KEY_IS_NOT_REGISTERED_ERROR'));
    mockGetOpenWeather.mockResolvedValueOnce({
      pm25: 22,
      dataTime: '2026-05-17 14:00',
    });

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pm25).toBe(22);
    expect(json.source).toBe('openweather');
    expect(json.stationName).toBe('현재 위치');
  });

  it('에어코리아와 OpenWeatherMap 모두 실패 시 500을 반환한다', async () => {
    mockGetNearbyStations.mockRejectedValueOnce(new Error('airkorea 오류'));
    mockGetOpenWeather.mockRejectedValueOnce(new Error('openweather 오류'));

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('openweather 오류');
  });

  it('한국 영역 밖 좌표는 400을 반환한다', async () => {
    const res = await GET(makeRequest(0, 0));
    expect(res.status).toBe(400);
  });
});
