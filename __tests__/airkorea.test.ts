import { getNearbyStations, getRealtimeAirQuality } from '@/lib/airkorea';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeStationResponse(items: unknown[], resultCode = '00') {
  return {
    ok: true,
    json: async () => ({
      response: {
        header: { resultCode, resultMsg: resultCode === '00' ? 'NORMAL_CODE' : 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' },
        body: { items },
      },
    }),
  };
}

function makeAirQualityResponse(item: unknown, resultCode = '00') {
  return {
    ok: true,
    json: async () => ({
      response: {
        header: { resultCode, resultMsg: resultCode === '00' ? 'NORMAL_CODE' : 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' },
        body: { items: item ? [item] : [] },
      },
    }),
  };
}

describe('getNearbyStations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정상 응답이면 측정소 목록을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      makeStationResponse([
        { stationName: '강남구', addr: '서울 강남구', tm: '1.23' },
      ]),
    );
    const result = await getNearbyStations(200000, 450000);
    expect(result).toEqual([{ stationName: '강남구', addr: '서울 강남구', tm: 1.23 }]);
  });

  it('resultCode가 00이 아니면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce(makeStationResponse([], '30'));
    await expect(getNearbyStations(200000, 450000)).rejects.toThrow(
      'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
    );
  });

  it('HTTP 오류면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getNearbyStations(200000, 450000)).rejects.toThrow('측정소 조회 실패: 500');
  });
});

describe('getRealtimeAirQuality', () => {
  beforeEach(() => jest.clearAllMocks());

  it('정상 응답이면 pm25 데이터를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      makeAirQualityResponse({ pm25Value: '18', pm25Grade: '2', dataTime: '2026-05-17 14:00' }),
    );
    const result = await getRealtimeAirQuality('강남구');
    expect(result.pm25Value).toBe(18);
    expect(result.dataTime).toBe('2026-05-17 14:00');
  });

  it('resultCode가 00이 아니면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce(makeAirQualityResponse(null, '30'));
    await expect(getRealtimeAirQuality('강남구')).rejects.toThrow(
      'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
    );
  });

  it('HTTP 오류면 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getRealtimeAirQuality('강남구')).rejects.toThrow('대기질 조회 실패: 500');
  });
});
