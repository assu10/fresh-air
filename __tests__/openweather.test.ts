import { getOpenWeatherAirQuality } from '@/lib/openweather';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(pm2_5: number, time = '2026-05-17T13:00') {
  return {
    ok: true,
    json: async () => ({
      current: { time, interval: 3600, pm2_5 },
    }),
  };
}

describe('getOpenWeatherAirQuality (Open-Meteo)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정상 응답이면 pm25와 dataTime을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(16.6, '2026-05-17T13:00'));
    const result = await getOpenWeatherAirQuality(37.5, 127.0);
    expect(result.pm25).toBe(16.6);
    expect(result.dataTime).toContain('2026');
  });

  it('HTTP 오류면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getOpenWeatherAirQuality(37.5, 127.0)).rejects.toThrow('500');
  });

  it('응답에 current 데이터가 없으면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await expect(getOpenWeatherAirQuality(37.5, 127.0)).rejects.toThrow('데이터 없음');
  });
});
