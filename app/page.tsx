"use client";

import { useState, useEffect } from "react";
import { HealthKitSleep, type SleepSample } from "capacitor-healthkit-sleep";

export default function Home() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sleepData, setSleepData] = useState<SleepSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // HealthKit은 iOS에서만 사용 가능
    setIsAvailable(true); // 일단 true로 설정
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Requesting authorization...");
      const result = await HealthKitSleep.requestAuthorization();
      console.log("Authorization result:", result);

      // granted와 authorized 둘 다 처리
      const isAuthorized =
        (result as any).granted || result.authorized || false;
      setIsAuthorized(isAuthorized);

      if (isAuthorized) {
        alert("✅ 권한이 승인되었습니다!");
      } else {
        setError("권한이 거부되었습니다. 설정에서 권한을 허용해주세요.");
      }
    } catch (err: any) {
      setError(`권한 요청 실패: ${err.message || JSON.stringify(err)}`);
      console.error("Authorization failed:", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchSleepData = async (days: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await HealthKitSleep.readSleepSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      console.log("Received data:", result);

      setSleepData(result.samples || []);

      if ((result.samples || []).length === 0) {
        setError("선택한 기간에 수면 데이터가 없습니다.");
      }
    } catch (err: any) {
      setError(`데이터 조회 실패: ${err.message || err}`);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSleepEmoji = (value: string) => {
    switch (value) {
      case "asleep":
      case "asleepUnspecified":
        return "😴";
      case "inBed":
        return "🛏️";
      case "awake":
        return "😳";
      case "core":
        return "💤";
      case "deep":
        return "🌙";
      case "rem":
        return "💭";
      default:
        return "😴";
    }
  };

  const getSleepLabel = (value: string) => {
    switch (value) {
      case "asleep":
      case "asleepUnspecified":
        return "수면";
      case "inBed":
        return "침대에 있음";
      case "awake":
        return "깨어있음";
      case "core":
        return "코어 수면";
      case "deep":
        return "깊은 수면";
      case "rem":
        return "REM 수면";
      default:
        return value;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  };

  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">HealthKit 사용 불가</h1>
          <p className="text-gray-600">
            이 기능은 iOS 기기에서만 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-4">😴</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            수면 데이터 분석
          </h1>
          <p className="text-gray-600">
            Apple Health에서 수면 데이터를 가져옵니다
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="space-y-3">
            {!isAuthorized && (
              <button
                onClick={requestPermission}
                disabled={loading}
                className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "처리 중..." : "🔐 권한 요청하기"}
              </button>
            )}

            {isAuthorized && (
              <div className="space-y-2">
                <button
                  onClick={() => fetchSleepData(7)}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "로딩 중..." : "📊 최근 7일 데이터 가져오기"}
                </button>

                <button
                  onClick={() => fetchSleepData(30)}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "로딩 중..." : "📅 최근 30일 데이터 가져오기"}
                </button>
              </div>
            )}
          </div>

          {isAuthorized && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 text-center">
                ✅ 권한이 승인되었습니다
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Sleep Data List */}
        {sleepData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              수면 기록 ({sleepData.length}개)
            </h2>

            <div className="space-y-3">
              {sleepData.map((sample, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {getSleepEmoji(sample.value.toString())}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {getSleepLabel(sample.value.toString())}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(sample.startDate)} ~{" "}
                          {formatDate(sample.endDate)}
                        </div>
                        <div className="text-sm font-medium text-blue-600 mt-1">
                          {calculateDuration(sample.startDate, sample.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400">
                      출처: {sample.sourceName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sleepData.length === 0 && !loading && !error && isAuthorized && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🌙</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              아직 데이터가 없습니다
            </h3>
            <p className="text-gray-500">
              버튼을 눌러 수면 데이터를 가져오세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
