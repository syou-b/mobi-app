import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { narrative, initialDream } = await request.json();

    const GEMINI_API_KEY_IMAGE = process.env.GEMINI_API_KEY_IMAGE;

    if (!GEMINI_API_KEY_IMAGE) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY_IMAGE });

    // 이미지 생성 프롬프트 구성
    const prompt = `Create a dreamlike, surreal image based on this dream narrative:

"${narrative}"

Style requirements:
- Dreamlike and surreal atmosphere
- Soft, ethereal lighting
- Rich colors with a slight haze
- Fantasy art style
- Emotional and evocative
- NOT photorealistic, but artistic and interpretive

Focus on the key visual elements and emotional tone from the narrative.`;

    console.log("Generating image with prompt:", prompt);

    // Gemini 이미지 생성 API 호출
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    // 응답 검증
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response");
      throw new Error("No image candidates generated");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      console.error("No content or parts in candidate");
      throw new Error("Invalid response structure");
    }

    // 이미지 데이터 추출
    let imageBase64 = null;

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      console.error("No image data in response");
      throw new Error("No image generated");
    }

    console.log("Image generated successfully");

    // Base64 이미지를 data URL로 변환하여 반환
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in generate-image API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
