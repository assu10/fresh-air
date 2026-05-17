import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';

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

describe('useInstallPrompt', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    Object.defineProperty(navigator, 'standalone', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('isInstalled=true when display-mode is standalone', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstalled).toBe(true);
  });

  it('isInstalled=false when not in standalone mode', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstalled).toBe(false);
  });

  it('platform=ios on iPhone userAgent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.platform).toBe('ios');
  });

  it('platform=ios on iPad userAgent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
      configurable: true,
    });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.platform).toBe('ios');
  });

  it('platform=android on Android userAgent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome/120',
      configurable: true,
    });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.platform).toBe('android');
  });

  it('canInstall=true on iOS when not installed', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    mockMatchMedia(false);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(true);
  });

  it('canInstall=false on iOS when already installed', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    mockMatchMedia(true);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('showIOSGuide toggles when promptInstall called on iOS', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.showIOSGuide).toBe(false);
    await act(async () => { await result.current.promptInstall(); });
    expect(result.current.showIOSGuide).toBe(true);

    act(() => { result.current.dismissIOSGuide(); });
    expect(result.current.showIOSGuide).toBe(false);
  });

  it('canInstall=true when beforeinstallprompt fires', async () => {
    const mockPrompt = jest.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });
    const { result } = renderHook(() => useInstallPrompt());

    await act(async () => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, { prompt: mockPrompt, userChoice: mockUserChoice });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });
});
