import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { sleepData, narrative } = await request.json();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Gemini 프롬프트 구성
    const prompt = `당신은 수면 전문가입니다. 사용자의 수면 데이터와 꿈 내용을 분석하여 인사이트를 제공해주세요.

**수면 데이터:**
- 총 수면 시간: ${sleepData.asleep ? Math.round((new Date(sleepData.asleep.endDate).getTime() - new Date(sleepData.asleep.startDate).getTime()) / 60000) : 0}분
- 깊은 수면: ${Math.round(sleepData.deepMinutes)}분
- REM 수면: ${Math.round(sleepData.remMinutes)}분
- 코어 수면: ${Math.round(sleepData.coreMinutes)}분
- 깨어있던 시간: ${Math.round(sleepData.awakeMinutes)}분

**꿈 내용:**
"${narrative}"

**요구사항:**
1. 수면 패턴을 분석하고 평가해주세요 (깊은 수면 비율, REM 비율 등)
2. 꿈의 내용이 수면 패턴과 어떻게 연관될 수 있는지 설명해주세요
3. 수면 개선을 위한 간단한 조언을 1-2개 제공해주세요
4. 따뜻하고 격려하는 톤으로 작성해주세요
5. 분량: 200-300자 정도

분석 내용만 출력하고 다른 설명은 포함하지 마세요.`;

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const analysis = response.text;

    if (!analysis) {
      console.error("No analysis generated from Gemini");
      throw new Error("No response text from Gemini");
    }

    console.log("Generated analysis:", analysis);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error in generate-sleep-analysis API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
