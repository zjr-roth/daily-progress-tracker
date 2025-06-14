// src/lib/types.ts
export interface Task {
    id: string;
    name: string;
    time: string;
    category: TaskCategory;
    duration: number;
    block: TimeBlock;
  }

  export type TaskCategory = 'Study' | 'Research' | 'Personal' | 'Dog Care';
  export type TimeBlock = 'morning' | 'afternoon' | 'evening';

  export interface DayProgress {
    completionPercentage: number;
    incompleteTasks: string[];
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