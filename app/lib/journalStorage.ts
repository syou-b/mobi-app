// 날짜별 저널 관리를 위한 유틸리티 함수들

export interface JournalEntry {
  date: string;
  sleepData: {
    date: string;
    samples: any[];
    inBed: any;
    asleep: any;
    deepMinutes: number;
    remMinutes: number;
    coreMinutes: number;
    awakeMinutes: number;
  };
  initialDream?: string;
  answers?: any[];
  narrative?: string;
  image?: string;
  sleepAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

const JOURNALS_KEY = "dreamJournals";
const CURRENT_DATE_KEY = "currentJournalDate";

// 모든 저널 가져오기
export const getAllJournals = (): { [date: string]: JournalEntry } => {
  try {
    const data = localStorage.getItem(JOURNALS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error loading journals:", error);
    return {};
  }
};

// 특정 날짜 저널 가져오기
export const getJournal = (date: string): JournalEntry | null => {
  const journals = getAllJournals();
  return journals[date] || null;
};

// 현재 작업 중인 날짜 가져오기
export const getCurrentJournalDate = (): string | null => {
  return localStorage.getItem(CURRENT_DATE_KEY);
};

// 현재 작업 중인 날짜 설정
export const setCurrentJournalDate = (date: string): void => {
  localStorage.setItem(CURRENT_DATE_KEY, date);
};

// 저널 저장/업데이트
export const saveJournal = (
  date: string,
  data: Partial<JournalEntry>
): void => {
  const journals = getAllJournals();
  const existing = journals[date] || {
    date,
    createdAt: new Date().toISOString(),
  };

  journals[date] = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  } as JournalEntry;

  localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
};

// 저널 삭제
export const deleteJournal = (date: string): void => {
  const journals = getAllJournals();
  delete journals[date];
  localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
};

// 저널이 존재하는지 확인
export const hasJournal = (date: string): boolean => {
  const journal = getJournal(date);
  return !!journal?.narrative; // narrative가 있으면 완성된 저널로 간주
};

// 저널이 있는 모든 날짜 가져오기
export const getJournalDates = (): string[] => {
  const journals = getAllJournals();
  return Object.keys(journals).filter((date) => hasJournal(date));
};

// 현재 저널의 특정 필드 업데이트
export const updateCurrentJournal = (data: Partial<JournalEntry>): void => {
  const date = getCurrentJournalDate();
  if (!date) {
    console.error("No current journal date set");
    return;
  }
  saveJournal(date, data);
};

// 현재 저널 가져오기
export const getCurrentJournal = (): JournalEntry | null => {
  const date = getCurrentJournalDate();
  if (!date) return null;
  return getJournal(date);
};
