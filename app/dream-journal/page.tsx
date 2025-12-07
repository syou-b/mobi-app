"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentJournal, updateCurrentJournal } from "../lib/journalStorage";
import { SleepTimeline, SleepStats } from "../components/SleepTimeline";

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
    // 현재 저널 로드
    const journal = getCurrentJournal();

    if (
      !journal ||
      !journal.sleepData ||
      !journal.narrative ||
      !journal.initialDream
    ) {
      alert("데이터를 불러올 수 없습니다.");
      router.push("/");
      return;
    }

    setSleepData(journal.sleepData);
    setNarrative(journal.narrative);
    setImageUrl(journal.image || ""); // 이미지 없을 수 있음 (localStorage 용량 이슈)
    setInitialDream(journal.initialDream);

    // 저장된 분석이 있으면 사용, 없으면 생성
    if (journal.sleepAnalysis) {
      setSleepAnalysis(journal.sleepAnalysis);
      setIsGeneratingAnalysis(false);
    } else {
      generateSleepAnalysis(journal.sleepData, journal.narrative);
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

      // 현재 저널에 저장
      updateCurrentJournal({ sleepAnalysis: data.analysis });
    } catch (error) {
      console.error("Error generating analysis:", error);

      // Quota 초과 시 기본 분석 제공
      const fallbackAnalysis = `오늘 밤 총 ${Math.round(((sleepContext.deepMinutes + sleepContext.remMinutes + sleepContext.coreMinutes) / 60) * 10) / 10}시간의 수면을 취하셨네요. 깊은 수면은 ${Math.round(sleepContext.deepMinutes)}분, REM 수면은 ${Math.round(sleepContext.remMinutes)}분이었습니다. 충분한 휴식을 취하셨기를 바랍니다.`;

      setSleepAnalysis(fallbackAnalysis);
      updateCurrentJournal({ sleepAnalysis: fallbackAnalysis });
    } finally {
      setIsGeneratingAnalysis(false);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button - iOS Safe Area */}
        <div
          className="pb-4 px-4 sticky top-0 bg-gradient-to-b from-purple-50 to-transparent z-10"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="pt-8">
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Dream Journal
              </h1>
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
                <SleepTimeline
                  inBed={sleepData.inBed}
                  samples={sleepData.samples}
                  showLegend={true}
                />

                {/* Summary Stats */}
                <SleepStats
                  deepMinutes={sleepData.deepMinutes}
                  coreMinutes={sleepData.coreMinutes}
                  remMinutes={sleepData.remMinutes}
                  inBed={sleepData.inBed}
                />
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
