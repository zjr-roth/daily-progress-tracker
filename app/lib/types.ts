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

export interface TimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  time_block: TimeBlock;
}