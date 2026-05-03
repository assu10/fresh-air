# 🌬️ Fresh Air

현재 위치의 PM2.5 미세먼지 수치를 모니터링하다가 환기하기 좋은 수준(≤ 35 μg/m³)으로 개선되는 순간 Web Push 알림을 발송하는 PWA 앱입니다.

## 기능

- 실시간 PM2.5 미세먼지 수치 조회 (에어코리아 API)
- 수치 개선 시 Web Push 알림 발송 (이전값 > 35 → 현재값 ≤ 35 전환 시)
- 30분 간격 자동 폴링 (cron-job.org)
- PWA 지원 (홈 화면 추가, 오프라인 대응)

## PM2.5 등급 기준 (한국 환경부)

| 등급 | 범위 | 색상 |
|------|------|------|
| 좋음 | 0–15 μg/m³ | 파란색 |
| 보통 | 16–35 μg/m³ | 초록색 |
| 나쁨 | 36–75 μg/m³ | 주황색 |
| 매우나쁨 | 76+ μg/m³ | 빨간색 |

## 기술 스택

- **프레임워크**: Next.js (App Router, TypeScript, Tailwind CSS)
- **PWA**: 수동 Service Worker (`public/sw.js`)
- **백엔드**: Vercel Serverless API Routes
- **스케줄링**: cron-job.org → `POST /api/cron/check`
- **저장소**: Upstash Redis
- **공기질 데이터**: 에어코리아 API (한국환경공단, 공공데이터포털)
- **배포**: Vercel (Hobby 플랜)

## 개발 환경 설정

### 사전 요구사항

- Node.js 18 이상
- Upstash Redis 계정
- 에어코리아 API 키 ([공공데이터포털](https://www.data.go.kr) 발급)
- VAPID 키 쌍 (Web Push용)

### 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정합니다.

```env
AIRKOREA_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

### 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 테스트

```bash
npm test                 # 전체 테스트 실행
npm run test:watch       # 파일 변경 감지 모드
npm run test:coverage    # 커버리지 리포트 포함
```

## 알림 로직

```
POST /api/cron/check
1. Redis subscriptions Hash 로드
2. stationCode별 그룹핑 (API 중복 호출 방지)
3. 에어코리아 API → 현재 PM2.5 조회
4. last_pm25:{stationCode} 와 비교
   - 이전 > 35 AND 현재 ≤ 35 → web-push 발송
5. last_pm25 업데이트
```

## 배포

Vercel에 배포합니다. Hobby 플랜의 크론 제한으로 인해 30분 폴링은 [cron-job.org](https://cron-job.org)를 통해 `POST /api/cron/check`를 호출합니다.

> **주의**: Service Worker는 HTTPS 환경에서만 동작합니다 (localhost 예외).

## 라이선스

MIT
