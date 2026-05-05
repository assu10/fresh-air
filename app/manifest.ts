import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fresh Air',
    short_name: 'Fresh Air',
    description: '미세먼지 환기 알림 — PM2.5가 개선되면 알려드립니다',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#22C55E',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
