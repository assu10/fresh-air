import { render, screen } from '@testing-library/react';
import LocationDisplay from '@/components/LocationDisplay';

describe('LocationDisplay', () => {
  it('loading=true 이면 스켈레톤을 렌더링한다', () => {
    render(<LocationDisplay locationName={null} loading={true} />);
    expect(screen.getByTestId('location-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('📍')).not.toBeInTheDocument();
  });

  it('locationName이 있으면 표시한다', () => {
    render(<LocationDisplay locationName="역삼1동" loading={false} />);
    expect(screen.getByText('역삼1동')).toBeInTheDocument();
  });

  it('locationName이 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<LocationDisplay locationName={null} loading={false} />);
    expect(container.firstChild).toBeNull();
  });
});
