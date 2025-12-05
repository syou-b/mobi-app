declare module "capacitor-healthkit-sleep" {
  export interface HealthKitSleepPlugin {
    requestAuthorization(): Promise<{
      authorized?: boolean;
      granted?: boolean;
    }>; // 둘 다 추가
    readSleepSamples(options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }): Promise<{ samples: SleepSample[] }>;
  }

  export interface SleepSample {
    startDate: string;
    endDate: string;
    value: number;
    categoryType: string;
    sourceName: string;
    sourceId: string;
  }

  export const HealthKitSleep: HealthKitSleepPlugin;
}
