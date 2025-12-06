"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SleepContext {
  date: string;
  samples: any[];
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  awakeMinutes: number;
  inBed: any;
  asleep: any;
}

export default function DreamJournal() {
  const router = useRouter();

  const [sleepData, setSleepData] = useState<SleepContext | null>(null);
  const [narrative, setNarrative] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [initialDream, setInitialDream] = useState("");
  const [sleepAnalysis, setSleepAnalysis] = useState("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(true);

  useEffect(() => {
    // localStorage에서 모든 데이터 로드
    const sleepDataStr = localStorage.getItem("todaySleepData");
    const narrativeText = localStorage.getItem("dreamNarrative");
    const image = localStorage.getItem("dreamImage"); // 이미지는 선택사항
    const dreamText = localStorage.getItem("initialDream");

    if (!sleepDataStr || !narrativeText || !dreamText) {
      alert("데이터를 불러올 수 없습니다.");
      router.push("/");
      return;
    }

    const sleepContext = JSON.parse(sleepDataStr);
    setSleepData(sleepContext);
    setNarrative(narrativeText);
    setImageUrl(image || ""); // 이미지 없으면 빈 문자열
    setInitialDream(dreamText);

    // 수면 분석 생성
    generateSleepAnalysis(sleepContext, narrativeText);
  }, []);

  const generateSleepAnalysis = async (
    sleepContext: SleepContext,
    dreamNarrative: string
  ) => {
    setIsGeneratingAnalysis(true);

    try {
      const response = await fetch("/api/generate-sleep-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sleepData: sleepContext,
          narrative: dreamNarrative,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate analysis");
      }

      const data = await response.json();
      setSleepAnalysis(data.analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      setSleepAnalysis("수면 분석을 생성할 수 없습니다.");
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}시간 ${mins}분`;
  };

  const handleSave = () => {
    // TODO: 실제 저장 로직 (DB 또는 로컬 저장)
    alert("저널이 저장되었습니다!");
    router.push("/");
  };

  if (isGeneratingAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            수면 분석 중...
          </h2>
          <p className="text-gray-600">
            당신의 꿈과 수면 패턴을 분석하고 있어요
          </p>
        </div>
      </div>
    );
  }

  if (!sleepData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="pt-8 pb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">꿈 일기</h1>
            <p className="text-gray-600">
              {new Date(sleepData.date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Sleep Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>수면 타임라인</span>
          </h2>

          {/* Sleep Timeline Visualization */}
          {sleepData.inBed && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">😴 총 수면</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {sleepData.asleep
                      ? formatMinutes(
                          (new Date(sleepData.asleep.endDate).getTime() -
                            new Date(sleepData.asleep.startDate).getTime()) /
                            60000
                        )
                      : "N/A"}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">🌙 깊은 수면</div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {formatMinutes(sleepData.deepMinutes)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">💭 REM</div>
                  <div className="text-lg font-semibold text-purple-600">
                    {formatMinutes(sleepData.remMinutes)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">⏰ 시간</div>
                  <div className="text-sm font-semibold text-gray-600">
                    {formatTime(sleepData.inBed.startDate)} -{" "}
                    {formatTime(sleepData.inBed.endDate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sleep Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>수면 & 꿈 분석</span>
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {sleepAnalysis}
            </p>
          </div>
        </div>

        {/* Dream Image - Only show if image exists */}
        {imageUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🖼️</span>
              <span>꿈 이미지</span>
            </h2>
            <div className="rounded-xl overflow-hidden">
              <img
                src={imageUrl}
                alt="Dream visualization"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Dream Narrative */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📖</span>
            <span>꿈 이야기</span>
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {narrative}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          <button
            onClick={handleSave}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            저널 저장하기
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
