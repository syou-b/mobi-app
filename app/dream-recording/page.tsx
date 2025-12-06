"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    // localStorage에 꿈 텍스트도 저장 (guidance 페이지에서 사용)
    localStorage.setItem("initialDream", dreamText);

    // LLM 가이드 질문 페이지로 이동
    router.push("/dream-guidance");
  };

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

          <div className="text-center">
            <div className="text-6xl mb-4">💭</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              꿈 기록하기
            </h1>
            <p className="text-gray-600">기억나는 꿈을 자유롭게 적어보세요</p>
          </div>
        </div>

        {/* Dream Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              어떤 꿈을 꾸었나요?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              💡 키워드나 단편적인 장면도 좋아요. 나중에 더 자세히 작성할 수
              있어요!
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

        {/* Tips */}
        <div className="bg-purple-50 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>꿈을 더 잘 기억하는 팁</span>
          </h3>
          <ul className="text-xs text-purple-800 space-y-1">
            <li>• 눈을 뜨자마자 즉시 기록하세요</li>
            <li>• 순서가 뒤죽박죽이어도 괜찮아요</li>
            <li>• 감정, 색깔, 소리 등도 중요한 단서예요</li>
            <li>• "왜?"라고 묻지 말고 "무엇?"을 적어보세요</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          <button
            onClick={handleNext}
            disabled={!dreamText.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계로 →
          </button>

          <button
            onClick={() => router.back()}
            className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            나중에 작성하기
          </button>
        </div>
      </div>
    </div>
  );
}
