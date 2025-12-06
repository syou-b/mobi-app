import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { sleepData, dream } = await request.json();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // 수면 데이터를 타임라인 형식으로 변환
    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const getSleepTimeline = () => {
      const timeline: string[] = [];

      // inBed 시작
      if (sleepData.inBed) {
        timeline.push(
          `${formatTime(sleepData.inBed.startDate)} - 침대에 들어감`
        );
      }

      // 모든 수면 단계를 시간순으로 정렬
      const allStages = sleepData.samples
        .filter((s: any) =>
          ["asleep", "core", "deep", "rem", "awake"].includes(s.categoryType)
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

      allStages.forEach((stage: any) => {
        const start = formatTime(stage.startDate);
        const end = formatTime(stage.endDate);
        const duration = Math.round(
          (new Date(stage.endDate).getTime() -
            new Date(stage.startDate).getTime()) /
            60000
        );

        const stageLabel: { [key: string]: string } = {
          asleep: "수면 시작",
          core: "코어 수면",
          deep: "깊은 수면",
          rem: "REM 수면",
          awake: "깨어있음",
        };

        if (stage.categoryType === "asleep") {
          timeline.push(`${start} - 잠들기 시작`);
        } else {
          timeline.push(
            `${start} - ${end} | ${stageLabel[stage.categoryType]} (${duration}분)`
          );
        }
      });

      // inBed 종료
      if (sleepData.inBed) {
        timeline.push(
          `${formatTime(sleepData.inBed.endDate)} - 침대에서 일어남`
        );
      }

      return timeline.join("\n");
    };

    // Gemini 프롬프트 구성
    const prompt = `당신은 꿈 일기 작성을 돕는 전문가입니다. 사용자의 수면 데이터와 초기 꿈 기록을 바탕으로, 꿈을 더 자세히 기억하고 확장할 수 있도록 5개의 맞춤형 질문을 생성해주세요.

**수면 타임라인:**
${getSleepTimeline()}

**수면 통계:**
- 총 수면 시간: ${sleepData.asleep ? Math.round((new Date(sleepData.asleep.endDate).getTime() - new Date(sleepData.asleep.startDate).getTime()) / 60000) : 0}분
- 깊은 수면: ${Math.round(sleepData.deepMinutes)}분
- REM 수면: ${Math.round(sleepData.remMinutes)}분
- 코어 수면: ${Math.round(sleepData.coreMinutes)}분
- 깨어있던 시간: ${Math.round(sleepData.awakeMinutes)}분

**사용자가 처음 기록한 꿈:**
"${dream}"

**요구사항:**
1. 수면 데이터를 분석하여 각 질문마다 관련된 수면 패턴 인사이트를 제공하세요.
2. 질문은 구체적이고 답변하기 쉬워야 합니다.
3. 꿈의 장소, 인물, 행동, 감각, 감정 등 다양한 측면을 다루세요.
4. 반드시 5개의 질문을 생성하세요.
5. **중요: 질문에 구체적인 시간대(예: "새벽 3시", "오전 5시")를 언급하지 마세요. 수면 단계와 패턴만 언급하세요.**

**출력 형식 (JSON):**
\`\`\`json
{
  "questions": [
    {
      "id": 1,
      "question": "질문 내용",
      "context": "수면 데이터 기반 인사이트 (시간대 언급 금지)"
    },
    ...
  ]
}
\`\`\`

JSON만 출력하고 다른 설명은 포함하지 마세요.`;

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const generatedText = response.text;

    if (!generatedText) {
      console.error("No text generated from Gemini");
      throw new Error("No response text from Gemini");
    }

    console.log("Generated text:", generatedText);

    // JSON 추출 (```json ... ``` 형태로 올 수 있음)
    let parsedQuestions;
    try {
      // JSON 코드 블록 제거
      const jsonMatch = generatedText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      parsedQuestions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", generatedText);
      console.error("Parse error:", parseError);

      // Fallback: 기본 질문 반환
      parsedQuestions = {
        questions: [
          {
            id: 1,
            question:
              "꿈속 장소는 어디였나요? 실제로 아는 곳인가요, 아니면 낯선 곳인가요?",
            context: `깊은 수면이 ${Math.round(sleepData.deepMinutes)}분이었어요. 이 단계에서는 공간 기억이 처리됩니다.`,
          },
          {
            id: 2,
            question: "꿈에 등장한 사람들은 누구였나요?",
            context: `REM 수면이 ${Math.round(sleepData.remMinutes)}분이었네요. REM 단계에서는 감정과 관계에 대한 꿈을 꿉니다.`,
          },
          {
            id: 3,
            question: "꿈속에서 무엇을 하고 있었나요?",
            context: `코어 수면이 ${Math.round(sleepData.coreMinutes)}분이었어요. 일상적인 경험들이 재구성됩니다.`,
          },
          {
            id: 4,
            question: "꿈의 색깔이나 분위기는 어땠나요?",
            context: "꿈의 감각적 디테일은 수면의 질과 관련이 있습니다.",
          },
          {
            id: 5,
            question: "깨어났을 때 어떤 감정이 남아있었나요?",
            context: `총 ${Math.round(sleepData.awakeMinutes)}분간 깨어있었어요. 이는 꿈 기억에 영향을 줍니다.`,
          },
        ],
      };
    }

    return NextResponse.json(parsedQuestions);
  } catch (error) {
    console.error("Error in generate-questions API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
