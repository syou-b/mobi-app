"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentJournalDate,
  updateCurrentJournal,
} from "../lib/journalStorage";

export default function DreamRecording() {
  const router = useRouter();
  const [dreamText, setDreamText] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const emotions = [
    { emoji: "😊", label: "행복", value: "happy" },
    { emoji: "😰", label: "불안", value: "anxious" },
    { emoji: "😱", label: "무서움", value: "scary" },
    { emoji: "😢", label: "슬픔", value: "sad" },
    { emoji: "😐", label: "평온", value: "calm" },
    { emoji: "🤔", label: "이상함", value: "weird" },
  ];

  const handleNext = () => {
    if (!dreamText.trim()) {
      alert("꿈 내용을 입력해주세요!");
      return;
    }

    // 현재 저널에 초기 꿈 저장
    updateCurrentJournal({ initialDream: dreamText });

    // LLM 가이드 질문 페이지로 이동
    router.push("/dream-guidance");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button - iOS Safe Area */}
        <div
          className="pb-4 px-4 sticky top-0 bg-gradient-to-b from-purple-50 to-transparent z-10"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="pt-12">
            <button
              onClick={() => router.back()}
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
          <div className="pb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">💭</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                꿈 기록하기
              </h1>
              <p className="text-gray-600">기억나는 꿈을 자유롭게 적어보세요</p>
            </div>
          </div>
        </div>

        {/* Dream Input */}
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                어떤 꿈을 꾸었나요?
              </label>
              <p className="text-xs text-gray-500 mb-3">
                💡 키워드나 단편적인 장면도 좋아요.
              </p>
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="예: 하늘을 날았어요... 친구가 나타났는데... 이상한 건물이..."
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none text-gray-800 placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>

          {/* Emotion Selection - 주석 처리 */}
          {/* <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            꿈의 느낌은 어땠나요?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => setSelectedEmotion(emotion.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedEmotion === emotion.value
                    ? "border-purple-400 bg-purple-50 scale-105"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-3xl mb-1">{emotion.emoji}</div>
                <div className="text-xs text-gray-600">{emotion.label}</div>
              </button>
            ))}
          </div>
        </div> */}

          {/* Action Buttons */}
          <div className="space-y-3 pb-8">
            <button
              onClick={handleNext}
              disabled={!dreamText.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 단계로
            </button>
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
