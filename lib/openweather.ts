const BASE = 'https://api.openweathermap.org/data/2.5/air_pollution';

export interface OpenWeatherAirQuality {
  pm25: number;
  dataTime: string;
}

export async function getOpenWeatherAirQuality(
  lat: number,
  lng: number,
): Promise<OpenWeatherAirQuality> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('OPENWEATHER_API_KEY가 설정되지 않았습니다');

  const url = `${BASE}?lat=${lat}&lon=${lng}&appid=${key}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`OpenWeatherMap API 오류: ${res.status}`);

  const json = await res.json();
  const item = json?.list?.[0];
  if (!item) throw new Error('OpenWeatherMap 데이터 없음');

  const date = new Date(item.dt * 1000);
  const dataTime = date
    .toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\. /g, '-')
    .replace('.', '');

  return {
    pm25: item.components.pm2_5,
    dataTime,
  };
}
