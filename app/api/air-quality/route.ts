import { NextRequest, NextResponse } from 'next/server';
import { getNearbyStations, getRealtimeAirQuality } from '@/lib/airkorea';
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

  try {
    const { tmX, tmY } = wgs84ToTm(lat, lng);
    const stations = await getNearbyStations(tmX, tmY);

    if (stations.length === 0) {
      return NextResponse.json({ error: '근처 측정소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const nearest = stations[0];
    const airQuality = await getRealtimeAirQuality(nearest.stationName);

    const gradeInfo =
      airQuality.pm25Value != null ? getGradeInfo(airQuality.pm25Value) : null;

    return NextResponse.json({
      stationName: nearest.stationName,
      addr: nearest.addr,
      distanceKm: nearest.tm,
      pm25: airQuality.pm25Value,
      grade: gradeInfo?.grade ?? '알 수 없음',
      color: gradeInfo?.color ?? '#9CA3AF',
      canVentilate: gradeInfo?.canVentilate ?? false,
      dataTime: airQuality.dataTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
