import { renderHook, waitFor } from '@testing-library/react';
import { useReverseGeocode } from '@/lib/hooks/useReverseGeocode';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeNominatimResponse(addressFields: Record<string, string>) {
  return {
    ok: true,
    json: async () => ({ address: addressFields }),
  };
}

describe('useReverseGeocode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('coords가 null이면 fetch를 호출하지 않는다', () => {
    renderHook(() => useReverseGeocode(null));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('suburb(동)을 우선으로 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(
      makeNominatimResponse({ suburb: '역삼1동', borough: '강남구', city: '서울특별시' }),
    );
    const { result } = renderHook(() => useReverseGeocode({ lat: 37.4979, lng: 127.0276 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locationName).toBe('역삼1동');
  });

  it('suburb가 없으면 quarter를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce(
      makeNominatimResponse({ quarter: '태평로1가', borough: '중구', city: '서울특별시' }),
    );
    const { result } = renderHook(() => useReverseGeocode({ lat: 37.5665, lng: 126.978 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locationName).toBe('태평로1가');
  });

  it('suburb·quarter 모두 없으면 borough(구)를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce(
      makeNominatimResponse({ borough: '강남구', city: '서울특별시' }),
    );
    const { result } = renderHook(() => useReverseGeocode({ lat: 37.5, lng: 127.0 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locationName).toBe('강남구');
  });

  it('fetch 실패 시 locationName은 null이다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useReverseGeocode({ lat: 37.5, lng: 127.0 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locationName).toBeNull();
  });

  it('coords 변경 시 재요청한다', async () => {
    mockFetch
      .mockResolvedValueOnce(makeNominatimResponse({ suburb: '역삼1동' }))
      .mockResolvedValueOnce(makeNominatimResponse({ suburb: '명동' }));

    const { result, rerender } = renderHook(
      ({ coords }) => useReverseGeocode(coords),
      { initialProps: { coords: { lat: 37.4979, lng: 127.0276 } } },
    );
    await waitFor(() => expect(result.current.locationName).toBe('역삼1동'));

    rerender({ coords: { lat: 37.5665, lng: 126.978 } });
    await waitFor(() => expect(result.current.locationName).toBe('명동'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
