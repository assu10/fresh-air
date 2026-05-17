---
title: "ADR-20260517: 에어코리아 폴백 데이터 소스로 Open-Meteo 선택"
date: 2026-05-17
status: 결정됨
tags:
  - ADR
  - air-quality
  - fallback
  - open-meteo
---

# ADR-20260517 — 에어코리아 폴백 데이터 소스로 Open-Meteo 선택

## 연관 문서
- [[docs/work/TASK-20260517-데이터폴백및오류개선/TASK-20260517-데이터폴백및오류개선]]
- [[docs/ADR/ADR-20260503-에어코리아API연동]]

## 컨텍스트

에어코리아 API는 공공데이터포털 서비스 키 등록이 필요하며, 키가 없거나 미등록 상태이면 HTTP 200에 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`를 반환한다. 로컬 개발 환경에서 `.env.local`에 유효한 키가 없어 API가 지속적으로 실패했다. 프로덕션 환경에서도 키 만료·서비스 장애 등으로 실패할 수 있어 폴백 데이터 소스가 필요했다.

## 검토한 옵션

### 옵션 A: OpenWeatherMap Air Pollution API
- API 키 필요 (무료 플랜 가능)
- 신규 키 발급 후 최대 2시간 활성화 대기 필요
- 로컬 즉시 테스트 불가 → **탈락**

### 옵션 B: AQICN (World Air Quality Index)
- demo 토큰 제공
- demo 토큰은 상하이 데이터를 반환하는 등 좌표 무시 문제 있음 → **탈락**

### 옵션 C: Open-Meteo Air Quality API ✅
- **API 키 불필요**, 완전 무료
- 좌표 기반 요청, 전 세계 커버리지
- PM2.5(`pm2_5`) 포함
- 즉시 동작 확인: `curl` 테스트에서 정상 응답

## 결정

**Open-Meteo**를 에어코리아 폴백으로 사용한다.

함수명(`getOpenWeatherAirQuality`)과 인터페이스(`OpenWeatherAirQuality`)는 기존 코드와의 호환성을 위해 유지하되, 내부 구현을 Open-Meteo API로 교체했다.

## 트레이드오프

| 항목 | Open-Meteo |
|------|-----------|
| 비용 | 무료, API 키 불필요 |
| 데이터 종류 | 모델·위성 기반 (측정소 실측값 아님) |
| 정확도 | 에어코리아 실측값보다 낮을 수 있음 |
| 가용성 | 에어코리아와 독립적 |
| 범위 | 전 세계 (한국 외 확장 가능) |

폴백 목적이므로 정확도보다 가용성 우선. 에어코리아가 정상이면 항상 1순위로 사용한다.

## API 엔드포인트

```
GET https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude={lat}&longitude={lng}&current=pm2_5&timezone=Asia%2FSeoul
```

응답 예시:
```json
{
  "current": {
    "time": "2026-05-17T13:00",
    "interval": 3600,
    "pm2_5": 16.6
  }
}
```
