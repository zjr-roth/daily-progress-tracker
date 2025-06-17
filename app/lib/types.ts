export interface Task {
  id: string;
  name: string;
  time: string;
  category: string;
  duration: number;
  block: TimeBlock;
}

export type TaskCategory = string; // Now dynamic from database
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

export interface DayProgress {
  completionPercentage: number;
  incompleteTasks: string[];
  incompleteTaskIds?: string[];
}

export interface ProgressData {
  [date: string]: DayProgress;
}

export interface CategoryStats {
  [category: string]: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  perfectStreak: number;
  totalDays: number;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  name: string;
  time_start: string;
  time_end: string;
  category_id: string | null;
  duration: number;
  time_block: TimeBlock;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    bg_color: string;
    text_color: string;
  };
}

export interface Commitment {
  id: string;
  taskName: string;
  duration: number;
  preferredTime: string;
  days: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  priority: number;
}

export interface SleepPreferences {
  wakeUpTime: string;
  bedTime: string;
  sleepDuration: number;
}

export interface WorkPreferences {
  workType: string;
  peakHours: string[];
  breakPreference: string;
  focusBlocks: number;
}

export interface MealPreferences {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface UserPreferences {
  commitments: Commitment[];
  goals: Goal[];
  customGoals: string;
  sleepSchedule: SleepPreferences;
  workPreferences: WorkPreferences;
  mealTimes: MealPreferences;
}

export interface TimeSlot {
  id: string;
  time: string;
  activity: string;
  description: string;
  category: string;
  duration: number;
  isCommitment: boolean;
  commitmentId?: string;
}

export interface Schedule {
  timeSlots: TimeSlot[];
  summary: string;
  optimizationReasoning: string;
  confidence: number;
}