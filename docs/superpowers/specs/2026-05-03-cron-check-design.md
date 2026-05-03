# Phase 4 설계 — 크론 엔드포인트 `/api/cron/check`

## 개요

cron-job.org가 30분 간격으로 호출하는 `POST /api/cron/check` 엔드포인트를 구현한다.  
Redis에 저장된 구독자 목록을 기반으로 에어코리아 PM2.5 데이터를 조회하고, 임계값(35 μg/m³) 이하로 전환된 경우 Web Push 알림을 발송한다.

## 파일 구성

| 파일 | 역할 |
|------|------|
| `app/api/cron/check/route.ts` | 크론 핸들러 본체 (신규) |
| `__tests__/api/cron/check.test.ts` | 단위 테스트 (신규) |
| `lib/redis.ts` | 기존 그대로 활용 |
| `lib/webpush.ts` | 기존 그대로 활용 |
| `lib/airkorea.ts` | 기존 그대로 활용 |

## 데이터 플로우

```
POST /api/cron/check
│
├─ 1. Authorization: Bearer {CRON_SECRET} 검증 → 실패 시 401
│
├─ 2. Redis HGETALL subscriptions → StoredSubscription[] 파싱
│
├─ 3. stationName 기준 Map으로 그룹핑
│      { "강남구": [sub1, sub2], "마포구": [sub3] }
│
├─ 4. 각 stationName별 getRealtimeAirQuality() 병렬 호출 (Promise.allSettled)
│
├─ 5. fulfilled된 측정소만 처리:
│      a. Redis GET last_pm25:{stationName}
│      b. prev > 35 AND current <= 35 → 해당 구독자 전원에게 push
│         ├─ 410 Gone → Redis HDEL 해당 구독 키
│         └─ 기타 실패 → 로그만
│      c. Redis SET last_pm25:{stationName} = current
│
└─ 6. JSON 응답: { processed, notified, deleted, skipped }
```

## 인증

`Authorization: Bearer {CRON_SECRET}` 헤더를 검사한다.  
`CRON_SECRET` 환경 변수가 없거나 불일치하면 즉시 401을 반환한다.

## 에러 처리

| 케이스 | 동작 |
|--------|------|
| CRON_SECRET 불일치 | 401 반환, 즉시 종료 |
| Redis HGETALL 실패 | 500 반환 (전체 작업 불가) |
| 에어코리아 API 실패 | 해당 스테이션 `skipped++`, 나머지 계속 |
| Push 410 Gone | 구독 Redis HDEL + `deleted++` |
| Push 기타 실패 | 로그만 |
| `last_pm25` 없음 (첫 실행) | 이전값 없음 → 전환 없음으로 처리, 현재값만 저장 |

## 알림 발송 조건

```
이전값 > 35 AND 현재값 <= 35
```

- 이전값이 없으면(첫 실행) 발송하지 않는다.
- 현재값이 null이면(측정 불가) 발송하지 않고 last_pm25를 갱신하지 않는다.

## 응답 형식

```json
{
  "processed": 2,
  "notified": 3,
  "deleted": 1,
  "skipped": 0
}
```

- `processed`: API 조회 성공한 측정소 수
- `notified`: push 발송 성공한 구독자 수
- `deleted`: 410 Gone으로 자동 삭제한 구독 수
- `skipped`: API 실패로 건너뛴 측정소 수

## TDD 테스트 시나리오

1. 인증 실패(헤더 없음) → 401
2. 인증 실패(잘못된 토큰) → 401
3. 구독 없음 → `{ processed: 0, notified: 0, deleted: 0, skipped: 0 }`
4. prev > 35, current ≤ 35 → push 발송, `notified: 1`
5. prev ≤ 35, current ≤ 35 → push 미발송
6. prev > 35, current > 35 → push 미발송
7. `last_pm25` 없음(첫 실행) → push 미발송, 값만 저장
8. Push 410 Gone → 구독 자동 삭제, `deleted: 1`
9. 에어코리아 API 실패 → `skipped: 1`, 다른 스테이션 정상 처리
10. pm25Value null → last_pm25 갱신 안 함
