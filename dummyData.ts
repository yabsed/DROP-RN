import { Board } from "./src/types/map";

const BASE_COORDINATE = {
  latitude: 37.5463937599992,
  longitude: 127.065889477465,
};

type BoardSeed = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  latitudeOffset: number;
  longitudeOffset: number;
  quietTimeLabel: string;
  stayMinutes: number;
  visitReward: number;
  stayReward: number;
  stampGoalCount?: number;
  stampReward?: number;
};

const parseKoreanTimeTokenToHour = (token: string): number => {
  const meridiem = token.includes("오후") ? "pm" : "am";
  const hourMatch = token.match(/(\d+)\s*시/);
  const minuteMatch = token.match(/(\d+)\s*분/);
  const hour12 = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (meridiem === "am") {
    const normalizedHour = hour12 === 12 ? 0 : hour12;
    return normalizedHour + minutes / 60;
  }

  const normalizedHour = hour12 === 12 ? 12 : hour12 + 12;
  return normalizedHour + minutes / 60;
};

const parseQuietTimeRange = (label: string): { startHour: number; endHour: number } => {
  const normalized = label.replace(/\s+/g, "");
  const tokens = normalized
    .split("~")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length !== 2) {
    return { startHour: 13, endHour: 15 };
  }

  const startToken = tokens[0];
  const endToken = /오전|오후/.test(tokens[1]) ? tokens[1] : `${startToken.includes("오후") ? "오후" : "오전"}${tokens[1]}`;

  return {
    startHour: parseKoreanTimeTokenToHour(startToken),
    endHour: parseKoreanTimeTokenToHour(endToken),
  };
};

type ReceiptTarget = {
  itemName: string;
  itemPrice: number;
};

type TreasureTarget = {
  guideText: string;
  guideImageUri: string;
};

const receiptTargets: ReceiptTarget[] = [
  { itemName: "아메리카노", itemPrice: 4500 },
  { itemName: "크루아상", itemPrice: 4200 },
  { itemName: "콜드브루", itemPrice: 5800 },
  { itemName: "시저 샐러드", itemPrice: 11900 },
  { itemName: "치즈버거 세트", itemPrice: 12900 },
  { itemName: "핸드드립 커피", itemPrice: 6500 },
  { itemName: "치즈 도넛", itemPrice: 3900 },
  { itemName: "파스타 런치", itemPrice: 13800 },
];

const treasureTargets: TreasureTarget[] = [
  {
    guideText: "입구 앞 노란 의자",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-1/640/420",
  },
  {
    guideText: "창가 옆 머그컵",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-2/640/420",
  },
  {
    guideText: "카운터 종이백",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-3/640/420",
  },
  {
    guideText: "벽면 포스터 하단",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-4/640/420",
  },
  {
    guideText: "초록 화분 옆 테이블",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-5/640/420",
  },
  {
    guideText: "메뉴판 아래 스티커",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-6/640/420",
  },
  {
    guideText: "계산대 옆 빨대통",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-7/640/420",
  },
  {
    guideText: "창문 손잡이 근처",
    guideImageUri: "https://picsum.photos/seed/drop-treasure-8/640/420",
  },
];

const getReceiptTarget = (index: number): ReceiptTarget => receiptTargets[index % receiptTargets.length];
const getTreasureTarget = (index: number): TreasureTarget => treasureTargets[index % treasureTargets.length];
const formatWon = (amount: number): string => `${amount.toLocaleString("ko-KR")}원`;
const NORTH_TEST_SPOT_OFFSET = { latitudeOffset: 0.000372, longitudeOffset: 0.000162 };

const dayQuarterQuietTimeLabels = [
  "오전 12시~오전 3시",
  "오전 3시~오전 6시",
  "오전 6시~오전 9시",
  "오전 9시~오후 12시",
  "오후 12시~오후 3시",
  "오후 3시~오후 6시",
  "오후 6시~오후 9시",
  "오후 9시~오전 12시",
] as const;

const northNeighborhoodStories = [
  {
    emoji: "☕",
    title: "자정 라이트 카페",
    description: "자정 시간대에도 조용히 머무를 수 있는 북측 심야 카페.",
  },
  {
    emoji: "🌙",
    title: "새벽 등대 티하우스",
    description: "새벽 이동 동선을 겨냥해 이른 인증 미션을 운영하는 티하우스.",
  },
  {
    emoji: "☕",
    title: "아침 첫잔 로스터리",
    description: "출근 전 방문 고객을 위한 오전 인증 미션이 쉬운 로스터리.",
  },
  {
    emoji: "🥯",
    title: "오전 브런치 스테이션",
    description: "오전 시간대 좌석 여유를 활용해 체류 미션을 운영하는 브런치 스팟.",
  },
  {
    emoji: "🥐",
    title: "정오 베이크룸",
    description: "점심 직후 포장 수요가 빠진 시간에 방문 인증을 유도하는 베이커리.",
  },
  {
    emoji: "🍜",
    title: "오후 골목 누들바",
    description: "오후 브레이크 타임의 여유 좌석을 활용해 체류 미션을 운영하는 누들바.",
  },
  {
    emoji: "🍷",
    title: "저녁 문라이트 와인바",
    description: "저녁 피크 직전 시간에 손님 분산형 미션을 진행하는 와인바.",
  },
  {
    emoji: "🌃",
    title: "야간 리버사이드 라운지",
    description: "늦은 밤 시간대 인증을 위한 조용한 좌석 중심 라운지.",
  },
] as const;

const northNeighborhoodOffsets = [
  { latitudeOffset: 0.000014, longitudeOffset: -0.000012 },
  { latitudeOffset: 0.000022, longitudeOffset: 0.00001 },
  { latitudeOffset: -0.000012, longitudeOffset: -0.00002 },
  { latitudeOffset: -0.00002, longitudeOffset: 0.000016 },
  { latitudeOffset: 0.000006, longitudeOffset: 0.000024 },
  { latitudeOffset: -0.000014, longitudeOffset: 0.000022 },
  { latitudeOffset: 0.000019, longitudeOffset: -0.000006 },
  { latitudeOffset: -0.000006, longitudeOffset: -0.000024 },
] as const;

const northTestSpotSeeds: BoardSeed[] = dayQuarterQuietTimeLabels.map((quietTimeLabel, index) => {
  const story = northNeighborhoodStories[index];
  const offset = northNeighborhoodOffsets[index];

  return {
    id: `b${30 + index}`,
    emoji: story.emoji,
    title: story.title,
    description: story.description,
    latitudeOffset: NORTH_TEST_SPOT_OFFSET.latitudeOffset + offset.latitudeOffset,
    longitudeOffset: NORTH_TEST_SPOT_OFFSET.longitudeOffset + offset.longitudeOffset,
    quietTimeLabel,
    stayMinutes: 2,
    visitReward: 10 + index,
    stayReward: 24 + index * 2,
  };
});

const boardSeeds: BoardSeed[] = [
  {
    id: "b1",
    emoji: "☕",
    title: "성수 브루랩",
    description: "아차산로 골목 유동 인구를 위한 오프피크 인증 미션.",
    latitudeOffset: 0.0001,
    longitudeOffset: -0.0002,
    quietTimeLabel: "오전 10시~12시",
    stayMinutes: 20,
    visitReward: 10,
    stayReward: 24,
  },
  {
    id: "b2",
    emoji: "🥐",
    title: "아차산로 베이커리",
    description: "빵 구매 고객 재방문을 위한 체류 보상형 게시판.",
    latitudeOffset: -0.0004,
    longitudeOffset: 0.0005,
    quietTimeLabel: "오후 2시~4시",
    stayMinutes: 25,
    visitReward: 12,
    stayReward: 28,
  },
  {
    id: "b3",
    emoji: "💻",
    title: "성수 워크라운지",
    description: "코워킹 고객 대상 장기 체류 인증 이벤트.",
    latitudeOffset: 0.0006,
    longitudeOffset: 0.0004,
    quietTimeLabel: "오전 9시~11시",
    stayMinutes: 30,
    visitReward: 11,
    stayReward: 34,
  },
  {
    id: "b4",
    emoji: "🥗",
    title: "서울숲 샐러드바",
    description: "점심 이후 비혼잡 시간대 방문 고객 보상 미션.",
    latitudeOffset: -0.0007,
    longitudeOffset: -0.0005,
    quietTimeLabel: "오후 3시~5시",
    stayMinutes: 20,
    visitReward: 9,
    stayReward: 22,
  },
  {
    id: "b5",
    emoji: "🍔",
    title: "뚝섬 버거스테이션",
    description: "매장 내 좌석 체류를 유도하는 GPS 인증 챌린지.",
    latitudeOffset: 0.0011,
    longitudeOffset: -0.0001,
    quietTimeLabel: "오후 4시~6시",
    stayMinutes: 30,
    visitReward: 13,
    stayReward: 33,
  },
  {
    id: "b6",
    emoji: "📚",
    title: "연무장길 북카페",
    description: "독서 고객 대상 조용한 시간대 방문 보상.",
    latitudeOffset: -0.001,
    longitudeOffset: 0.0002,
    quietTimeLabel: "오전 11시~오후 1시",
    stayMinutes: 35,
    visitReward: 10,
    stayReward: 38,
  },
  {
    id: "b7",
    emoji: "🫘",
    title: "성수 로스터리",
    description: "원두 시음 고객의 재방문을 위한 짧은 체류 미션.",
    latitudeOffset: 0.0003,
    longitudeOffset: 0.001,
    quietTimeLabel: "오후 1시~3시",
    stayMinutes: 15,
    visitReward: 8,
    stayReward: 20,
  },
  {
    id: "b8",
    emoji: "🍩",
    title: "수제도넛 하우스",
    description: "테이크아웃 시간 분산을 위한 오프피크 방문 보상.",
    latitudeOffset: -0.0003,
    longitudeOffset: -0.0011,
    quietTimeLabel: "오후 5시~7시",
    stayMinutes: 20,
    visitReward: 9,
    stayReward: 23,
  },
  {
    id: "b9",
    emoji: "🍱",
    title: "성수 델리키친",
    description: "런치 이후 매장 체류 인증 미션으로 리워드 지급.",
    latitudeOffset: 0.0014,
    longitudeOffset: 0.0006,
    quietTimeLabel: "오후 2시~4시",
    stayMinutes: 25,
    visitReward: 12,
    stayReward: 29,
  },
  {
    id: "b10",
    emoji: "🥤",
    title: "아뜰리에 스무디바",
    description: "피크 시간 외 방문 인증과 체류 인증을 동시 운영.",
    latitudeOffset: -0.0012,
    longitudeOffset: -0.0007,
    quietTimeLabel: "오전 10시~12시",
    stayMinutes: 20,
    visitReward: 11,
    stayReward: 24,
  },
  {
    id: "b11",
    emoji: "🥙",
    title: "성수 포케랩",
    description: "오피스 밀집 시간 이후 방문 고객 대상 미션.",
    latitudeOffset: 0.0009,
    longitudeOffset: -0.001,
    quietTimeLabel: "오후 3시~5시",
    stayMinutes: 25,
    visitReward: 10,
    stayReward: 27,
  },
  {
    id: "b12",
    emoji: "🍵",
    title: "뚝섬 티룸",
    description: "티 코스 체험 고객을 위한 GPS 체류 리워드.",
    latitudeOffset: -0.0014,
    longitudeOffset: 0.0008,
    quietTimeLabel: "오후 1시~3시",
    stayMinutes: 30,
    visitReward: 12,
    stayReward: 32,
  },
  {
    id: "b13",
    emoji: "🌮",
    title: "아차산로 타코바",
    description: "저녁 전 방문 분산을 위한 지역 기반 인증.",
    latitudeOffset: 0.0016,
    longitudeOffset: -0.0005,
    quietTimeLabel: "오후 4시~6시",
    stayMinutes: 20,
    visitReward: 9,
    stayReward: 22,
  },
  {
    id: "b14",
    emoji: "🥖",
    title: "성수 크루아상팩토리",
    description: "브런치 타임 이후 체류 고객 대상 코인 적립.",
    latitudeOffset: -0.0016,
    longitudeOffset: 0.0001,
    quietTimeLabel: "오후 2시~4시",
    stayMinutes: 30,
    visitReward: 11,
    stayReward: 33,
  },
  {
    id: "b15",
    emoji: "🍲",
    title: "서울숲 스프바",
    description: "직장인 저피크 시간 방문 인증 챌린지.",
    latitudeOffset: 0.0005,
    longitudeOffset: 0.0014,
    quietTimeLabel: "오후 3시~5시",
    stayMinutes: 20,
    visitReward: 10,
    stayReward: 25,
  },
  {
    id: "b16",
    emoji: "🍜",
    title: "성수 누들키친",
    description: "매장 체류를 유도하는 식사 후 미션 보드.",
    latitudeOffset: -0.0008,
    longitudeOffset: -0.0015,
    quietTimeLabel: "오후 4시~6시",
    stayMinutes: 25,
    visitReward: 10,
    stayReward: 27,
  },
  {
    id: "b17",
    emoji: "🧁",
    title: "성수 비건베이크",
    description: "디저트 카페 체류 시간을 늘리기 위한 인증 이벤트.",
    latitudeOffset: 0.0018,
    longitudeOffset: 0.0012,
    quietTimeLabel: "오전 11시~오후 1시",
    stayMinutes: 30,
    visitReward: 13,
    stayReward: 35,
  },
  {
    id: "b18",
    emoji: "🍥",
    title: "성수 라멘스팟",
    description: "브레이크 타임 직전 방문 인증 보상 프로그램.",
    latitudeOffset: -0.0019,
    longitudeOffset: -0.0003,
    quietTimeLabel: "오후 2시~3시 30분",
    stayMinutes: 20,
    visitReward: 9,
    stayReward: 23,
  },
  {
    id: "b19",
    emoji: "🧋",
    title: "성수 커피스탠드",
    description: "짧은 체류와 방문 인증을 결합한 빠른 리워드 미션.",
    latitudeOffset: 0.0012,
    longitudeOffset: -0.0016,
    quietTimeLabel: "오후 5시~7시",
    stayMinutes: 15,
    visitReward: 8,
    stayReward: 18,
  },
  {
    id: "b20",
    emoji: "🍳",
    title: "성수 브런치웍스",
    description: "브런치 이후 여유 시간대 방문 고객 집중형 이벤트.",
    latitudeOffset: -0.0011,
    longitudeOffset: 0.0015,
    quietTimeLabel: "오후 1시~3시",
    stayMinutes: 25,
    visitReward: 11,
    stayReward: 28,
  },
  {
    id: "b21",
    emoji: "🍕",
    title: "성수 슬라이스바",
    description: "피자 라운지 좌석 이용 고객 대상 체류 미션.",
    latitudeOffset: 0.0021,
    longitudeOffset: -0.0008,
    quietTimeLabel: "오후 3시~5시",
    stayMinutes: 20,
    visitReward: 10,
    stayReward: 24,
  },
  {
    id: "b22",
    emoji: "🍤",
    title: "성수 덴푸라랩",
    description: "점심 피크 이후 방문 분산을 위한 GPS 인증.",
    latitudeOffset: -0.002,
    longitudeOffset: 0.0009,
    quietTimeLabel: "오후 2시~4시",
    stayMinutes: 20,
    visitReward: 9,
    stayReward: 22,
  },
  {
    id: "b23",
    emoji: "🍙",
    title: "아차산로 온기식당",
    description: "지역 상권 체류 유도형 리워드 캠페인 게시판.",
    latitudeOffset: 0.0002,
    longitudeOffset: 0.002,
    quietTimeLabel: "오후 4시~6시",
    stayMinutes: 30,
    visitReward: 12,
    stayReward: 34,
  },
  {
    id: "b24",
    emoji: "🍰",
    title: "성수 디저트아틀리에",
    description: "저녁 전 방문과 체류 참여를 동시에 장려하는 미션.",
    latitudeOffset: -0.0002,
    longitudeOffset: -0.0021,
    quietTimeLabel: "오후 5시~7시",
    stayMinutes: 25,
    visitReward: 11,
    stayReward: 29,
  },
  {
    id: "b25",
    emoji: "🧭",
    title: "아차산17길 로컬 라운지",
    description: "북측 생활권 유입을 위한 근거리 방문/체류 인증 라운지.",
    latitudeOffset: 0.000328,
    longitudeOffset: 0.000138,
    quietTimeLabel: "오후 1시~3시",
    stayMinutes: 1,
    visitReward: 10,
    stayReward: 22,
  },
  {
    id: "b26",
    emoji: "📍",
    title: "북측 리버뷰 카페",
    description: "강변 산책 동선 고객을 위한 북측 대표 방문 인증 카페.",
    latitudeOffset: 0.000372,
    longitudeOffset: 0.000162,
    quietTimeLabel: "오후 2시~4시",
    stayMinutes: 1,
    visitReward: 11,
    stayReward: 24,
  },
  {
    id: "b27",
    emoji: "📌",
    title: "남측 골목 베이크샵",
    description: "퇴근 전 짧은 체류 고객을 노린 남측 골목형 베이커리.",
    latitudeOffset: 0.000286,
    longitudeOffset: 0.000094,
    quietTimeLabel: "오후 3시~5시",
    stayMinutes: 1,
    visitReward: 9,
    stayReward: 23,
  },
  {
    id: "b28",
    emoji: "🏁",
    title: "광나루 코너 편집숍",
    description: "짧은 체류 고객 대상 오프피크 방문 리워드를 운영하는 편집숍.",
    latitudeOffset: 0.000341,
    longitudeOffset: 0.000089,
    quietTimeLabel: "오전 11시~오후 1시",
    stayMinutes: 1,
    visitReward: 12,
    stayReward: 27,
  },
  {
    id: "b29",
    emoji: "🛰️",
    title: "강변 스탠드 커피",
    description: "저녁 전 방문 분산을 위해 인증 미션을 운영하는 스탠드형 카페.",
    latitudeOffset: 0.000301,
    longitudeOffset: 0.000187,
    quietTimeLabel: "오후 4시~6시",
    stayMinutes: 1,
    visitReward: 13,
    stayReward: 30,
  },
  ...northTestSpotSeeds,
];

const seongsuBoards: Board[] = boardSeeds.map((seed, index): Board => {
  const latitude = BASE_COORDINATE.latitude + seed.latitudeOffset;
  const longitude = BASE_COORDINATE.longitude + seed.longitudeOffset;
  const quietTimeRange = parseQuietTimeRange(seed.quietTimeLabel);
  const receiptTarget = getReceiptTarget(index);
  const treasureTarget = getTreasureTarget(index);
  const receiptReward = Math.max(Math.round(seed.stayReward * 0.75), 16);
  const treasureReward = Math.max(Math.round(seed.stayReward * 0.7), 15);
  const stampGoalCount = seed.stampGoalCount ?? 5;
  const stampReward = seed.stampReward ?? Math.max(seed.stayReward + 8, 30);

  return {
    id: seed.id,
    type: "board",
    coordinate: { latitude, longitude },
    emoji: seed.emoji,
    title: seed.title,
    description: seed.description,
    createdAt: Date.now() - (index + 1) * 100000,
    missions: [
      {
        id: `${seed.id}-m1`,
        type: "quiet_time_visit",
        title: "한산 시간대 방문 인증",
        description: `${seed.quietTimeLabel} 방문 후 GPS 인증 시 코인 적립.`,
        rewardCoins: seed.visitReward,
        quietTimeStartHour: quietTimeRange.startHour,
        quietTimeEndHour: quietTimeRange.endHour,
      },
      {
        id: `${seed.id}-m2`,
        type: "stay_duration",
        title: `${seed.stayMinutes}분 이상 체류`,
        description: `체류 시작/종료 시 GPS를 기록해 ${seed.stayMinutes}분 이상 체류를 검증합니다.`,
        rewardCoins: seed.stayReward,
        minDurationMinutes: seed.stayMinutes,
      },
      {
        id: `${seed.id}-m3`,
        type: "receipt_purchase",
        title: "영수증으로 구매인증",
        description: `판매자가 지정한 ${receiptTarget.itemName}(${formatWon(receiptTarget.itemPrice)}) 구매 영수증을 촬영해 인증하세요.`,
        rewardCoins: receiptReward,
        receiptItemName: receiptTarget.itemName,
        receiptItemPrice: receiptTarget.itemPrice,
      },
      {
        id: `${seed.id}-m4`,
        type: "camera_treasure_hunt",
        title: "카메라로 보물찾기",
        description: `가이드 사진과 "${treasureTarget.guideText}" 힌트를 보고 같은 장면을 촬영해 인증하세요.`,
        rewardCoins: treasureReward,
        treasureGuideText: treasureTarget.guideText,
        treasureGuideImageUri: treasureTarget.guideImageUri,
      },
      {
        id: `${seed.id}-m5`,
        type: "repeat_visit_stamp",
        title: `반복 방문 스탬프 (${stampGoalCount}회)`,
        description: `하루 1회 방문 인증으로 스탬프를 모으고 ${stampGoalCount}개를 채우면 보상을 받아요.`,
        rewardCoins: stampReward,
        stampGoalCount,
      },
    ],
  };
});

const legacyBoards: Board[] = [
  {
    id: "legacy-b1",
    type: "board",
    coordinate: { latitude: 37.475, longitude: 126.936 },
    emoji: "☕",
    title: "모카하우스 신림점",
    description: "한산 시간 방문/체류 미션으로 코인을 받을 수 있어요.",
    createdAt: Date.now() - 2500000,
    missions: [
      {
        id: "legacy-b1-m1",
        type: "quiet_time_visit",
        title: "한산 시간대 방문 인증",
        description: "오후 2시~4시 사이 방문 후 GPS 인증하면 코인을 드려요.",
        rewardCoins: 12,
        quietTimeStartHour: 14,
        quietTimeEndHour: 16,
      },
      {
        id: "legacy-b1-m2",
        type: "stay_duration",
        title: "30분 이상 체류",
        description: "체류 시작 버튼을 누른 뒤 30분 이상 머물고 종료하면 보상 지급.",
        rewardCoins: 35,
        minDurationMinutes: 30,
      },
      {
        id: "legacy-b1-m3",
        type: "receipt_purchase",
        title: "영수증으로 구매인증",
        description: "판매자가 지정한 카페라떼(5,500원) 구매 영수증을 촬영해 인증하세요.",
        rewardCoins: 22,
        receiptItemName: "카페라떼",
        receiptItemPrice: 5500,
      },
      {
        id: "legacy-b1-m4",
        type: "camera_treasure_hunt",
        title: "카메라로 보물찾기",
        description: "가이드 사진과 \"창가 옆 머그컵\" 힌트를 보고 같은 장면을 촬영해 인증하세요.",
        rewardCoins: 20,
        treasureGuideText: "창가 옆 머그컵",
        treasureGuideImageUri: "https://picsum.photos/seed/drop-legacy-treasure-1/640/420",
      },
      {
        id: "legacy-b1-m5",
        type: "repeat_visit_stamp",
        title: "반복 방문 스탬프 (5회)",
        description: "하루 1회 방문 인증으로 스탬프를 모아 5개를 채우면 보상이 지급돼요.",
        rewardCoins: 40,
        stampGoalCount: 5,
      },
    ],
  },
  {
    id: "legacy-b2",
    type: "board",
    coordinate: { latitude: 37.47, longitude: 126.942 },
    emoji: "🍔",
    title: "버거랩 보라매점",
    description: "점심 피크 이후 미션 참여 시 리워드를 받을 수 있어요.",
    createdAt: Date.now() - 2600000,
    missions: [
      {
        id: "legacy-b2-m1",
        type: "quiet_time_visit",
        title: "한산 시간대 방문 인증",
        description: "평일 3시 이후 매장 방문 시 GPS 인증하면 코인 지급.",
        rewardCoins: 10,
        quietTimeStartHour: 15,
        quietTimeEndHour: 18,
      },
      {
        id: "legacy-b2-m2",
        type: "stay_duration",
        title: "20분 이상 체류",
        description: "시작/종료 시점 GPS를 기록해 20분 이상 체류를 검증합니다.",
        rewardCoins: 24,
        minDurationMinutes: 20,
      },
      {
        id: "legacy-b2-m3",
        type: "receipt_purchase",
        title: "영수증으로 구매인증",
        description: "판매자가 지정한 더블치즈버거 세트(12,900원) 구매 영수증을 촬영해 인증하세요.",
        rewardCoins: 18,
        receiptItemName: "더블치즈버거 세트",
        receiptItemPrice: 12900,
      },
      {
        id: "legacy-b2-m4",
        type: "camera_treasure_hunt",
        title: "카메라로 보물찾기",
        description: "가이드 사진과 \"카운터 종이백\" 힌트를 보고 같은 장면을 촬영해 인증하세요.",
        rewardCoins: 17,
        treasureGuideText: "카운터 종이백",
        treasureGuideImageUri: "https://picsum.photos/seed/drop-legacy-treasure-2/640/420",
      },
      {
        id: "legacy-b2-m5",
        type: "repeat_visit_stamp",
        title: "반복 방문 스탬프 (5회)",
        description: "하루 1회 방문 인증으로 스탬프를 모아 5개를 채우면 보상이 지급돼요.",
        rewardCoins: 32,
        stampGoalCount: 5,
      },
    ],
  },
  {
    id: "legacy-b3",
    type: "board",
    coordinate: { latitude: 37.468, longitude: 126.934 },
    emoji: "📚",
    title: "북스트리트 카페",
    description: "독서 고객 유입을 위한 체류 중심 미션입니다.",
    createdAt: Date.now() - 2700000,
    missions: [
      {
        id: "legacy-b3-m1",
        type: "quiet_time_visit",
        title: "한산 시간대 방문 인증",
        description: "오전 10시~12시 사이 방문 인증 시 코인 보상.",
        rewardCoins: 9,
        quietTimeStartHour: 10,
        quietTimeEndHour: 12,
      },
      {
        id: "legacy-b3-m2",
        type: "stay_duration",
        title: "40분 이상 체류",
        description: "조용한 좌석에서 40분 이상 체류 후 GPS 검증.",
        rewardCoins: 42,
        minDurationMinutes: 40,
      },
      {
        id: "legacy-b3-m3",
        type: "receipt_purchase",
        title: "영수증으로 구매인증",
        description: "판매자가 지정한 핸드드립 커피(6,500원) 구매 영수증을 촬영해 인증하세요.",
        rewardCoins: 24,
        receiptItemName: "핸드드립 커피",
        receiptItemPrice: 6500,
      },
      {
        id: "legacy-b3-m4",
        type: "camera_treasure_hunt",
        title: "카메라로 보물찾기",
        description: "가이드 사진과 \"메뉴판 아래 스티커\" 힌트를 보고 같은 장면을 촬영해 인증하세요.",
        rewardCoins: 25,
        treasureGuideText: "메뉴판 아래 스티커",
        treasureGuideImageUri: "https://picsum.photos/seed/drop-legacy-treasure-3/640/420",
      },
      {
        id: "legacy-b3-m5",
        type: "repeat_visit_stamp",
        title: "반복 방문 스탬프 (5회)",
        description: "하루 1회 방문 인증으로 스탬프를 모아 5개를 채우면 보상이 지급돼요.",
        rewardCoins: 45,
        stampGoalCount: 5,
      },
    ],
  },
  {
    id: "legacy-b4",
    type: "board",
    coordinate: { latitude: 37.474, longitude: 126.933 },
    emoji: "🥗",
    title: "그린샐러드 스튜디오",
    description: "오프피크 방문과 체류 미션 두 가지가 열려 있어요.",
    createdAt: Date.now() - 2800000,
    missions: [
      {
        id: "legacy-b4-m1",
        type: "quiet_time_visit",
        title: "한산 시간대 방문 인증",
        description: "오후 4시~5시 방문 후 GPS 인증 완료 시 코인 적립.",
        rewardCoins: 11,
        quietTimeStartHour: 16,
        quietTimeEndHour: 17,
      },
      {
        id: "legacy-b4-m2",
        type: "stay_duration",
        title: "25분 이상 체류",
        description: "체류 시작/종료 버튼으로 25분 이상 체류를 인증하세요.",
        rewardCoins: 28,
        minDurationMinutes: 25,
      },
      {
        id: "legacy-b4-m3",
        type: "receipt_purchase",
        title: "영수증으로 구매인증",
        description: "판매자가 지정한 시그니처 샐러드(11,800원) 구매 영수증을 촬영해 인증하세요.",
        rewardCoins: 20,
        receiptItemName: "시그니처 샐러드",
        receiptItemPrice: 11800,
      },
      {
        id: "legacy-b4-m4",
        type: "camera_treasure_hunt",
        title: "카메라로 보물찾기",
        description: "가이드 사진과 \"초록 화분 옆 테이블\" 힌트를 보고 같은 장면을 촬영해 인증하세요.",
        rewardCoins: 18,
        treasureGuideText: "초록 화분 옆 테이블",
        treasureGuideImageUri: "https://picsum.photos/seed/drop-legacy-treasure-4/640/420",
      },
      {
        id: "legacy-b4-m5",
        type: "repeat_visit_stamp",
        title: "반복 방문 스탬프 (5회)",
        description: "하루 1회 방문 인증으로 스탬프를 모아 5개를 채우면 보상이 지급돼요.",
        rewardCoins: 36,
        stampGoalCount: 5,
      },
    ],
  },
];

export const initialBoards: Board[] = [...seongsuBoards, ...legacyBoards];
