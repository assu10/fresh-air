@AGENTS.md

# Fresh Air — 개발 가이드

## 프로젝트 개요

현재 위치의 PM2.5 미세먼지 수치를 모니터링하다가 환기해도 좋은 수준(≤35 μg/m³)으로 개선되는 순간 Web Push 알림을 발송하는 PWA 앱.

## 기술 스택

- **프레임워크**: Next.js (App Router, TypeScript, Tailwind CSS)
- **PWA**: 수동 Service Worker (`public/sw.js`)
- **백엔드**: Vercel Serverless API Routes
- **스케줄링**: cron-job.org → `POST /api/cron/check` (30분 간격)
- **저장소**: Upstash Redis
- **공기질 데이터**: 에어코리아 API (한국환경공단, 공공데이터포털)
- **배포**: Vercel (Hobby 플랜)

## 프로젝트 구조

```
app/
  page.tsx                  # 메인 UI
  layout.tsx                # PWA 메타, manifest 링크, SW 등록
  api/
    air-quality/route.ts    # 에어코리아 API 프록시
    subscribe/route.ts      # 푸시 구독 등록(POST)/해제(DELETE)
    cron/check/route.ts     # 크론 진입점 (CRON_SECRET 보호)
components/
  AirQualityCard.tsx        # PM2.5 수치 + 등급 표시
  NotificationToggle.tsx    # 구독/해제 토글
  LocationDisplay.tsx       # GPS 지역명 표시
lib/
  airkorea.ts               # 에어코리아 API 클라이언트
  redis.ts                  # Upstash Redis 클라이언트
  webpush.ts                # web-push 초기화 및 sendNotification 래퍼
  geo.ts                    # 좌표 → 가장 가까운 측정소 선택
public/
  sw.js                     # Service Worker (push 이벤트 처리)
  manifest.json             # PWA manifest
```

## 환경 변수 (.env.local)

```env
AIRKOREA_API_KEY=           # 공공데이터포털에서 발급
VAPID_PUBLIC_KEY=           # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your@email.com
UPSTASH_REDIS_REST_URL=     # Upstash 콘솔에서 복사
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=                # 임의의 긴 문자열 (cron-job.org 인증용)
```

`.env.local.example` 파일을 복사해 사용하세요.

## PM2.5 등급 기준 (한국 환경부)

| 등급 | 범위 | UI 색상 |
|------|------|---------|
| 좋음 | 0–15 μg/m³ | 파란색 |
| 보통 | 16–35 μg/m³ | 초록색 |
| 나쁨 | 36–75 μg/m³ | 주황색 |
| 매우나쁨 | 76+ μg/m³ | 빨간색 |

**알림 발송 기준**: PM2.5 ≤ 35 μg/m³ (이전값 > 35 → 현재값 ≤ 35 전환 시)

## 핵심 알림 로직

```
POST /api/cron/check
1. Redis subscriptions Hash 로드
2. stationCode별 그룹핑 (API 중복 호출 방지)
3. 에어코리아 API → 현재 PM2.5 조회
4. last_pm25:{stationCode} 와 비교
   - 이전 > 35 AND 현재 ≤ 35 → web-push 발송
5. last_pm25 업데이트
```

## 작업 진행 규칙

1. **Phase 단위 검수**: Phase를 하나씩 완료한 뒤 사용자 검수를 기다린다. 사용자의 명시적 지시 없이 다음 Phase를 자의적으로 진행하지 않는다.
2. **TDD**: 모든 구현은 테스트 먼저 작성 후 진행한다 (아래 TDD 섹션 참고).
3. **커밋**: 작업 완료마다 커밋한다 (아래 커밋 컨벤션 참고).
4. **문서화**: 작업마다 `docs/ADR/`, `docs/TASK/`에 YAML frontmatter + Obsidian 백링크 형식으로 문서를 생성한다.

---

## 커밋 컨벤션

모든 작업 완료 후 반드시 커밋한다. 형식: `<type>: <한글 설명>`

| type | 사용 시점 |
|------|-----------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 추가/수정 |
| `chore` | 설정, 빌드, 패키지 변경 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `test` | 테스트 코드 추가/수정 |
| `style` | 코드 포맷 등 스타일 변경 |

예시:
```
feat: 에어코리아 API 클라이언트 구현
docs: TDD 개발 방법론 가이드 추가
chore: Jest 테스트 인프라 설정
test: 공기질 등급 계산 단위 테스트 추가
```

---

## 개발 방법론: TDD (테스트 주도 개발)

**모든 구현 작업은 TDD 방식으로 진행한다.**

### TDD 사이클
1. **Red** — 실패하는 테스트 먼저 작성 (`__tests__/` 디렉터리)
2. **Green** — 테스트를 통과하는 최소한의 구현 작성
3. **Refactor** — 중복 제거, 코드 정리 (테스트는 계속 통과해야 함)

### 테스트 파일 위치 규칙
```
__tests__/
  lib/
    geo.test.ts
    airkorea.test.ts
    redis.test.ts
    webpush.test.ts
  api/
    air-quality.test.ts
    subscribe.test.ts
    cron.test.ts
  components/
    AirQualityCard.test.tsx
    NotificationToggle.test.tsx
    LocationDisplay.test.tsx
```

### 테스트 명령어
```bash
npm test               # 전체 테스트 실행
npm run test:watch     # 파일 변경 감지 모드
npm run test:coverage  # 커버리지 리포트 포함
```

### Phase 완료 기준
- 해당 Phase의 모든 테스트가 통과해야 완료로 간주한다.

## 개발 명령어

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
npm test          # 테스트 실행
```

## 초기 설정 가이드

### 1. VAPID 키 생성
```bash
npx web-push generate-vapid-keys
```
출력된 Public Key, Private Key를 `.env.local`의 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`에 입력.
`VAPID_SUBJECT`에는 `mailto:your@email.com` 형식으로 입력.

### 2. 에어코리아 API 키 발급
1. https://www.data.go.kr 접속
2. "한국환경공단_에어코리아_대기오염정보" 검색
3. 활용신청 → 일반 인증키 발급 (즉시 발급)
4. 발급된 인코딩 키를 `AIRKOREA_API_KEY`에 입력

### 3. Upstash Redis 생성
1. https://console.upstash.com 접속 → Redis → Create Database
2. Region: `ap-northeast-1` (서울과 가장 가까운 도쿄)
3. REST URL, REST Token을 각각 환경 변수에 입력

### 4. CRON_SECRET 생성
```bash
openssl rand -hex 32
```

## 주의사항

- Service Worker는 **HTTPS 환경에서만** 동작합니다 (localhost 예외).
- Vercel Hobby 플랜 크론은 하루 1회로 제한되므로, 30분 간격 폴링은 cron-job.org를 사용합니다.
- 에어코리아 API serviceKey는 이미 URL 인코딩된 형태 — 재인코딩 금지.
