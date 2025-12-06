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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < 1) {
      setCurrentSlide(currentSlide + 1);
    }

    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    // localStorage에서 모든 데이터 로드
    const sleepDataStr = localStorage.getItem("todaySleepData");
    const narrativeText = localStorage.getItem("dreamNarrative");
    const image = localStorage.getItem("dreamImage"); // 이미지는 선택사항
    const dreamText = localStorage.getItem("initialDream");
    const savedAnalysis = localStorage.getItem("sleepAnalysis"); // 저장된 분석

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

    // 저장된 분석이 있으면 사용, 없으면 생성
    if (savedAnalysis) {
      setSleepAnalysis(savedAnalysis);
      setIsGeneratingAnalysis(false);
    } else {
      generateSleepAnalysis(sleepContext, narrativeText);
    }
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

      // localStorage에 저장
      localStorage.setItem("sleepAnalysis", data.analysis);
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pt-12">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button - iOS Safe Area */}
        <div
          className="pb-4 px-4 sticky top-0 bg-gradient-to-b from-purple-50 to-transparent z-10"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="pt-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">뒤로</span>
            </button>
          </div>
        </div>

        <div className="px-4">
          {/* Title */}
          <div className="pb-6">
            <div className="text-center">
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
                {/* Visual Timeline */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{formatTime(sleepData.inBed.startDate)}</span>
                    <span>{formatTime(sleepData.inBed.endDate)}</span>
                  </div>
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {sleepData.samples
                      .filter((s: any) =>
                        ["deep", "core", "rem", "awake"].includes(
                          s.categoryType
                        )
                      )
                      .map((stage: any, idx: number) => {
                        const bedStart = new Date(
                          sleepData.inBed.startDate
                        ).getTime();
                        const bedEnd = new Date(
                          sleepData.inBed.endDate
                        ).getTime();
                        const totalDuration = bedEnd - bedStart;

                        const stageStart = new Date(stage.startDate).getTime();
                        const stageEnd = new Date(stage.endDate).getTime();
                        const left =
                          ((stageStart - bedStart) / totalDuration) * 100;
                        const width =
                          ((stageEnd - stageStart) / totalDuration) * 100;

                        const colorMap: { [key: string]: string } = {
                          deep: "bg-indigo-600",
                          core: "bg-blue-400",
                          rem: "bg-purple-400",
                          awake: "bg-orange-300",
                        };

                        return (
                          <div
                            key={idx}
                            className={`absolute h-full ${colorMap[stage.categoryType]}`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                          />
                        );
                      })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                      <span className="text-gray-600">깊은 수면</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-400 rounded"></div>
                      <span className="text-gray-600">코어 수면</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-400 rounded"></div>
                      <span className="text-gray-600">REM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-300 rounded"></div>
                      <span className="text-gray-600">깨어있음</span>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
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
                    <div className="text-xs text-gray-500 mb-1">
                      🌙 깊은 수면
                    </div>
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

          {/* Dream Image & Narrative Carousel */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💭</span>
              <span>꿈 기록</span>
            </h2>

            <div className="relative">
              {/* Carousel Container */}
              <div
                className="overflow-hidden rounded-xl"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Slide 1: Image (if exists) */}
                  {imageUrl && (
                    <div className="min-w-full">
                      <div className="rounded-xl overflow-hidden bg-gray-50">
                        <img
                          src={imageUrl}
                          alt="Dream visualization"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Slide 2: Narrative */}
                  <div className="min-w-full">
                    <div className="bg-purple-50 rounded-xl p-6 min-h-[300px] flex items-center">
                      <div className="prose prose-lg max-w-none w-full">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {narrative}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Indicator */}
              {imageUrl && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentSlide(0)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentSlide === 0 ? "bg-purple-600 w-8" : "bg-gray-300"
                    }`}
                  />
                  <button
                    onClick={() => setCurrentSlide(1)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentSlide === 1 ? "bg-purple-600 w-8" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Padding for Safe Area */}
        <div
          className="pb-8"
          style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        ></div>
      </div>
    </div>
  );
}
