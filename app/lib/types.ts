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

  export interface UsersData {
    id: string;
    created_at: string;
    updated_at: string;
    email: string;
    full_name: string;
  }

  export interface DailyData {
    id: string;
    user_id: string;
    date: string;
    tasks: any[];
    schedule_items: any[];
    progress_metrics: Record<string, any>;
    completion_status: Record<string, any>;
    completion_percentage: number;
    incomplete_tasks: string[];
    created_at: string;
    updated_at: string;
  }