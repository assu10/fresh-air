import { renderHook } from '@testing-library/react';
import { useNotification } from '@/lib/hooks/useNotification';

function mockUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

function mockMatchMedia(standalone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: standalone && query === '(display-mode: standalone)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe('useNotification — iOS standalone 체크', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: jest.fn().mockRejectedValue(new Error('test')) },
      configurable: true,
    });
    Object.defineProperty(window, 'PushManager', {
      value: class PushManager {},
      configurable: true,
    });
  });

  it('requiresInstall=false on non-iOS device', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 14)');
    mockMatchMedia(false);
    const { result } = renderHook(() => useNotification('station', 'addr'));
    expect(result.current.requiresInstall).toBe(false);
  });

  it('requiresInstall=true on iOS when not in standalone mode', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    mockMatchMedia(false);
    const { result } = renderHook(() => useNotification('station', 'addr'));
    expect(result.current.requiresInstall).toBe(true);
  });

  it('requiresInstall=false on iOS when in standalone mode', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    mockMatchMedia(true);
    const { result } = renderHook(() => useNotification('station', 'addr'));
    expect(result.current.requiresInstall).toBe(false);
  });

  it('isSupported=false on iOS when not in standalone mode', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    mockMatchMedia(false);
    const { result } = renderHook(() => useNotification('station', 'addr'));
    expect(result.current.isSupported).toBe(false);
  });
});
