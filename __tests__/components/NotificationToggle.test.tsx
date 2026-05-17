import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationToggle from '@/components/NotificationToggle';

describe('NotificationToggle', () => {
  const defaultProps = {
    isSubscribed: false,
    isSupported: true,
    loading: false,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isSupported=false 이면 HTTPS 안내 메시지를 표시한다', () => {
    render(<NotificationToggle {...defaultProps} isSupported={false} />);
    expect(screen.getByText('HTTPS 환경에서만 지원됩니다')).toBeInTheDocument();
  });

  it('isSupported=false 이면 버튼이 비활성화된다', () => {
    render(<NotificationToggle {...defaultProps} isSupported={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('loading=true 이면 버튼이 비활성화된다', () => {
    render(<NotificationToggle {...defaultProps} loading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('isSubscribed=false 이면 구독 안내 문구를 표시한다', () => {
    render(<NotificationToggle {...defaultProps} />);
    expect(screen.getByText('PM2.5 ≤ 35 되면 알림')).toBeInTheDocument();
  });

  it('isSubscribed=true 이면 알림 켜짐 상태를 표시한다', () => {
    render(<NotificationToggle {...defaultProps} isSubscribed={true} />);
    expect(screen.getByText('알림이 켜져 있어요')).toBeInTheDocument();
  });

  it('버튼 클릭 시 onToggle을 호출한다', async () => {
    const onToggle = jest.fn();
    render(<NotificationToggle {...defaultProps} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
