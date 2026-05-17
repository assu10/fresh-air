# 🌬️ Fresh Air

현재 위치의 PM2.5 미세먼지 수치를 모니터링하다가 환기하기 좋은 수준(≤ 35 μg/m³)으로 개선되는 순간 Web Push 알림을 발송하는 PWA 앱입니다.

**배포 주소**: https://fresh-air-iota.vercel.app

## 기능

- 현재 위치 기반 PM2.5 미세먼지 수치 실시간 조회
- 동(洞) 단위 위치 표시 (Nominatim 역지오코딩)
- 수치 개선 시 Web Push 알림 발송 (이전값 > 35 → 현재값 ≤ 35 전환 시)
- 30분 간격 자동 폴링 (cron-job.org)
- PWA 지원 (홈 화면 추가, 오프라인 대응)
- 에어코리아 API 실패 시 Open-Meteo 자동 폴백

## PM2.5 등급 기준 (한국 환경부)

| 등급 | 범위 | 색상 |
|------|------|------|
| 좋음 | 0–15 μg/m³ | 파란색 |
| 보통 | 16–35 μg/m³ | 초록색 |
| 나쁨 | 36–75 μg/m³ | 주황색 |
| 매우나쁨 | 76+ μg/m³ | 빨간색 |

---

## 기술 스택 및 사용 서비스

### 프레임워크 / 언어

| 기술 | 용도 |
|------|------|
| [Next.js](https://nextjs.org) (App Router) | 풀스택 프레임워크. 프론트엔드 UI + API Routes(서버리스 함수) |
| TypeScript | 타입 안전성 |
| Tailwind CSS | UI 스타일링 |
| Service Worker (`public/sw.js`) | PWA 푸시 알림 수신, 홈 화면 추가 지원 |

### 배포

| 서비스 | 주소 | 용도 |
|--------|------|------|
| [Vercel](https://vercel.com) | https://vercel.com/assu10s-projects/fresh-air | Next.js 앱 배포 및 호스팅. HTTPS 자동 제공 |

### 스케줄링

| 서비스 | 주소 | 용도 |
|--------|------|------|
| [cron-job.org](https://cron-job.org) | https://cron-job.org/en/jobs | 30분마다 `POST /api/cron/check` 호출. Vercel Hobby 플랜의 크론 제한(하루 1회)을 우회 |

### 데이터베이스

| 서비스 | 주소 | 용도 |
|--------|------|------|
| [Upstash Redis](https://upstash.com) | https://console.upstash.com | 푸시 구독 정보 저장 및 이전 PM2.5 값 캐싱. 서버리스 환경에 최적화된 Redis |

### 공기질 데이터

| 서비스 | 주소 | 용도 |
|--------|------|------|
| [에어코리아 API](https://www.airkorea.or.kr) | https://www.data.go.kr (공공데이터포털에서 키 발급) | 한국환경공단 공식 측정소 실측 PM2.5 데이터. 1순위 |
| [Open-Meteo](https://open-meteo.com) | https://air-quality-api.open-meteo.com | 에어코리아 실패 시 폴백. 위성·모델 기반 PM2.5. 무료, API 키 불필요 |

### 위치

| 서비스 | 주소 | 용도 |
|--------|------|------|
| [Nominatim](https://nominatim.openstreetmap.org) | https://nominatim.openstreetmap.org | GPS 좌표 → 동(洞) 단위 주소 변환 (역지오코딩). OpenStreetMap 기반, 무료 |

### 알림

| 기술 | 용도 |
|------|------|
| Web Push API + VAPID | 브라우저 푸시 알림. VAPID 키로 서버 인증 |
| [web-push](https://github.com/web-push-libs/web-push) (npm) | 서버에서 푸시 알림 발송 |

---

## 개발 환경 설정

### 사전 요구사항

- Node.js 18 이상
- Upstash Redis 계정 ([console.upstash.com](https://console.upstash.com))
- 에어코리아 API 키 ([공공데이터포털](https://www.data.go.kr) 발급, 선택사항 — 없으면 Open-Meteo 폴백)
- VAPID 키 쌍 (`npx web-push generate-vapid-keys`로 생성)

### 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
# 에어코리아 API (선택사항 — 없으면 Open-Meteo 폴백 사용)
AIRKOREA_API_KEY=

# VAPID 키 (Web Push 인증)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # 브라우저에서 참조하는 공개키
VAPID_SUBJECT=mailto:your@email.com

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# 크론 엔드포인트 보안 시크릿 (cron-job.org Authorization 헤더에 사용)
CRON_SECRET=
```

VAPID 키 생성:
```bash
npx web-push generate-vapid-keys
```

CRON_SECRET 생성:
```bash
openssl rand -hex 32
```

### 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 테스트

### 자동 테스트

```bash
npm test                 # 전체 테스트 실행
npm run test:watch       # 파일 변경 감지 모드
npm run test:coverage    # 커버리지 리포트 포함
```

### 수동 테스트 (배포 후)

**Android Chrome**

1. 배포 URL 접속 → 하단 "앱으로 설치하기" 배너 확인
2. "앱으로 설치" 클릭 → Chrome 설치 프롬프트 확인
3. 설치 완료 후 배너 사라짐 확인
4. 홈 화면 아이콘으로 실행 → standalone 모드 확인

**iOS Safari 16.4+**

1. 배포 URL 접속 → 하단 배너 확인
2. "홈 화면에 추가" 클릭 → 3단계 안내 모달 확인
3. 실제 홈 화면 추가 후 배너 사라짐 확인
4. 홈 아이콘 실행 → 알림 켜기 가능 확인

**오프라인**

1. 앱 설치 후 비행기 모드 전환
2. 앱 열기 → 캐시된 화면 표시 확인

## 알림 로직

```
POST /api/cron/check  (cron-job.org가 30분마다 호출)
1. Redis subscriptions Hash 로드
2. stationCode별 그룹핑 (API 중복 호출 방지)
3. 에어코리아 API → 현재 PM2.5 조회 (실패 시 Open-Meteo 폴백)
4. last_pm25:{stationCode} 와 비교
   - 이전 > 35 AND 현재 ≤ 35 → web-push 발송
5. last_pm25 업데이트
```

## 배포

Vercel에 배포합니다. `main` 브랜치에 push하면 자동 배포됩니다.

> **주의**: Service Worker는 HTTPS 환경에서만 동작합니다 (localhost 예외).

## 라이선스

MIT
