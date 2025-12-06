"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HealthKitSleep, type SleepSample } from "capacitor-healthkit-sleep";
import testData from "./testData.json";

export default function Home() {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sleepData, setSleepData] = useState<SleepSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [hasJournal, setHasJournal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // 오늘 저널이 있는지 확인
    const checkJournal = () => {
      const narrative = localStorage.getItem("dreamNarrative");
      setHasJournal(!!narrative);
    };

    checkJournal();
  }, []);

  useEffect(() => {
    // 앱 시작 시 자동으로 권한 요청
    const initializeHealthKit = async () => {
      setIsAvailable(true);
      setLoading(true);

      try {
        console.log("Requesting authorization...");
        const result = await HealthKitSleep.requestAuthorization();
        console.log("Authorization result:", result);

        const isAuthorized =
          (result as any).granted || result.authorized || false;
        setIsAuthorized(isAuthorized);

        if (!isAuthorized) {
          setError("권한이 거부되었습니다. 설정에서 권한을 허용해주세요.");
        }
      } catch (err: any) {
        setError(`권한 요청 실패: ${err.message || JSON.stringify(err)}`);
        console.error("Authorization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeHealthKit();
  }, []);

  const loadTestData = () => {
    setLoading(true);
    setError(null);

    try {
      // testData.json의 구조가 { samples: [...] } 형태
      const samples = (testData as any).samples || testData;
      setSleepData(samples as SleepSample[]);
      setUseTestData(true);
      console.log("Test data loaded:", samples.length, "samples");
    } catch (err: any) {
      setError(`테스트 데이터 로드 실패: ${err.message || err}`);
      console.error("Test data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSleepData = async (days: number = 365) => {
    setLoading(true);
    setError(null);
    setUseTestData(false);

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
        setError(`선택한 기간(${days}일)에 수면 데이터가 없습니다.`);
      }
    } catch (err: any) {
      setError(`데이터 조회 실패: ${err.message || err}`);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  };

  // 날짜별로 수면 데이터 그룹화 (inBed 기준)
  const groupByDate = (samples: SleepSample[]) => {
    // 로컬 날짜 문자열 추출 함수 (YYYY-MM-DD)
    const getLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // 1. 먼저 inBed 데이터들을 찾아서 날짜별로 그룹화
    const inBedSamples = samples.filter((s) => s.categoryType === "inBed");
    const dateRanges: { [key: string]: { start: Date; end: Date } } = {};

    inBedSamples.forEach((sample) => {
      const startDate = new Date(sample.startDate);
      const endDate = new Date(sample.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn("Invalid date found in inBed:", sample);
        return;
      }

      const dateKey = getLocalDateKey(startDate);
      dateRanges[dateKey] = { start: startDate, end: endDate };
    });

    // 2. 모든 샘플을 해당하는 inBed 날짜 범위에 매칭
    const grouped: { [key: string]: SleepSample[] } = {};

    samples.forEach((sample) => {
      const sampleStart = new Date(sample.startDate);
      const sampleEnd = new Date(sample.endDate);

      if (isNaN(sampleStart.getTime()) || isNaN(sampleEnd.getTime())) {
        return;
      }

      // 각 날짜 범위와 비교해서 겹치는 범위 찾기
      for (const [dateKey, range] of Object.entries(dateRanges)) {
        // 샘플이 해당 inBed 범위와 겹치는지 확인
        if (sampleStart <= range.end && sampleEnd >= range.start) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(sample);
          break; // 하나의 날짜에만 속하도록
        }
      }
    });

    // 날짜 내림차순 정렬 (최신이 위로)
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const groupedSleepData = groupByDate(sleepData);

  // 오늘의 수면 = 어젯밤에 잔 수면 (어제 날짜로 분류됨)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const todayData = groupedSleepData.find(([date]) => date === todayKey);
  const otherDays = groupedSleepData.filter(([date]) => date !== todayKey);

  // 수면 카드 렌더링 함수
  const renderSleepCard = (
    date: string,
    samples: SleepSample[],
    isToday: boolean = false
  ) => {
    const inBed = samples.find((s) => s.categoryType === "inBed");
    const asleep = samples.find((s) => s.categoryType === "asleep");
    const core = samples.filter((s) => s.categoryType === "core");
    const deep = samples.filter((s) => s.categoryType === "deep");
    const rem = samples.filter((s) => s.categoryType === "rem");
    const awake = samples.filter((s) => s.categoryType === "awake");

    // 총 시간 계산
    const calcTotalMinutes = (items: SleepSample[]) => {
      return items.reduce((total, item) => {
        const start = new Date(item.startDate).getTime();
        const end = new Date(item.endDate).getTime();
        return total + (end - start) / (1000 * 60);
      }, 0);
    };

    const formatMinutes = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}시간 ${mins}분`;
    };

    const deepMinutes = calcTotalMinutes(deep);
    const remMinutes = calcTotalMinutes(rem);

    // 꿈 기록 시작 함수
    const handleStartDreamRecording = () => {
      // 오늘의 수면 데이터를 localStorage에 저장
      const sleepContext = {
        date,
        samples,
        inBed,
        asleep,
        deepMinutes,
        remMinutes,
        coreMinutes: calcTotalMinutes(core),
        awakeMinutes: calcTotalMinutes(awake),
      };

      localStorage.setItem("todaySleepData", JSON.stringify(sleepContext));
      router.push("/dream-recording");
    };

    if (!inBed) return null;

    const bedStart = new Date(inBed.startDate).getTime();
    const bedEnd = new Date(inBed.endDate).getTime();
    const totalDuration = bedEnd - bedStart;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    return (
      <div
        className={`bg-white rounded-2xl shadow-lg p-6 ${isToday ? "ring-2 ring-blue-400" : ""}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            📅 {formatDateHeader(date)}
          </h3>
          {isToday && (
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
              오늘
            </span>
          )}
        </div>

        {/* 타임라인 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(new Date(inBed.startDate))}</span>
            <span>{formatTime(new Date(inBed.endDate))}</span>
          </div>
          <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
            {[...deep, ...core, ...rem, ...awake].map((stage, idx) => {
              const stageStart = new Date(stage.startDate).getTime();
              const stageEnd = new Date(stage.endDate).getTime();
              const left = ((stageStart - bedStart) / totalDuration) * 100;
              const width = ((stageEnd - stageStart) / totalDuration) * 100;

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

          {/* 범례 */}
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

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">🛏️ 침대</div>
            <div className="text-lg font-semibold text-gray-800">
              {calculateDuration(inBed.startDate, inBed.endDate)}
            </div>
          </div>
          {asleep && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">😴 수면</div>
              <div className="text-lg font-semibold text-blue-600">
                {calculateDuration(asleep.startDate, asleep.endDate)}
              </div>
            </div>
          )}
          {deepMinutes > 0 && (
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">🌙 깊은 수면</div>
              <div className="text-lg font-semibold text-indigo-600">
                {formatMinutes(deepMinutes)}
              </div>
            </div>
          )}
          {remMinutes > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">💭 REM</div>
              <div className="text-lg font-semibold text-purple-600">
                {formatMinutes(remMinutes)}
              </div>
            </div>
          )}
        </div>

        {/* 꿈 기록하기 버튼 - 오늘 수면에만 표시 */}
        {isToday && (
          <button
            onClick={
              hasJournal
                ? () => router.push("/dream-journal")
                : handleStartDreamRecording
            }
            className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-xl">{hasJournal ? "📖" : "💭"}</span>
            <span>{hasJournal ? "저널 보기" : "꿈 기록하기"}</span>
          </button>
        )}
      </div>
    );
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
          {isAuthorized && (
            <div className="space-y-3">
              <button
                onClick={() => fetchSleepData(7)}
                disabled={loading}
                className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "로딩 중..." : "일주일 데이터 가져오기"}
              </button>

              <button
                onClick={loadTestData}
                disabled={loading}
                className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "로딩 중..." : "테스트 데이터 가져오기 (7일)"}
              </button>
            </div>
          )}

          {isAuthorized ? (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 text-center">
                ✅ 권한이 승인되었습니다
              </p>
            </div>
          ) : loading ? (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                🔄 권한을 요청하는 중...
              </p>
            </div>
          ) : null}

          {useTestData && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 text-center">
                🧪 테스트 데이터를 사용 중입니다
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

        {/* Sleep Data */}
        {sleepData.length > 0 && (
          <div className="space-y-6">
            {/* 오늘의 수면 */}
            {todayData && (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    ✨ Today's Sleep
                  </h2>
                </div>
                {renderSleepCard(todayData[0], todayData[1], true)}
              </div>
            )}

            {/* 이전 기록 - Accordion */}
            {otherDays.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      📊 Sleep History
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {otherDays.length}일간의 기록
                    </p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${isHistoryOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isHistoryOpen && (
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                    <div className="pt-4"></div>
                    {otherDays.map(([date, samples]) => (
                      <div key={date}>
                        {renderSleepCard(date, samples, false)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 오늘 데이터가 없을 때 */}
            {!todayData && groupedSleepData.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    📊 Sleep History
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {groupedSleepData.length}일간의 기록
                  </p>
                </div>
                <div className="space-y-4">
                  {groupedSleepData.map(([date, samples]) => (
                    <div key={date}>
                      {renderSleepCard(date, samples, false)}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
