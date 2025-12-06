import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { dream, questions } = await request.json();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // 답변된 질문들만 필터링
    const answeredQuestions = questions.filter(
      (q: any) => q.answer && q.answer.trim()
    );

    // 질문-답변 목록 구성
    const qaList = answeredQuestions
      .map(
        (q: any, idx: number) =>
          `Q${idx + 1}: ${q.question}\nA${idx + 1}: ${q.answer}`
      )
      .join("\n\n");

    // Gemini 프롬프트 구성
    const prompt = `당신은 창의적인 작가입니다. 사용자가 기록한 꿈의 단편들을 하나의 일관되고 몰입감 있는 서사로 엮어주세요.

**사용자가 처음 기록한 꿈:**
"${dream}"

**추가 답변들:**
${qaList}

**요구사항:**
1. 위 내용을 바탕으로 하나의 자연스러운 이야기로 만드세요
2. 1인칭 시점으로 작성하세요 (꿈을 꾼 사람의 관점)
3. 현재형 또는 과거형을 일관되게 사용하세요
4. 장면 전환이 자연스럽게 연결되도록 하세요
5. 감각적 디테일(색깔, 소리, 느낌 등)을 살려주세요
6. 분량: 300-500자 정도의 짧은 서사
7. 문학적이거나 과도하게 꾸민 표현은 피하고, 꿈의 생생함을 그대로 전달하세요
8. 사용자가 제공하지 않은 내용은 추가하지 마세요

서사만 출력하고 다른 설명은 포함하지 마세요.`;

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const narrative = response.text;

    if (!narrative) {
      console.error("No narrative generated from Gemini");
      throw new Error("No response text from Gemini");
    }

    console.log("Generated narrative:", narrative);

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error("Error in generate-narrative API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
