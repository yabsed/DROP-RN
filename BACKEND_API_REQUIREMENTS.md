# Backend API 요구사항 (MVP 기준)

작성일: 2026-02-21  
기준 코드: `src/types/map.ts`, `src/store/useMapStore.ts`, `src/components/modals/ViewPostModal.tsx`, `src/components/modals/MyActivitiesModal.tsx`, `dummyData.ts`

## 1) 문서 목적
- 현재 RN 앱에서 더미 데이터로 처리 중인 기능을 서버 API로 이관하기 위한 협업 문서입니다.
- 우선순위는 `지도 보드 조회`, `미션 인증`, `방명록`, `내 활동 내역`입니다.

## 2) 현재 앱 기준 도메인 모델

### Board
- `id: string`
- `type: "board"`
- `coordinate: { latitude: number; longitude: number }`
- `emoji: string`
- `title: string`
- `description: string`
- `createdAt: number` (Unix ms)
- `missions: Mission[]`

### Mission
- `id: string`
- `type: "quiet_time_visit" | "stay_duration" | "repeat_visit_stamp"`
- `title: string`
- `description: string`
- `rewardCoins: number`
- `minDurationMinutes?: number` (stay 전용)
- `quietTimeStartHour?: number`, `quietTimeEndHour?: number` (quiet-time 전용)
- `stampGoalCount?: number` (repeat-stamp 전용)

### ParticipatedActivity
- `id: string`
- `boardId: string`
- `boardTitle: string`
- `missionId: string`
- `missionType: MissionType`
- `missionTitle: string`
- `rewardCoins: number`
- `status: "started" | "completed"`
- `startedAt: number`
- `completedAt?: number`
- `requiredMinutes?: number`
- `startCoordinate: Coordinate`
- `endCoordinate?: Coordinate`

### RepeatVisitProgress
- `boardId: string`
- `missionId: string`
- `currentStampCount: number`
- `completedRounds: number`
- `lastStampedAt?: number`

### GuestbookEntry
- `id: string`
- `boardId: string`
- `content: string` (1~20자)
- `createdAt: number`

## 3) 필수 API 목록 (현재 기능 대응)

## A. Board/Map

### `GET /v1/boards`
지도에 표시할 보드+미션 목록 조회

Query 예시:
- `lat`, `lng` (선택)
- `radiusMeters` (선택, 기본값 협의)
- `q` (검색어: 보드명/설명/미션 텍스트)
- `cursor`, `limit` (선택)

Response 예시:
```json
{
  "items": [
    {
      "id": "b1",
      "type": "board",
      "coordinate": { "latitude": 37.54639, "longitude": 127.06588 },
      "emoji": "☕",
      "title": "성수 브런치",
      "description": "점심 이후 방문 인증 미션",
      "createdAt": 1760000000000,
      "missions": [
        {
          "id": "b1-m1",
          "type": "quiet_time_visit",
          "title": "한산 시간대 방문 인증",
          "description": "오후 2~4시 방문 시 인증",
          "rewardCoins": 10,
          "quietTimeStartHour": 14,
          "quietTimeEndHour": 16
        }
      ]
    }
  ],
  "nextCursor": null
}
```

### `GET /v1/boards/{boardId}`
단일 보드 상세 조회 (필요 시 미션/방명록 카운트 포함)

## B. Guestbook

### `GET /v1/boards/{boardId}/guestbook`
방명록 목록 조회

Query 예시:
- `cursor`, `limit`

### `POST /v1/boards/{boardId}/guestbook`
방명록 작성

Request:
```json
{
  "content": "또 올게요!"
}
```

Validation:
- 공백 trim 후 1자 이상
- 20자 이하

Response:
- 생성된 `GuestbookEntry`

## C. Mission 인증

### 1) Quiet-time 방문 인증
`POST /v1/missions/{missionId}/quiet-time-claims`

Request:
```json
{
  "boardId": "b1",
  "coordinate": { "latitude": 37.54639, "longitude": 127.06588 },
  "clientTimestamp": 1760000000000
}
```

서버 검증:
- 보드 좌표 반경 30m 이내
- 현재 시각이 quiet-time 범위 내
- 해당 사용자의 해당 미션이 이미 완료되지 않았는지

Response:
- 완료된 `ParticipatedActivity` (`status=completed`)
- 지급 코인

### 2) Stay-duration 시작
`POST /v1/missions/{missionId}/stay-sessions`

Request:
```json
{
  "boardId": "b1",
  "coordinate": { "latitude": 37.54639, "longitude": 127.06588 },
  "clientTimestamp": 1760000000000
}
```

서버 검증:
- 반경 30m 이내
- 동일 미션 in-progress 없음
- 동일 미션 completed 없음

Response:
- 생성된 `ParticipatedActivity` (`status=started`, `requiredMinutes` 포함)

### 3) Stay-duration 종료
`POST /v1/activities/{activityId}/complete-stay`

Request:
```json
{
  "coordinate": { "latitude": 37.54639, "longitude": 127.06588 },
  "clientTimestamp": 1760001800000
}
```

서버 검증:
- 반경 30m 이내
- `elapsed >= requiredMinutes`

Response:
- 업데이트된 `ParticipatedActivity` (`status=completed`, `completedAt`, `endCoordinate`)
- 지급 코인

### 4) Repeat-visit 스탬프 적립
`POST /v1/missions/{missionId}/stamps`

Request:
```json
{
  "boardId": "b1",
  "coordinate": { "latitude": 37.54639, "longitude": 127.06588 },
  "clientTimestamp": 1760000000000
}
```

서버 검증:
- 반경 30m 이내
- 동일 미션 당 로컬데이 기준 1일 1회 적립

처리 규칙:
- `currentStampCount + 1`
- `stampGoalCount` 도달 시
- `completedRounds + 1`
- `currentStampCount` 0으로 리셋
- 미션 보상 코인 지급

Response:
```json
{
  "progress": {
    "boardId": "b1",
    "missionId": "b1-m3",
    "currentStampCount": 2,
    "completedRounds": 1,
    "lastStampedAt": 1760000000000
  },
  "activity": {
    "id": "b1-m3-stamp-1760000000000",
    "status": "completed",
    "rewardCoins": 0
  }
}
```

## D. 내 활동

### `GET /v1/me/activities`
내 참여 활동 목록 조회 (최신순)

Query 예시:
- `boardId` (선택)
- `status` (`started|completed`, 선택)
- `cursor`, `limit`

Response:
- `ParticipatedActivity[]`

### `GET /v1/me/repeat-progress`
반복 방문 스탬프 진행도 조회

Response:
- `RepeatVisitProgress[]` 또는 `missionId` keyed map

### (선택) `GET /v1/me/participated-boards`
MyActivitiesModal 전용 요약 API (보드별 activityCount/lastActivityAt/stampProgress)

## 4) 공통 서버 정책 제안
- 인증: `Authorization: Bearer <token>`
- 시간: 현재 프론트는 Unix ms(number) 사용 중, 서버도 동일 포맷 응답 권장
- 좌표 검증: Haversine 거리 계산 기준으로 30m 이내
- 타임존: 스탬프 1일 1회 기준 타임존(예: `Asia/Seoul`) 명시 필요
- 중복 방지: 미션 인증류 `Idempotency-Key` 헤더 권장

## 5) 에러 코드(제안)
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

## 6) 확장 API (폼 스키마 기반, 현재 화면 미연결)
기준: `src/components/form/postSchema.ts`

- `POST /v1/uploads/images` (multipart 업로드)
- `POST /v1/posts` (일반 포스트: `content`, `photoUrl`)
- `POST /v1/boards` (보드 생성: 좌표/설명/이미지/기타 메타)
- `GET /v1/boards/{boardId}/posts`
- `POST /v1/boards/{boardId}/posts` (보드 내 글 작성)

## 7) 백엔드 협의 체크리스트
- quiet-time 판정 시각을 서버 시각으로 고정할지
- 1일 1스탬프의 day-cut 기준(UTC vs KST)
- 코인 지급 내역을 별도 ledger로 분리할지
- 위치 스푸핑 방어 레벨(기본 검증 vs 고급 탐지)
- 보드/방명록/활동 조회의 페이지네이션 기본값
