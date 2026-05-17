const STATION_API = 'http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc';
const AIR_API = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

export interface NearbyStation {
  stationName: string;
  addr: string;
  tm: number;
}

export interface AirQualityData {
  pm25Value: number | null;
  pm25Grade: number | null;
  dataTime: string;
  stationName: string;
}

function apiUrl(base: string, path: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  // serviceKey는 공공데이터포털에서 이미 인코딩된 형태로 제공되므로 별도 인코딩 없이 직접 추가
  const serviceKey = process.env.AIRKOREA_API_KEY ?? '';
  return `${base}/${path}?${query}&serviceKey=${serviceKey}`;
}

export async function getNearbyStations(tmX: number, tmY: number): Promise<NearbyStation[]> {
  const url = apiUrl(STATION_API, 'getNearbyMsrstnList', {
    tmX: tmX.toFixed(2),
    tmY: tmY.toFixed(2),
    ver: '1.1',
    pageNo: '1',
    numOfRows: '3',
    returnType: 'json',
  });

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`측정소 조회 실패: ${res.status}`);

  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '00') {
    throw new Error(header?.resultMsg ?? '에어코리아 API 오류');
  }
  const items: Array<{ stationName: string; addr: string; tm: string }> =
    json?.response?.body?.items ?? [];

  return items.map((item) => ({
    stationName: item.stationName,
    addr: item.addr,
    tm: parseFloat(item.tm),
  }));
}

export async function getRealtimeAirQuality(stationName: string): Promise<AirQualityData> {
  const url = apiUrl(AIR_API, 'getMsrstnAcctoRltmMesureDnsty', {
    stationName,
    dataTerm: 'DAILY',
    pageNo: '1',
    numOfRows: '1',
    returnType: 'json',
    ver: '1.0',
  });

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`대기질 조회 실패: ${res.status}`);

  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '00') {
    throw new Error(header?.resultMsg ?? '에어코리아 API 오류');
  }
  const item = json?.response?.body?.items?.[0];

  if (!item) throw new Error(`측정소 데이터 없음: ${stationName}`);

  const raw = item.pm25Value;
  const pm25Value = raw === '-' || raw == null ? null : parseInt(raw, 10);
  const rawGrade = item.pm25Grade;
  const pm25Grade = rawGrade === '-' || rawGrade == null ? null : parseInt(rawGrade, 10);

  return {
    pm25Value,
    pm25Grade,
    dataTime: item.dataTime ?? '',
    stationName,
  };
}
