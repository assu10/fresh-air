const DEG_TO_RAD = Math.PI / 180;

// WGS84 → Korean TM Central Belt (EPSG:5181)
// AirKorea API의 getNearbyMsrstnList는 TM 좌표계를 요구한다.
export function wgs84ToTm(lat: number, lng: number): { tmX: number; tmY: number } {
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const b = a * (1 - f);
  const e2 = 1 - (b * b) / (a * a);
  const ep2 = e2 / (1 - e2);

  const phi0 = 38 * DEG_TO_RAD;
  const lam0 = 127 * DEG_TO_RAD;
  const k0 = 1.0;
  const FE = 200000.0;
  const FN = 600000.0;

  const phi = lat * DEG_TO_RAD;
  const lam = lng * DEG_TO_RAD;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = ep2 * cosPhi * cosPhi;
  const A = cosPhi * (lam - lam0);

  const meridionalArc = (phi: number) =>
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * phi));

  const M = meridionalArc(phi);
  const M0 = meridionalArc(phi0);

  const x =
    k0 *
    N *
    (A +
      ((1 - T + C) * A * A * A) / 6 +
      ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A * A * A * A * A) / 120);

  const y =
    k0 *
    (M -
      M0 +
      N *
        tanPhi *
        (A * A / 2 +
          ((5 - T + 9 * C + 4 * C * C) * A * A * A * A) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A * A * A * A * A * A) / 720));

  return { tmX: x + FE, tmY: y + FN };
}

export type Grade = '좋음' | '보통' | '나쁨' | '매우나쁨' | '알 수 없음';

export interface GradeInfo {
  grade: Grade;
  color: string;
  canVentilate: boolean;
}

export function getGradeInfo(pm25: number): GradeInfo {
  if (pm25 <= 15) return { grade: '좋음', color: '#3B82F6', canVentilate: true };
  if (pm25 <= 35) return { grade: '보통', color: '#22C55E', canVentilate: true };
  if (pm25 <= 75) return { grade: '나쁨', color: '#F97316', canVentilate: false };
  return { grade: '매우나쁨', color: '#EF4444', canVentilate: false };
}
