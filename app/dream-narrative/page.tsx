"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentJournal, updateCurrentJournal } from "../lib/journalStorage";
import { compressImage, getImageSize, formatSize } from "../lib/imageUtils";

interface Question {
  id: number;
  question: string;
  context: string;
  answer: string;
}

export default function DreamNarrative() {
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(true);
  const [narrative, setNarrative] = useState("");
  const [editedNarrative, setEditedNarrative] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [initialDream, setInitialDream] = useState("");
  const [answers, setAnswers] = useState<Question[]>([]);

  // 이미지 생성 관련
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    // 현재 저널 로드
    const journal = getCurrentJournal();

    if (!journal || !journal.initialDream || !journal.answers) {
      alert("데이터를 불러올 수 없습니다.");
      router.push("/");
      return;
    }

    setInitialDream(journal.initialDream);
    setAnswers(journal.answers);

    // 서사 생성
    generateNarrative(journal.initialDream, journal.answers);
  }, []);

  const generateNarrative = async (dream: string, questions: Question[]) => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-narrative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dream, questions }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate narrative");
      }

      const data = await response.json();
      setNarrative(data.narrative);
      setEditedNarrative(data.narrative);
    } catch (error) {
      console.error("Error generating narrative:", error);
      alert("서사 생성 중 오류가 발생했습니다.");
      router.push("/");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedNarrative(narrative);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setNarrative(editedNarrative);
    setIsEditing(false);
  };

  const generateImage = async () => {
    setIsGeneratingImage(true);

    try {
      const finalNarrative = isEditing ? editedNarrative : narrative;

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          narrative: finalNarrative,
          initialDream,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();

      // 이미지 압축
      console.log(
        "Original image size:",
        formatSize(getImageSize(data.imageUrl))
      );
      const compressedImage = await compressImage(data.imageUrl, 800, 800, 0.6);
      console.log(
        "Compressed image size:",
        formatSize(getImageSize(compressedImage))
      );

      setImageUrl(compressedImage);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCompleteJournal = () => {
    // 최종 데이터 저장
    const finalNarrative = isEditing ? editedNarrative : narrative;
    updateCurrentJournal({
      narrative: finalNarrative,
      image: imageUrl || undefined, // 압축된 이미지 저장
    });

    // 최종 저널 페이지로 이동
    router.push("/dream-journal");
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            꿈 이야기를 만들고 있어요...
          </h2>
          <p className="text-gray-600">
            당신의 답변을 하나의 서사로 엮고 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-3xl mx-auto">
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
              <div className="text-6xl mb-4">📖</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Dream Narrative
              </h1>
              <p className="text-gray-600">
                AI가 당신의 답변을 바탕으로 만든 내러티브입니다
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Display */}
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {isEditing ? (
              <div>
                <textarea
                  value={editedNarrative}
                  onChange={(e) => setEditedNarrative(e.target.value)}
                  className="w-full min-h-96 p-4 border-2 border-purple-400 rounded-xl focus:border-purple-500 focus:outline-none resize-y text-gray-800 leading-relaxed"
                  autoFocus
                  onBlur={handleSaveEdit}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    완료
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleEdit}
                className="prose prose-lg max-w-none cursor-text hover:bg-gray-50 transition-colors rounded-lg p-4 -m-4"
              >
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {narrative}
                </div>
                <div className="mt-4 text-sm text-gray-400 italic">
                  클릭하여 수정하기
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Generation Section */}
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span>🖼️</span>
                <span>Image</span>
              </h3>
              {imageUrl && (
                <button
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="다시 생성하기"
                >
                  <svg
                    className={`w-5 h-5 text-gray-600 ${isGeneratingImage ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Dream visualization"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  내러티브를 바탕으로 꿈의 이미지를 생성합니다
                </p>
                <button
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingImage ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                      <span>이미지 생성 중...</span>
                    </span>
                  ) : (
                    "이미지 생성하기"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4">
          <div className="space-y-3 pb-8">
            <button
              onClick={handleCompleteJournal}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              저널 완성하기
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
