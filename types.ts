export interface Bird {
  key: string;
  name: string;
  tamil: string;
  sanskrit: string;
  icon: string;
  element: string;
}

export interface Nakshatra {
  id: number;
  name: string;
  tamil?: string;
  rasiIds: number[];
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  timezone: number;
}

export interface CalculationResult {
  nakshatraId: number;
  rasiId: number;
  paksha: 'shukla' | 'krishna';
  elongation: string;
  moonDeg: string;
}

export interface DaySegment {
  startMins: number;
  endMins: number;
  nakshatraId: number;
  rasiId?: number;
  paksha: 'shukla' | 'krishna';
  duration?: number;
  percent?: string;
  bird?: Bird;
  nakshatraName?: string;
  rasiName?: string;
  startTimeStr?: string;
  endTimeStr?: string;
}

export interface BulkDataRow {
  name: string;
  date: string;
  city?: string;
  timezone?: string;
  analysis?: DaySegment[];
  mainBird?: string;
  mainPercent?: string;
  mainNakshatra?: string;
  mainRasi?: string;
  paksha?: string;
  secondary?: string;
  error?: string;
  resolvedTimezone?: number;
}

export type InputMethod = 'date' | 'manual' | 'bulk';