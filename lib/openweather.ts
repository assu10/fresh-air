const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export interface OpenWeatherAirQuality {
  pm25: number;
  dataTime: string;
}

export async function getOpenWeatherAirQuality(
  lat: number,
  lng: number,
): Promise<OpenWeatherAirQuality> {
  const url = `${BASE}?latitude=${lat}&longitude=${lng}&current=pm2_5&timezone=Asia%2FSeoul`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo API 오류: ${res.status}`);

  const json = await res.json();
  const current = json?.current;
  if (!current) throw new Error('Open-Meteo 데이터 없음');

  const dataTime = (current.time as string).replace('T', ' ');

  return {
    pm25: current.pm2_5,
    dataTime,
  };
}
