import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPrompt } from '@/components/InstallPrompt';
import type { Platform } from '@/lib/hooks/useInstallPrompt';

const baseProps = {
  canInstall: true,
  isInstalled: false,
  platform: 'android' as Platform,
  promptInstall: jest.fn(),
  showIOSGuide: false,
  dismissIOSGuide: jest.fn(),
};

describe('InstallPrompt', () => {
  it('renders install banner on Android when canInstall=true', () => {
    render(<InstallPrompt {...baseProps} platform="android" />);
    expect(screen.getByText('앱으로 설치')).toBeInTheDocument();
  });

  it('renders install banner on iOS when canInstall=true', () => {
    render(<InstallPrompt {...baseProps} platform="ios" />);
    expect(screen.getByText('홈 화면에 추가')).toBeInTheDocument();
  });

  it('renders nothing when isInstalled=true', () => {
    const { container } = render(<InstallPrompt {...baseProps} isInstalled={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when canInstall=false', () => {
    const { container } = render(<InstallPrompt {...baseProps} canInstall={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls promptInstall when install button is clicked', () => {
    const promptInstall = jest.fn();
    render(<InstallPrompt {...baseProps} promptInstall={promptInstall} />);
    fireEvent.click(screen.getByText('앱으로 설치'));
    expect(promptInstall).toHaveBeenCalledTimes(1);
  });

  it('shows iOS guide modal when showIOSGuide=true', () => {
    render(<InstallPrompt {...baseProps} platform="ios" showIOSGuide={true} />);
    expect(screen.getByText('홈 화면에 추가하는 방법')).toBeInTheDocument();
    expect(screen.getByText(/공유/)).toBeInTheDocument();
  });

  it('calls dismissIOSGuide when confirm button is clicked', () => {
    const dismissIOSGuide = jest.fn();
    render(
      <InstallPrompt {...baseProps} platform="ios" showIOSGuide={true} dismissIOSGuide={dismissIOSGuide} />
    );
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(dismissIOSGuide).toHaveBeenCalledTimes(1);
  });
});
