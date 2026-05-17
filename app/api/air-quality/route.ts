import { NextRequest, NextResponse } from 'next/server';
import { getNearbyStations, getRealtimeAirQuality } from '@/lib/airkorea';
import { getOpenWeatherAirQuality } from '@/lib/openweather';
import { wgs84ToTm, getGradeInfo } from '@/lib/geo';

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get('lat') ?? '');
  const lng = parseFloat(request.nextUrl.searchParams.get('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat, lng 파라미터가 필요합니다.' }, { status: 400 });
  }

  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    return NextResponse.json({ error: '한국 영역 좌표만 지원합니다.' }, { status: 400 });
  }

  // 1차: 에어코리아
  try {
    const { tmX, tmY } = wgs84ToTm(lat, lng);
    const stations = await getNearbyStations(tmX, tmY);

    if (stations.length === 0) {
      throw new Error('근처 측정소를 찾을 수 없습니다.');
    }

    const nearest = stations[0];
    const airQuality = await getRealtimeAirQuality(nearest.stationName);
    const gradeInfo = airQuality.pm25Value != null ? getGradeInfo(airQuality.pm25Value) : null;

    return NextResponse.json({
      stationName: nearest.stationName,
      addr: nearest.addr,
      pm25: airQuality.pm25Value,
      grade: gradeInfo?.grade ?? '알 수 없음',
      color: gradeInfo?.color ?? '#9CA3AF',
      canVentilate: gradeInfo?.canVentilate ?? false,
      dataTime: airQuality.dataTime,
      source: 'airkorea',
    });
  } catch {
    // 에어코리아 실패 → OpenWeatherMap 폴백
  }

  // 2차: OpenWeatherMap
  try {
    const ow = await getOpenWeatherAirQuality(lat, lng);
    const gradeInfo = getGradeInfo(Math.round(ow.pm25));

    return NextResponse.json({
      stationName: '현재 위치',
      addr: null,
      pm25: Math.round(ow.pm25),
      grade: gradeInfo.grade,
      color: gradeInfo.color,
      canVentilate: gradeInfo.canVentilate,
      dataTime: ow.dataTime,
      source: 'openweather',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
