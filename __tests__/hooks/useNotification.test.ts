import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotification } from '@/lib/hooks/useNotification';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockRegister = jest.fn();

const mockRegistration = {
  pushManager: {
    getSubscription: mockGetSubscription,
    subscribe: mockSubscribe,
  },
};

describe('useNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'PushManager', {
      value: class {},
      writable: true,
      configurable: true,
    });

    mockRegister.mockResolvedValue(mockRegistration);
    mockGetSubscription.mockResolvedValue(null);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });

  it('serviceWorker와 PushManager를 지원하면 isSupported가 true다', async () => {
    const { result } = renderHook(() => useNotification('강남구', '서울 강남구'));
    await waitFor(() => expect(result.current.isSupported).toBe(true));
  });

  it('기존 구독이 없으면 isSubscribed가 false다', async () => {
    const { result } = renderHook(() => useNotification('강남구', '서울 강남구'));
    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  it('기존 구독이 있으면 isSubscribed가 true다', async () => {
    mockGetSubscription.mockResolvedValue({ endpoint: 'https://push.example.com/sub1' });
    const { result } = renderHook(() => useNotification('강남구', '서울 강남구'));
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));
  });

  it('toggle() 호출 시 구독을 등록하고 isSubscribed를 true로 설정한다', async () => {
    const mockSub = {
      endpoint: 'https://push.example.com/sub1',
      expirationTime: null,
      toJSON: () => ({
        endpoint: 'https://push.example.com/sub1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      }),
    };
    mockSubscribe.mockResolvedValue(mockSub);

    const { result } = renderHook(() => useNotification('강남구', '서울 강남구'));
    await waitFor(() => expect(result.current.isSupported).toBe(true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/subscribe',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('toggle() 호출 시 기존 구독을 해제하고 isSubscribed를 false로 설정한다', async () => {
    const mockExistingSub = {
      endpoint: 'https://push.example.com/sub1',
      unsubscribe: mockUnsubscribe,
    };
    mockGetSubscription.mockResolvedValue(mockExistingSub);
    mockUnsubscribe.mockResolvedValue(true);

    const { result } = renderHook(() => useNotification('강남구', '서울 강남구'));
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/subscribe',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
