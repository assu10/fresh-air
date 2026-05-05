# Phase 5 PWA 프론트엔드 디자인

**날짜:** 2026-05-05
**상태:** 승인됨

---

## 목표

미세먼지 환기 알림 PWA의 프론트엔드를 구현한다. 사용자는 앱에 접속해 현재 위치의 PM2.5 수치를 확인하고, 환기 알림 구독을 관리할 수 있다.

---

## 결정된 디자인 방향

| 항목 | 결정 |
|------|------|
| 레이아웃 | 카드 기반, 정보 밀도 높음 (수치·등급·상태 한 카드에) |
| 위치 권한 UX | 온보딩 화면 → 명시적 버튼 클릭 → Geolocation 요청 |
| 다크 모드 | 라이트 + 다크 모두 지원 (시스템 설정 자동 감지) |
| 상태 관리 | 커스텀 훅으로 관심사 분리 |

---

## 파일 구조

### 신규 파일

| 파일 | 역할 |
|------|------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service Worker (push 수신, notificationclick) |
| `lib/hooks/useAirQuality.ts` | lat/lng → `/api/air-quality` fetch + 상태 관리 |
| `lib/hooks/useNotification.ts` | SW 등록, push 구독/해제 + 상태 관리 |
| `components/AirQualityCard.tsx` | 공기질 카드 (presentational) |
| `components/NotificationToggle.tsx` | 알림 토글 (presentational) |
| `components/LocationDisplay.tsx` | 위치 표시 (presentational) |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/page.tsx` | 훅 조합 + 온보딩/데이터 화면 분기 |
| `app/layout.tsx` | manifest 링크, SW 등록 스크립트, 메타데이터 업데이트 |

### 테스트 파일

| 파일 | 대상 |
|------|------|
| `__tests__/hooks/useAirQuality.test.ts` | fetch mock, 상태 전환 (idle→loading→success/error) |
| `__tests__/hooks/useNotification.test.ts` | SW/PushManager mock, 구독/해제 흐름 |
| `__tests__/components/AirQualityCard.test.tsx` | 렌더, 등급별 색상, skeleton, error 상태 |
| `__tests__/components/NotificationToggle.test.tsx` | 토글 클릭, disabled 상태, loading 상태 |
| `__tests__/components/LocationDisplay.test.tsx` | 텍스트 렌더, skeleton 상태 |

---

## 컴포넌트 인터페이스

### AirQualityCard

```typescript
interface AirQualityCardProps {
  pm25: number | null;
  grade: string;
  color: string;
  canVentilate: boolean;
  dataTime: string;
  loading: boolean;
  error: string | null;
}
```

- loading=true: 스켈레톤 UI
- error≠null: 에러 메시지 + 재시도 버튼
- 정상: 색상 원형(color) + grade + canVentilate 메시지

### NotificationToggle

```typescript
interface NotificationToggleProps {
  isSubscribed: boolean;
  isSupported: boolean;
  loading: boolean;
  onToggle: () => void;
}
```

- isSupported=false: 비활성화 (HTTPS 필요 메시지)
- loading=true: 토글 비활성화

### LocationDisplay

```typescript
interface LocationDisplayProps {
  stationName: string | null;
  addr: string | null;
  loading: boolean;
}
```

- loading=true: 스켈레톤
- 정상: 📍 addr (stationName)

---

## 커스텀 훅 인터페이스

### useAirQuality

```typescript
function useAirQuality(coords: { lat: number; lng: number } | null): {
  data: {
    pm25: number | null;
    grade: string;
    color: string;
    canVentilate: boolean;
    stationName: string;
    addr: string;
    dataTime: string;
  } | null;
  loading: boolean;
  error: string | null;
}
```

- coords=null이면 fetch 하지 않음
- coords 변경 시 자동 재조회

### useNotification

```typescript
function useNotification(
  stationName: string | null,
  addr: string | null  // /api/air-quality 응답의 addr → subscribe API의 regionName으로 전달
): {
  isSubscribed: boolean;
  isSupported: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
}
```

- 마운트 시 SW 등록 + 기존 구독 여부 확인
- toggle(): 구독 → POST /api/subscribe, 해제 → DELETE /api/subscribe

---

## 화면 상태 분기

```
coords = null
  → 온보딩 화면: 🌿 Fresh Air + 설명 + "내 위치 확인하기" 버튼

coords ≠ null, loading = true
  → LocationDisplay(skeleton) + AirQualityCard(skeleton) + NotificationToggle(disabled)

coords ≠ null, error ≠ null
  → AirQualityCard(error) — 에러 메시지 + 재시도 버튼

coords ≠ null, data ≠ null
  → LocationDisplay + AirQualityCard + NotificationToggle
```

---

## Service Worker (public/sw.js)

```javascript
// push 이벤트: 알림 표시
self.addEventListener('push', (event) => { ... })

// notificationclick: 앱 포커스
self.addEventListener('notificationclick', (event) => { ... })
```

- fetch 캐싱 없음 (MVP 범위 밖)

---

## manifest.json 핵심 필드

```json
{
  "name": "Fresh Air",
  "short_name": "Fresh Air",
  "display": "standalone",
  "theme_color": "#22C55E",
  "background_color": "#ffffff",
  "start_url": "/"
}
```

- 아이콘: 기존 `favicon.ico` 재사용 (별도 생성 없음)

---

## TDD 규칙

- 모든 구현은 테스트 먼저 작성 (Red → Green → Refactor)
- 컴포넌트 테스트: `@testing-library/react`
- 훅 테스트: `@testing-library/react` (`renderHook`)
- fetch/navigator/serviceWorker는 jest.mock으로 격리

---

## 범위 밖 (MVP 제외)

- Service Worker fetch 캐싱
- 오프라인 지원
- 아이콘 파일 별도 생성
- 알림 권한 거부 후 재요청 가이드
