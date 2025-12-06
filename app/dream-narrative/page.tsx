"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    // localStorage에서 데이터 로드
    const dreamText = localStorage.getItem("initialDream");
    const questionsStr = localStorage.getItem("dreamAnswers");

    if (!dreamText || !questionsStr) {
      alert("데이터를 불러올 수 없습니다.");
      router.push("/");
      return;
    }

    const questions: Question[] = JSON.parse(questionsStr);
    setInitialDream(dreamText);
    setAnswers(questions);

    // 서사 생성
    generateNarrative(dreamText, questions);
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

  const handleSave = () => {
    // 편집된 내용을 최종 narrative로 저장
    const finalNarrative = isEditing ? editedNarrative : narrative;
    localStorage.setItem("dreamNarrative", finalNarrative);
    console.log("Narrative saved:", finalNarrative);

    // TODO: 이미지 생성 단계로 이동
    // 임시로 홈으로
    router.push("/");
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
      setImageUrl(data.imageUrl);
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
    localStorage.setItem("dreamNarrative", finalNarrative);
    if (imageUrl) {
      localStorage.setItem("dreamImage", imageUrl);
    }

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📖</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              당신의 꿈 이야기
            </h1>
            <p className="text-gray-600">
              AI가 당신의 답변을 바탕으로 만든 서사입니다
            </p>
          </div>
        </div>

        {/* Narrative Display */}
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

        {/* Image Generation Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🖼️</span>
            <span>꿈 이미지</span>
          </h3>

          {imageUrl ? (
            <div>
              <div className="relative rounded-xl overflow-hidden mb-4">
                <img
                  src={imageUrl}
                  alt="Dream visualization"
                  className="w-full h-auto"
                />
              </div>
              <button
                onClick={generateImage}
                disabled={isGeneratingImage}
                className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isGeneratingImage ? "생성 중..." : "다시 생성하기"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                서사를 바탕으로 꿈의 이미지를 생성합니다
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

        {/* Original Content Reference */}
        <div className="bg-purple-50 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            원본 내용 참고
          </h3>

          <div className="mb-4">
            <div className="text-xs font-semibold text-purple-800 mb-1">
              처음 기록한 꿈:
            </div>
            <p className="text-sm text-purple-700 italic">"{initialDream}"</p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-purple-800 mb-2">
              추가 답변:
            </div>
            {answers.map(
              (q, idx) =>
                q.answer && (
                  <div key={idx} className="text-sm text-purple-700">
                    <span className="font-medium">Q{idx + 1}:</span> {q.answer}
                  </div>
                )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          {imageUrl ? (
            <button
              onClick={handleCompleteJournal}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              저널 완성하기 ✨
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 px-6 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed"
            >
              이미지를 생성해주세요
            </button>
          )}

          <button
            onClick={() => {
              const confirmed = confirm("서사를 다시 생성하시겠습니까?");
              if (confirmed) {
                generateNarrative(initialDream, answers);
              }
            }}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            서사 다시 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
