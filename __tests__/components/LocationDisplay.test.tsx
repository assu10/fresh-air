import { render, screen } from '@testing-library/react';
import LocationDisplay from '@/components/LocationDisplay';

describe('LocationDisplay', () => {
  it('loading=true 이면 스켈레톤을 렌더링한다', () => {
    render(<LocationDisplay stationName={null} addr={null} loading={true} />);
    expect(screen.getByTestId('location-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('📍')).not.toBeInTheDocument();
  });

  it('addr이 있으면 addr을 표시한다', () => {
    render(<LocationDisplay stationName="강남구" addr="서울 강남구" loading={false} />);
    expect(screen.getByText('서울 강남구')).toBeInTheDocument();
  });

  it('addr이 null이면 stationName을 표시한다', () => {
    render(<LocationDisplay stationName="강남구" addr={null} loading={false} />);
    expect(screen.getByText('강남구')).toBeInTheDocument();
  });
});
