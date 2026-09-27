import { ThithiInfo } from './constants';

export interface Bird {
  key: string;
  name: string; // English: Vulture, Owl, Crow, Cock, Peacock
  icon: string;
  element: string;
  tamil?: string;
  sanskrit?: string;
}

export interface Nakshatra {
  id: number;
  name: string;
  tanglish?: string;
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
  thithiId: number;
  thithiName: string; // Tanglish
  thithiTamil?: string;
  dayOfWeek: string; // English
  dayOfWeekTamil?: string;
}

export interface ThithiSegment {
  thithiId: number;
  thithi: ThithiInfo;
  startMins: number;
  endMins: number;
  durationMins: number;
  percent: string;
  startTimeStr: string;
  endTimeStr: string;
}

export interface DayThithiAnalysis {
  segments: ThithiSegment[];
  primary: ThithiSegment;
  secondary?: ThithiSegment;
  hasTwoThithis: boolean;
  transitionTimeStr?: string;
  summaryText: string;
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
  thithiName?: string;
  thithiTamil?: string;
  dayOfWeek?: string;
  dayOfWeekTamil?: string;
  startTimeStr?: string;
  endTimeStr?: string;
  thithiAnalysis?: DayThithiAnalysis;
}

export interface BulkDataRow {
  name: string;
  date: string;
  city?: string;
  timezone?: string;
  analysis?: DaySegment[];
  thithiAnalysis?: DayThithiAnalysis;
  mainBird?: string;
  mainPercent?: string;
  mainNakshatra?: string;
  mainRasi?: string;
  dayOfWeek?: string;
  dayOfWeekTamil?: string;
  mainThithi?: string;
  mainThithiTamil?: string;
  secondaryThithi?: string;
  secondaryThithiTamil?: string;
  thithiTransition?: string;
  paksha?: string;
  secondary?: string;
  error?: string;
  resolvedTimezone?: number;
}

export type InputMethod = 'date' | 'manual' | 'bulk';