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

---

## 개발 방법론: TDD (테스트 주도 개발)

**모든 구현 작업은 TDD 방식으로 진행한다.**

### TDD 사이클
1. **Red** — 실패하는 테스트 먼저 작성 (`__tests__/` 디렉터리)
2. **Green** — 테스트를 통과하는 최소한의 구현 작성
3. **Refactor** — 중복 제거, 코드 정리 (테스트는 계속 통과해야 함)

### 테스트 명령어
```bash
npm test               # 전체 테스트 실행
npm run test:watch     # 파일 변경 감지 모드
npm run test:coverage  # 커버리지 리포트 포함
```

### Phase 완료 기준
- 해당 Phase의 모든 테스트가 통과해야 완료로 간주한다.

## 주의사항

- Service Worker는 **HTTPS 환경에서만** 동작합니다 (localhost 예외).
- Vercel Hobby 플랜 크론은 하루 1회로 제한되므로, 30분 간격 폴링은 cron-job.org를 사용합니다.
- 에어코리아 API serviceKey는 이미 URL 인코딩된 형태 — 재인코딩 금지.
