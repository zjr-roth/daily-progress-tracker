// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProgressData, Task, CategoryStats, StreakData } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function calculateCategoryStats(
  tasks: Task[],
  incompleteTasks: string[]
): CategoryStats {
  const categories = ['Study', 'Research', 'Personal', 'Dog Care'];
  const categoryData: CategoryStats = {};

  categories.forEach(category => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const completedCategoryTasks = categoryTasks.filter(
      t => !incompleteTasks.includes(t.name)
    );

    categoryData[category] = {
      completed: completedCategoryTasks.length,
      total: categoryTasks.length,
      percentage: categoryTasks.length > 0
        ? Math.round((completedCategoryTasks.length / categoryTasks.length) * 100)
        : 0
    };
  });

  return categoryData;
}

export function calculateStreakData(progressData: ProgressData): StreakData {
  const dates = Object.keys(progressData).sort();

  if (dates.length === 0) {
    return { currentStreak: 0, maxStreak: 0, perfectStreak: 0, totalDays: 0 };
  }

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let perfectStreak = 0;

  // Calculate current streak (consecutive days ≥80%)
  for (let i = dates.length - 1; i >= 0; i--) {
    const percentage = progressData[dates[i]].completionPercentage;
    if (percentage >= 80) {
      tempStreak++;
      if (i === dates.length - 1) {
        currentStreak = tempStreak;
      }
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 0;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);

  // Perfect day streak
  for (let i = dates.length - 1; i >= 0; i--) {
    if (progressData[dates[i]].completionPercentage === 100) {
      perfectStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    maxStreak,
    perfectStreak,
    totalDays: dates.length
  };
}

export function exportToCSV(progressData: ProgressData, tasks: Task[]): void {
  const dates = Object.keys(progressData).sort();
  const csvContent = [
    ['Date', 'Completion Percentage', 'Completed Tasks', 'Incomplete Tasks'].join(','),
    ...dates.map(date => {
      const data = progressData[date];
      const completedCount = tasks.length - data.incompleteTasks.length;
      const incompleteTasksList = data.incompleteTasks.join('; ');
      return [
        date,
        data.completionPercentage,
        completedCount,
        `"${incompleteTasksList}"`
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-progress-data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}