---
title: Upstash Redis + Web Push 설정
date: 2026-05-03
phase: 3
status: 완료
tags:
  - TASK
  - Phase3
  - Redis
  - WebPush
  - VAPID
related_adr:
  - "[[ADR-20260503-Redis구독저장스키마]]"
  - "[[ADR-20260503-알림방식선택]]"
  - "[[ADR-20260503-기술스택선택]]"
---

# TASK-20260503 — Upstash Redis + Web Push 설정 (Phase 3)

## 연관 ADR
- [[ADR-20260503-Redis구독저장스키마]]
- [[ADR-20260503-알림방식선택]]
- [[ADR-20260503-기술스택선택]]

## 작업 목표
푸시 구독 정보를 Upstash Redis에 저장/삭제하는 API와 Web Push 발송 유틸을 구현한다.

## 완료된 작업

### 3.1 `lib/redis.ts`
- Upstash Redis 클라이언트 초기화
- Redis 키 상수 중앙화 (`KEYS.subscriptions`, `KEYS.lastPm25`)

### 3.2 CLAUDE.md 업데이트
- VAPID 키 생성 가이드 (`npx web-push generate-vapid-keys`)
- 에어코리아 API 키 발급 절차
- Upstash Redis 생성 가이드 (도쿄 리전 권장)
- CRON_SECRET 생성 명령어 (`openssl rand -hex 32`)

### 3.3 `lib/webpush.ts`
- VAPID 설정 초기화 (환경 변수 기반)
- `StoredSubscription` 타입 정의 (Redis 저장 형태)
- `sendPushNotification(subscription, payload)` 래퍼

### 3.4 `app/api/subscribe/route.ts`
- `POST /api/subscribe` — 구독 등록
  - endpoint, keys, stationName, regionName 유효성 검사
  - `HSET subscriptions {sha256(endpoint)[0:24]} {JSON}`
- `DELETE /api/subscribe` — 구독 해제
  - `HDEL subscriptions {key}`

## 생성/수정된 파일

| 파일 | 역할 |
|------|------|
| `lib/redis.ts` | Upstash Redis 클라이언트 + 키 상수 |
| `lib/webpush.ts` | VAPID 초기화, push 발송 래퍼, 타입 정의 |
| `app/api/subscribe/route.ts` | 구독 등록(POST) / 해제(DELETE) API |
| `CLAUDE.md` | 초기 설정 가이드 섹션 추가 |

## 검증 방법
환경 변수 설정 후:
```bash
# 구독 등록 테스트
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"subscription":{"endpoint":"https://test","keys":{"p256dh":"key","auth":"auth"}},"stationName":"강남구","regionName":"서울 강남구"}'

# Upstash 콘솔에서 subscriptions Hash 확인
```

## 다음 단계
Phase 4 — 크론 엔드포인트 (`app/api/cron/check/route.ts`)
