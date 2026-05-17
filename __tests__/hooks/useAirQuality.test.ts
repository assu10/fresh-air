import { renderHook, waitFor, act } from '@testing-library/react';
import { useAirQuality } from '@/lib/hooks/useAirQuality';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockData = {
  pm25: 18,
  grade: '보통',
  color: '#22C55E',
  canVentilate: true,
  stationName: '강남구',
  addr: '서울 강남구',
  dataTime: '2026-05-05 14:00',
};

describe('useAirQuality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('coords가 null이면 fetch를 호출하지 않고 초기 상태를 반환한다', () => {
    const { result } = renderHook(() => useAirQuality(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('coords가 주어지면 공기질 API를 호출하고 data를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAirQuality({ lat: 37.5, lng: 127.0 }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/air-quality?lat=37.5&lng=127');
  });

  it('API 응답이 ok=false 이면 응답 body의 error 메시지를 설정한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' }),
    });

    const { result } = renderHook(() => useAirQuality({ lat: 37.5, lng: 127.0 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('SERVICE_KEY_IS_NOT_REGISTERED_ERROR');
    expect(result.current.data).toBe(null);
  });

  it('API ok=false이고 body에 error가 없으면 기본 메시지를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useAirQuality({ lat: 37.5, lng: 127.0 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('데이터를 불러올 수 없어요');
  });

  it('네트워크 오류 시 error 메시지를 설정한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAirQuality({ lat: 37.5, lng: 127.0 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });

  it('retry() 호출 시 API를 다시 fetch한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockData });

    const { result } = renderHook(() => useAirQuality({ lat: 37.5, lng: 127.0 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('데이터를 불러올 수 없어요');

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
