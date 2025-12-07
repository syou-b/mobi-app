import React from "react";

interface SleepSample {
  categoryType: string;
  startDate: string;
  endDate: string;
}

interface SleepTimelineProps {
  inBed: SleepSample;
  samples: SleepSample[];
  showLegend?: boolean;
}

interface SleepStatsProps {
  deepMinutes: number;
  coreMinutes: number;
  remMinutes: number;
  inBed: SleepSample;
}

export const SleepTimeline: React.FC<SleepTimelineProps> = ({
  inBed,
  samples,
  showLegend = true,
}) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const bedStart = new Date(inBed.startDate).getTime();
  const bedEnd = new Date(inBed.endDate).getTime();
  const totalDuration = bedEnd - bedStart;

  const sleepStages = samples.filter((s) =>
    ["deep", "core", "rem", "awake"].includes(s.categoryType)
  );

  const colorMap: { [key: string]: string } = {
    deep: "bg-indigo-600",
    core: "bg-blue-400",
    rem: "bg-purple-400",
    awake: "bg-orange-300",
  };

  return (
    <div className="space-y-3">
      {/* Time Labels */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTime(inBed.startDate)}</span>
        <span>{formatTime(inBed.endDate)}</span>
      </div>

      {/* Timeline Bar */}
      <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
        {sleepStages.map((stage, idx) => {
          const stageStart = new Date(stage.startDate).getTime();
          const stageEnd = new Date(stage.endDate).getTime();
          const left = ((stageStart - bedStart) / totalDuration) * 100;
          const width = ((stageEnd - stageStart) / totalDuration) * 100;

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
      {showLegend && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span className="text-gray-600">침대</span>
          </div>
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
        </div>
      )}
    </div>
  );
};

export const SleepStats: React.FC<SleepStatsProps> = ({
  deepMinutes,
  coreMinutes,
  remMinutes,
  inBed,
}) => {
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}시간 ${mins}분`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">🛏️ 침대</div>
        <div className="text-lg font-semibold text-gray-600">
          {formatTime(inBed.startDate)} ~ {formatTime(inBed.endDate)}
        </div>
      </div>
      <div className="bg-indigo-50 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">🌙 깊은 수면</div>
        <div className="text-lg font-semibold text-indigo-600">
          {formatMinutes(deepMinutes)}
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">💙 코어 수면</div>
        <div className="text-lg font-semibold text-blue-600">
          {formatMinutes(coreMinutes)}
        </div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">💭 REM</div>
        <div className="text-lg font-semibold text-purple-600">
          {formatMinutes(remMinutes)}
        </div>
      </div>
    </div>
  );
};
