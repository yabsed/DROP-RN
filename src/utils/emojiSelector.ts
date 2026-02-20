const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";
let hasWarnedMissingKey = false;

type RecommendEmojiParams = {
  title: string;
  content: string;
  signal?: AbortSignal;
};

const extractFirstEmoji = (text: string): string | null => {
  const matched = text.match(/\p{Extended_Pictographic}/gu);
  return matched?.[0] ?? null;
};

export const recommendEmojiForPost = async ({
  title,
  content,
  signal,
}: RecommendEmojiParams): Promise<string | null> => {
  const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
  if (!apiKey) {
    if (__DEV__ && !hasWarnedMissingKey) {
      hasWarnedMissingKey = true;
      console.warn("[emojiSelector] EXPO_PUBLIC_DEEPSEEK_API_KEY is missing.");
    }
    return null;
  }

  const payload = {
    model: DEEPSEEK_MODEL,
    stream: false,
    messages: [
      {
        role: "system",
        content:
          "당신은 게시글 감정/주제를 보고 이모지 1개만 추천하는 도우미다. 반드시 이모지 한 글자만 출력하고 설명은 금지한다.",
      },
      {
        role: "user",
        content: `제목: ${title || "(없음)"}\n본문: ${content || "(없음)"}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 8,
  };

  try {
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      if (__DEV__) {
        const errorText = await response.text();
        console.warn(`[emojiSelector] DeepSeek request failed: ${response.status} ${errorText}`);
      }
      return null;
    }

    const data = await response.json();
    const contentText = data?.choices?.[0]?.message?.content;
    if (typeof contentText !== "string") return null;

    return extractFirstEmoji(contentText.trim());
  } catch {
    return null;
  }
};
