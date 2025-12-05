"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Health } from "@capgo/capacitor-health";

type LocationState = {
  lat: number;
  lng: number;
} | null;

export default function Home() {
  const [healthData, setHealthData] = useState<unknown>(null);
  const [location, setLocation] = useState<LocationState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // 웹 브라우저(Next dev/웹 빌드)에서는 Capacitor 플러그인이 동작하지 않으므로 무시
      if (!Capacitor.isNativePlatform()) {
        setError(
          "네이티브 앱(아이폰)에서 실행했을 때만 헬스/위치 데이터를 불러올 수 있어요."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("[mobi] load start");

        // 0. 위치 권한 먼저 요청 + 현재 위치 한 번 가져오기
        console.log("[mobi] request location permissions");
        const locPerms = await Geolocation.requestPermissions();
        console.log("[mobi] location permissions result", locPerms);

        console.log("[mobi] get current position");
        const currentPosition = await Geolocation.getCurrentPosition();
        console.log("[mobi] current position", currentPosition);

        setLocation({
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        });

        // 1. 오늘 날짜 범위 계산 (자정 ~ 다음날 자정)
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // 2. 헬스 권한 요청 + 오늘 헬스 데이터 불러오기
        //    읽고 싶은 타입은 필요에 따라 수정(예: "steps", "heart_rate" 등)
        console.log("[mobi] request health permissions");
        await Health.requestAuthorization({
          read: ["steps"],
        });
        console.log("[mobi] health permissions granted");

        // 플러그인 버전에 따라 메서드/파라미터가 다를 수 있으니,
        // 실제 리턴 구조는 console.log로 확인해서 필요하면 가공하세요.
        console.log("[mobi] read today health samples");
        const todayHealth = await Health.readSamples({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          dataType: "steps",
          limit: 1000,
        });
        console.log("[mobi] today health result", todayHealth);

        setHealthData(todayHealth);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "헬스/위치 데이터를 불러오는 중 오류가 발생했어요."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-16 bg-white text-black dark:bg-zinc-900 dark:text-zinc-50">
        <h1 className="text-2xl font-semibold">오늘 헬스 & 위치 데이터</h1>

        {loading && <p className="text-zinc-500">데이터 불러오는 중...</p>}

        {!loading && error && (
          <p className="text-sm text-red-500 whitespace-pre-line">{error}</p>
        )}

        {!loading && !error && (
          <>
            <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-2 text-base font-medium">오늘 헬스 데이터</h2>
              <p className="mb-1 text-xs text-zinc-500">
                실제 구조는 콘솔에서 확인 후 필요한 값만 뽑아서 사용하세요.
              </p>
              <pre className="max-h-64 overflow-auto rounded-md bg-black/80 p-3 text-[11px] text-zinc-100">
                {JSON.stringify(healthData)}
              </pre>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-2 text-base font-medium">현재 위치</h2>
              {location ? (
                <div className="space-y-1">
                  <p>위도: {location.lat}</p>
                  <p>경도: {location.lng}</p>
                </div>
              ) : (
                <p className="text-zinc-500">위치 정보를 가져오지 못했어요.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
