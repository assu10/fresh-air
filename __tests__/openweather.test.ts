import { getOpenWeatherAirQuality } from '@/lib/openweather';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(pm2_5: number, dt = 1747440000) {
  return {
    ok: true,
    json: async () => ({
      list: [{ components: { pm2_5 }, dt }],
    }),
  };
}

describe('getOpenWeatherAirQuality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENWEATHER_API_KEY;
  });

  it('정상 응답이면 pm25와 dataTime을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(18.5, 1747440000));
    const result = await getOpenWeatherAirQuality(37.5, 127.0);
    expect(result.pm25).toBe(18.5);
    expect(typeof result.dataTime).toBe('string');
    expect(result.dataTime.length).toBeGreaterThan(0);
  });

  it('API key가 없으면 fetch 없이 에러를 던진다', async () => {
    delete process.env.OPENWEATHER_API_KEY;
    await expect(getOpenWeatherAirQuality(37.5, 127.0)).rejects.toThrow('OPENWEATHER_API_KEY');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('HTTP 오류면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(getOpenWeatherAirQuality(37.5, 127.0)).rejects.toThrow('401');
  });

  it('응답에 데이터가 없으면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ list: [] }),
    });
    await expect(getOpenWeatherAirQuality(37.5, 127.0)).rejects.toThrow('데이터 없음');
  });
});
