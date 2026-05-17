# WBS — Fresh Air (미세먼지 환기 알림 PWA)

> **개발 방법론**: TDD — 테스트 먼저 작성 후 구현. 각 Phase의 테스트 통과 시 완료 처리.

## Phase 1: 프로젝트 초기 설정 ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 1.1 | Next.js 프로젝트 생성 | 프로젝트 골격 | ✅ |
| 1.2 | 의존성 설치 (web-push, @upstash/redis) | package.json | ✅ |
| 1.3 | CLAUDE.md 작성 | CLAUDE.md | ✅ |
| 1.4 | PRD.md 작성 | PRD.md | ✅ |
| 1.5 | .env.local.example 작성 | .env.local.example | ✅ |

---

## Phase 1.5: 테스트 인프라 설정 ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| T.1 | Jest + Testing Library 설치 | package.json devDependencies | ✅ |
| T.2 | jest.config.ts 설정 | jest.config.ts | ✅ |
| T.3 | jest.setup.ts 설정 | jest.setup.ts | ✅ |
| T.4 | test 스크립트 추가 | package.json scripts | ✅ |
| T.5 | CLAUDE.md TDD 가이드 추가 | CLAUDE.md | ✅ |

---

## Phase 2: 에어코리아 API 연동 ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 2.1 | 에어코리아 API 클라이언트 구현 | `lib/airkorea.ts` | ✅ |
| 2.2 | 좌표 → 최근접 측정소 선택 로직 | `lib/geo.ts` | ✅ |
| 2.3 | 공기질 API 프록시 엔드포인트 | `app/api/air-quality/route.ts` | ✅ |

> ⚠️ Phase 2는 TDD 도입 전 작성됨. Phase 4부터 TDD 적용.

---

## Phase 3: Upstash Redis + Web Push 설정 ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 3.1 | Upstash Redis 클라이언트 초기화 | `lib/redis.ts` | ✅ |
| 3.2 | VAPID 키 생성 가이드 문서화 | CLAUDE.md 업데이트 | ✅ |
| 3.3 | web-push 초기화 및 sendNotification 래퍼 | `lib/webpush.ts` | ✅ |
| 3.4 | 구독 등록/해제 API | `app/api/subscribe/route.ts` | ✅ |

> ⚠️ Phase 3는 TDD 도입 전 작성됨. Phase 4부터 TDD 적용.

---

## Phase 4: 크론 엔드포인트 (TDD 적용) ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 4.1 | 크론 로직 테스트 작성 (Red) | `__tests__/api/cron.test.ts` | ✅ |
| 4.2 | 크론 핵심 알림 로직 구현 (Green) | `app/api/cron/check/route.ts` | ✅ |
| 4.3 | 리팩토링 + 테스트 통과 확인 | — | ✅ |
| 4.4 | cron-job.org 설정 가이드 문서화 | CLAUDE.md 업데이트 | ✅ |

---

## Phase 5: PWA 프론트엔드 (TDD 적용) ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 5.1 | PWA manifest 작성 | `app/manifest.ts` | ✅ |
| 5.2 | Service Worker 작성 | `public/sw.js` | ✅ |
| 5.3 | AirQualityCard 테스트 → 구현 | `components/AirQualityCard.tsx` | ✅ |
| 5.4 | NotificationToggle 테스트 → 구현 | `components/NotificationToggle.tsx` | ✅ |
| 5.5 | LocationDisplay 테스트 → 구현 | `components/LocationDisplay.tsx` | ✅ |
| 5.6 | 메인 페이지 조합 | `app/page.tsx` | ✅ |
| 5.7 | 레이아웃 (manifest 링크, SW 등록) | `app/layout.tsx` | ✅ |

---

## Phase 7: PWA 강화 (TDD 적용) ✅

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 7.1 | 아이콘 에셋 생성 및 manifest 업데이트 | `public/icons/`, `app/manifest.ts` | ✅ |
| 7.2 | useInstallPrompt 훅 구현 | `lib/hooks/useInstallPrompt.ts` | ✅ |
| 7.3 | InstallPrompt 컴포넌트 구현 | `components/InstallPrompt.tsx` | ✅ |
| 7.4 | useNotification iOS 지원 강화 | `lib/hooks/useNotification.ts` | ✅ |
| 7.5 | Service Worker 캐싱 전략 개선 | `public/sw.js` | ✅ |
| 7.6 | page.tsx에 InstallPrompt 통합 | `app/page.tsx` | ✅ |

---

## Phase 6: 배포 + 검증

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 6.1 | Vercel 배포 설정 | `vercel.json` (필요 시) | ⬜ |
| 6.2 | Upstash Redis 연결 확인 | — | ⬜ |
| 6.3 | cron-job.org 등록 | — | ⬜ |
| 6.4 | 실디바이스 end-to-end 테스트 | — | ⬜ |

---

## 범례

| 아이콘 | 의미 |
|--------|------|
| ✅ | 완료 (테스트 통과) |
| 🔄 | 진행 중 |
| ⬜ | 대기 |
| ❌ | 블로킹 이슈 |
