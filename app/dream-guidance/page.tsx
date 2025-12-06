"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  question: string;
  context: string; // 수면 데이터 기반 맥락
  answer: string;
}

interface SleepContext {
  date: string;
  samples: any[]; // 타임라인 생성을 위한 전체 샘플 데이터
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  awakeMinutes: number;
  inBed: any;
  asleep: any;
}

export default function DreamGuidance() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [sleepContext, setSleepContext] = useState<SleepContext | null>(null);
  const [initialDream, setInitialDream] = useState("");

  useEffect(() => {
    // localStorage에서 데이터 로드
    const sleepDataStr = localStorage.getItem("todaySleepData");
    const dreamText = localStorage.getItem("initialDream");

    if (!sleepDataStr || !dreamText) {
      alert("데이터를 불러올 수 없습니다.");
      router.push("/");
      return;
    }

    setSleepContext(JSON.parse(sleepDataStr));
    setInitialDream(dreamText);

    // LLM API 호출해서 질문 생성
    generateQuestions(JSON.parse(sleepDataStr), dreamText);
  }, []);

  const generateQuestions = async (sleepData: SleepContext, dream: string) => {
    setIsGenerating(true);

    try {
      // Gemini API 호출
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sleepData, dream }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();

      // questions 배열에 answer 필드 추가
      const questionsWithAnswers = data.questions.map((q: any) => ({
        ...q,
        answer: "",
      }));

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("질문 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      router.push("/");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      alert("답변을 입력해주세요!");
      return;
    }

    // 현재 답변 저장
    const updatedQuestions = [...questions];
    updatedQuestions[currentStep].answer = currentAnswer;
    setQuestions(updatedQuestions);
    setCurrentAnswer("");

    // 다음 질문으로
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 모든 질문 완료 - 다음 단계로
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setCurrentAnswer("");
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // TODO: 다음 페이지로 이동 (서사화/이미지 생성)
    console.log("Initial Dream:", initialDream);
    console.log("Answers:", questions);

    // 임시로 홈으로
    router.push("/");
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            수면 데이터 분석 중...
          </h2>
          <p className="text-gray-600">
            당신의 꿈을 더 잘 기억할 수 있도록 질문을 준비하고 있어요
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                질문 {currentStep + 1} / {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% 완료
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Sleep Context */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <div className="text-xs font-semibold text-blue-900 mb-1">
                  수면 데이터 기반 인사이트
                </div>
                <p className="text-sm text-blue-800">
                  {currentQuestion.context}
                </p>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-4">
            <label className="block text-lg font-bold text-gray-800 mb-4">
              {currentQuestion.question}
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="자유롭게 답변해주세요..."
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none text-gray-800 placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Initial Dream Reference */}
        {initialDream && (
          <div className="bg-purple-50 rounded-2xl p-4 mb-6">
            <div className="text-xs font-semibold text-purple-900 mb-2">
              처음에 적은 내용:
            </div>
            <p className="text-sm text-purple-800 italic">"{initialDream}"</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep < questions.length - 1 ? "다음 질문" : "완료하기"}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 text-gray-600 hover:text-gray-800 font-medium"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
