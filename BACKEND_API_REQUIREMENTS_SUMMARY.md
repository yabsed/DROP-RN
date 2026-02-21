# Backend API 요구사항 요약 (MVP)

원본 문서: `BACKEND_API_REQUIREMENTS.md`

## 한눈에 보기
- 목표: 더미 기반 프론트 기능을 서버 API로 치환
- 우선순위: `보드 조회` -> `미션 인증` -> `방명록` -> `내 활동`
- 공통 정책: JWT 인증, Unix ms 시간 포맷, 좌표 반경 30m 검증, 멱등키 권장

## 필수 API (요약)
1. `GET /v1/boards` 지도 보드+미션 목록
2. `GET /v1/boards/{boardId}` 보드 상세
3. `GET /v1/boards/{boardId}/guestbook` 방명록 목록
4. `POST /v1/boards/{boardId}/guestbook` 방명록 작성
5. `POST /v1/missions/{missionId}/quiet-time-claims` 한산 시간 방문 인증
6. `POST /v1/missions/{missionId}/stay-sessions` 체류 미션 시작
7. `POST /v1/activities/{activityId}/complete-stay` 체류 미션 종료/검증
8. `POST /v1/missions/{missionId}/stamps` 반복 방문 스탬프 적립
9. `GET /v1/me/activities` 내 활동 목록
10. `GET /v1/me/repeat-progress` 내 스탬프 진행도
11. `(선택) GET /v1/me/participated-boards` 보드별 요약

<details>
<summary><strong>미션 인증 핵심 규칙 (펼치기)</strong></summary>

- 공통: 사용자 좌표가 보드 기준 `30m 이내`여야 함
- `quiet_time_visit`: 지정 시간 범위 내에서만 성공
- `stay_duration`: 시작/종료 분리, 최소 체류 시간 충족 시 완료
- `repeat_visit_stamp`: 미션별 `1일 1회` 적립, 목표 달성 시 라운드+코인 지급
- 중복 처리: 이미 완료된 미션/이미 진행중인 세션 차단

</details>

<details>
<summary><strong>요청/응답에서 꼭 맞춰야 할 필드 (펼치기)</strong></summary>

- 공통 요청: `boardId`, `coordinate { latitude, longitude }`, `clientTimestamp`
- 활동 응답: `ParticipatedActivity` 형태 유지
- 스탬프 응답: `progress` + `activity` 동시 반환 권장
- 시간 타입: `number (Unix ms)`로 통일

</details>

<details>
<summary><strong>에러 코드 최소 세트 (펼치기)</strong></summary>

- `400 LOCATION_REQUIRED`
- `400 OUT_OF_RANGE`
- `400 GUESTBOOK_CONTENT_EMPTY`
- `400 GUESTBOOK_CONTENT_TOO_LONG`
- `409 QUIET_TIME_CLOSED`
- `409 MISSION_ALREADY_COMPLETED`
- `409 STAY_ALREADY_STARTED`
- `409 STAY_DURATION_NOT_ENOUGH`
- `409 STAMP_ALREADY_TODAY`
- `401 UNAUTHORIZED`
- `404 NOT_FOUND`

</details>

<details>
<summary><strong>확장 API (현재 화면 미연결, 펼치기)</strong></summary>

- `POST /v1/uploads/images`
- `POST /v1/posts`
- `POST /v1/boards`
- `GET /v1/boards/{boardId}/posts`
- `POST /v1/boards/{boardId}/posts`

</details>

## 백엔드와 바로 합의할 5가지
1. quiet-time 판정 시각을 서버 시각으로 고정할지
2. 1일 1스탬프의 day-cut 타임존(UTC/KST)
3. 코인 지급 내역 ledger 분리 여부
4. 위치 스푸핑 방어 수준
5. 페이지네이션 기본값(`limit`, `cursor`)
