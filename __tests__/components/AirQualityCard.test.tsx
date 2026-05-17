import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AirQualityCard from '@/components/AirQualityCard';

describe('AirQualityCard', () => {
  const defaultProps = {
    pm25: 18,
    grade: '보통',
    color: '#22C55E',
    canVentilate: true,
    dataTime: '2026-05-05 14:00',
    loading: false,
    error: null,
  };

  it('loading=true 이면 스켈레톤을 렌더링한다', () => {
    render(<AirQualityCard {...defaultProps} loading={true} />);
    expect(screen.getByTestId('air-quality-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('보통')).not.toBeInTheDocument();
  });

  it('error가 있으면 에러 메시지를 렌더링한다', () => {
    render(<AirQualityCard {...defaultProps} error="측정소 데이터 없음" />);
    expect(screen.getByText('데이터를 불러올 수 없어요')).toBeInTheDocument();
    expect(screen.getByText('측정소 데이터 없음')).toBeInTheDocument();
  });

  it('onRetry가 있으면 다시 불러오기 버튼을 표시한다', () => {
    render(<AirQualityCard {...defaultProps} error="오류" onRetry={jest.fn()} />);
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument();
  });

  it('onRetry가 없으면 다시 불러오기 버튼을 표시하지 않는다', () => {
    render(<AirQualityCard {...defaultProps} error="오류" />);
    expect(screen.queryByRole('button', { name: '다시 불러오기' })).not.toBeInTheDocument();
  });

  it('다시 불러오기 버튼 클릭 시 onRetry를 호출한다', async () => {
    const onRetry = jest.fn();
    render(<AirQualityCard {...defaultProps} error="오류" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('정상 상태에서 grade와 pm25를 렌더링한다', () => {
    render(<AirQualityCard {...defaultProps} />);
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('canVentilate=true 이면 환기 좋음 메시지를 표시한다', () => {
    render(<AirQualityCard {...defaultProps} canVentilate={true} />);
    expect(screen.getByText('✓ 환기하기 좋아요')).toBeInTheDocument();
  });

  it('canVentilate=false 이면 환기 주의 메시지를 표시한다', () => {
    render(<AirQualityCard {...defaultProps} canVentilate={false} />);
    expect(screen.getByText('✗ 환기 주의')).toBeInTheDocument();
  });
});
