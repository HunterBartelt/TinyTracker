
export type FeedingType = 'bottle' | 'nursing';
export type UnitSystem = 'metric' | 'imperial';

export interface FeedingLog {
  id: string;
  timestamp: number;
  type: FeedingType;
  amountMl?: number; // base unit
  leftMinutes?: number;
  rightMinutes?: number;
  note?: string;
}

export type DiaperType = 'wet' | 'dirty' | 'mixed';

export interface DiaperLog {
  id: string;
  timestamp: number;
  type: DiaperType;
  note?: string;
}

export interface SleepLog {
  id: string;
  startTime: number;
  endTime?: number;
}

export interface GrowthLog {
  id: string;
  timestamp: number;
  weightKg: number; // base unit
}

export interface MedicalLog {
  id: string;
  timestamp: number;
  type: 'immunization' | 'visit';
  title: string;
  note?: string;
}

export interface MilestoneLog {
  id: string;
  timestamp: number;
  title: string;
}

export interface UserSettings {
  unitSystem: UnitSystem;
  syncEmail?: string;
  syncId?: string;
}

export interface BabyData {
  feedings: FeedingLog[];
  diapers: DiaperLog[];
  sleep: SleepLog[];
  growth: GrowthLog[];
  medical: MedicalLog[];
  milestones: MilestoneLog[];
  settings: UserSettings;
}
