// app/lib/utils.ts - Fixed time parsing and validation
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProgressData, Task, CategoryStats, StreakData, DayProgress } from './types';
import { TaskService, FormattedTimeSlot } from './services/taskService';

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

// Updated to work with dynamic tasks from database
export function calculateCategoryStats(
  tasks: Task[],
  dayProgress: DayProgress
): CategoryStats {
  const categoryData: CategoryStats = {};

  // Get unique categories from tasks
  const categories = [...new Set(tasks.map(t => t.category))];

  // Use incompleteTaskIds if available, otherwise fall back to incompleteTasks for backward compatibility
  const incompleteTaskIds = dayProgress.incompleteTaskIds || [];
  const incompleteTasks = dayProgress.incompleteTasks || [];

  categories.forEach(category => {
    const categoryTasks = tasks.filter(t => t.category === category);

    let completedCategoryTasks: Task[];

    if (incompleteTaskIds.length > 0) {
      // Use the new ID-based approach
      completedCategoryTasks = categoryTasks.filter(
        t => !incompleteTaskIds.includes(t.id)
      );
    } else {
      // Fall back to name-based approach for backward compatibility
      completedCategoryTasks = categoryTasks.filter(
        t => !incompleteTasks.includes(t.name)
      );
    }

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
      const completedCount = tasks.length - (data.incompleteTaskIds?.length || data.incompleteTasks.length);
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

// Fixed time parsing function that handles multiple formats
export function parseTimeString(timeString: string): { start: Date, end: Date } {
  // Parse time strings like "9:00-10:00 AM", "9:00 AM-10:00 AM", or "8:00 AM-9:00 AM"
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = timeString.match(timePattern);

  if (!match) {
    throw new Error(`Invalid time format: ${timeString}. Expected format: "8:00 AM-9:00 AM" or "8:00-9:00 AM"`);
  }

  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;

  const start = new Date();
  const end = new Date();

  let startHour24 = parseInt(startHour);
  let endHour24 = parseInt(endHour);

  // Use end period if start period is not provided
  const actualStartPeriod = startPeriod || endPeriod;
  const actualEndPeriod = endPeriod;

  // Convert start time to 24-hour format
  if (actualStartPeriod.toUpperCase() === 'PM' && startHour24 !== 12) {
    startHour24 += 12;
  } else if (actualStartPeriod.toUpperCase() === 'AM' && startHour24 === 12) {
    startHour24 = 0;
  }

  // Convert end time to 24-hour format
  if (actualEndPeriod.toUpperCase() === 'PM' && endHour24 !== 12) {
    endHour24 += 12;
  } else if (actualEndPeriod.toUpperCase() === 'AM' && endHour24 === 12) {
    endHour24 = 0;
  }

  start.setHours(startHour24, parseInt(startMin), 0, 0);
  end.setHours(endHour24, parseInt(endMin), 0, 0);

  return { start, end };
}

export function formatTimeFromDate(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Enhanced conflict detection using database functions
export async function checkTimeConflictWithDatabase(
  userId: string,
  timeString: string,
  duration: number,
  date?: string,
  excludeTaskId?: string
): Promise<{ hasConflict: boolean; suggestions: FormattedTimeSlot[] }> {
  try {
    const { start } = parseTimeString(timeString);
    const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}:00`;
    const endTime = addMinutesToTimeString(startTime, duration);

    // Check availability using database function
    const isAvailable = await TaskService.checkTimeSlotAvailability(
      userId,
      startTime,
      endTime,
      date,
      excludeTaskId
    );

    if (isAvailable) {
      return { hasConflict: false, suggestions: [] };
    }

    // Get suggestions if there's a conflict
    const suggestions = await TaskService.getAvailableTimeSlots(userId, date, duration);

    return {
      hasConflict: true,
      suggestions: suggestions.slice(0, 5) // Top 5 suggestions
    };
  } catch (error) {
    console.error('Error checking time conflict with database:', error);
    return { hasConflict: true, suggestions: [] };
  }
}

// Enhanced smart scheduling suggestions
export async function getSmartSchedulingSuggestions(
  userId: string,
  taskDuration: number,
  taskName: string,
  preferredTimeBlock?: 'morning' | 'afternoon' | 'evening',
  date?: string
): Promise<{
  optimal: FormattedTimeSlot[];
  good: FormattedTimeSlot[];
  fallback: FormattedTimeSlot[];
  insights: string[];
}> {
  try {
    const { recommended, alternatives } = await TaskService.getSmartSchedulingSuggestions(
      userId,
      taskDuration,
      preferredTimeBlock,
      date
    );

    const insights: string[] = [];

    // Generate task-specific insights
    if (taskName.toLowerCase().includes('study') || taskName.toLowerCase().includes('work')) {
      const morningSlots = [...recommended, ...alternatives].filter(s =>
        s.time_block.toLowerCase() === 'morning'
      );
      if (morningSlots.length > 0) {
        insights.push('📈 Morning slots are ideal for focused work and studying');
      }
    }

    if (taskDuration >= 90) {
      const longSlots = [...recommended, ...alternatives].filter(s =>
        parseInt(s.duration.split(' ')[0]) >= taskDuration
      );
      if (longSlots.length > 0) {
        insights.push('⏰ Found slots perfect for this longer task');
      } else {
        insights.push('⚠️ Consider breaking this task into smaller chunks');
      }
    }

    if (recommended.length === 0) {
      insights.push('💡 Your schedule is quite full - consider moving some tasks');
    }

    // Get schedule optimization insights
    const optimization = await TaskService.getScheduleOptimizationInsights(userId, date);
    if (optimization.largestFreeBlock >= taskDuration) {
      insights.push(`✨ You have a ${Math.round(optimization.largestFreeBlock/60)}+ hour free block available`);
    }

    return {
      optimal: recommended.slice(0, 3),
      good: alternatives.slice(0, 3),
      fallback: alternatives.slice(3, 6),
      insights
    };
  } catch (error) {
    console.error('Error getting smart scheduling suggestions:', error);
    return { optimal: [], good: [], fallback: [], insights: [] };
  }
}

// Schedule optimization and analysis
export async function analyzeScheduleHealth(
  userId: string,
  date?: string
): Promise<{
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  timeBlockBalance: Record<string, number>;
}> {
  try {
    const optimization = await TaskService.getScheduleOptimizationInsights(userId, date);
    let score = 70; // Base score
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze schedule balance
    const { morning, afternoon, evening } = optimization.timeBlockUtilization;

    // Check for over-scheduling
    if (morning > 90 || afternoon > 90 || evening > 90) {
      score -= 20;
      issues.push('Some time blocks are over-scheduled');
      recommendations.push('Consider moving tasks to less busy periods');
    }

    // Check for under-utilization
    if (morning < 30 && afternoon < 30) {
      score -= 10;
      issues.push('Day starts slowly - lots of free time in morning/afternoon');
      recommendations.push('Consider scheduling important tasks during peak energy hours');
    }

    // Check for good balance
    if (morning >= 50 && morning <= 80 && afternoon >= 40 && afternoon <= 80) {
      score += 10;
    }

    // Analyze total scheduled time
    const totalWorkingHours = optimization.totalScheduledTime / 60;
    if (totalWorkingHours > 12) {
      score -= 15;
      issues.push('Very long work day scheduled');
      recommendations.push('Consider spreading tasks across multiple days');
    } else if (totalWorkingHours >= 6 && totalWorkingHours <= 10) {
      score += 10;
    }

    // Check for adequate breaks
    if (optimization.largestFreeBlock < 30) {
      score -= 10;
      issues.push('No significant break time scheduled');
      recommendations.push('Schedule at least a 30-minute break for optimal productivity');
    }

    // Bonus for good time management
    if (optimization.suggestions.length === 0) {
      score += 5; // Well-balanced schedule
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations: [...recommendations, ...optimization.suggestions],
      timeBlockBalance: {
        morning: morning,
        afternoon: afternoon,
        evening: evening
      }
    };
  } catch (error) {
    console.error('Error analyzing schedule health:', error);
    return {
      score: 50,
      issues: ['Unable to analyze schedule'],
      recommendations: ['Please check your internet connection and try again'],
      timeBlockBalance: { morning: 0, afternoon: 0, evening: 0 }
    };
  }
}

// Legacy functions for backward compatibility (still useful for client-side validation)
export function checkTimeConflict(
  existingTasks: Task[],
  newTask: { time: string; id?: string }
): boolean {
  try {
    const newTaskTime = parseTimeString(newTask.time);

    for (const task of existingTasks) {
      // Skip checking against the same task (for updates)
      if (newTask.id && task.id === newTask.id) continue;

      const taskTime = parseTimeString(task.time);

      // Check for overlap
      if (
        (newTaskTime.start < taskTime.end && newTaskTime.end > taskTime.start)
      ) {
        return true; // Conflict found
      }
    }

    return false; // No conflict
  } catch (error) {
    console.error('Error checking time conflict:', error);
    return true; // Assume conflict on error for safety
  }
}

export function getAvailableTimeSlots(
  existingTasks: Task[],
  timeBlock: 'morning' | 'afternoon' | 'evening',
  minDuration: number = 30 // minimum duration in minutes
): Array<{ start: string; end: string; duration: number }> {
  const blockRanges = {
    morning: { start: '6:00 AM', end: '12:00 PM' },
    afternoon: { start: '12:00 PM', end: '6:00 PM' },
    evening: { start: '6:00 PM', end: '11:00 PM' }
  };

  const blockRange = blockRanges[timeBlock];
  const blockTasks = existingTasks
    .filter(task => task.block === timeBlock)
    .sort((a, b) => {
      const aTime = parseTimeString(a.time);
      const bTime = parseTimeString(b.time);
      return aTime.start.getTime() - bTime.start.getTime();
    });

  const availableSlots: Array<{ start: string; end: string; duration: number }> = [];

  try {
    const blockStart = parseTimeString(`${blockRange.start}-${blockRange.start}`).start;
    const blockEnd = parseTimeString(`${blockRange.end}-${blockRange.end}`).start;

    let currentTime = new Date(blockStart);

    for (const task of blockTasks) {
      const taskTime = parseTimeString(task.time);

      // Check gap before this task
      if (currentTime < taskTime.start) {
        const gapDuration = (taskTime.start.getTime() - currentTime.getTime()) / (1000 * 60);

        if (gapDuration >= minDuration) {
          availableSlots.push({
            start: formatTimeFromDate(currentTime),
            end: formatTimeFromDate(taskTime.start),
            duration: Math.floor(gapDuration)
          });
        }
      }

      currentTime = new Date(taskTime.end);
    }

    // Check gap after last task
    if (currentTime < blockEnd) {
      const gapDuration = (blockEnd.getTime() - currentTime.getTime()) / (1000 * 60);

      if (gapDuration >= minDuration) {
        availableSlots.push({
          start: formatTimeFromDate(currentTime),
          end: formatTimeFromDate(blockEnd),
          duration: Math.floor(gapDuration)
        });
      }
    }
  } catch (error) {
    console.error('Error calculating available time slots:', error);
  }

  return availableSlots;
}

export function validateTaskTime(
  timeString: string,
  duration: number,
  existingTasks: Task[],
  excludeTaskId?: string
): { isValid: boolean; error?: string } {
  try {
    const timeRange = parseTimeString(timeString);
    const actualDuration = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60);

    // Check if specified duration matches the time range
    if (Math.abs(actualDuration - duration) > 1) { // Allow 1 minute tolerance
      return {
        isValid: false,
        error: `Duration mismatch: time range indicates ${actualDuration} minutes, but duration is set to ${duration} minutes`
      };
    }

    // Check for conflicts with existing tasks
    const tasksToCheck = excludeTaskId
      ? existingTasks.filter(task => task.id !== excludeTaskId)
      : existingTasks;

    const hasConflict = checkTimeConflict(tasksToCheck, { time: timeString });

    if (hasConflict) {
      return {
        isValid: false,
        error: 'This time slot conflicts with an existing task'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid time format: ${timeString}. Expected format: "8:00 AM-9:00 AM"`
    };
  }
}

// Helper function to suggest alternative time slots when there's a conflict
export function suggestAlternativeTimeSlots(
  preferredTime: string,
  duration: number,
  timeBlock: 'morning' | 'afternoon' | 'evening',
  existingTasks: Task[]
): Array<{ start: string; end: string }> {
  const availableSlots = getAvailableTimeSlots(existingTasks, timeBlock, duration);

  return availableSlots
    .filter(slot => slot.duration >= duration)
    .map(slot => {
      const slotStart = parseTimeString(`${slot.start}-${slot.start}`).start;
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      return {
        start: formatTimeFromDate(slotStart),
        end: formatTimeFromDate(slotEnd)
      };
    })
    .slice(0, 3); // Return top 3 suggestions
}

// Enhanced database-powered suggestion function
export async function suggestAlternativeTimeSlotsWithDatabase(
  userId: string,
  duration: number,
  preferredTimeBlock?: 'morning' | 'afternoon' | 'evening',
  date?: string
): Promise<Array<{ start: string; end: string; type: string; recommended: boolean }>> {
  try {
    const suggestions = await TaskService.getSmartSchedulingSuggestions(
      userId,
      duration,
      preferredTimeBlock,
      date
    );

    const alternatives: Array<{ start: string; end: string; type: string; recommended: boolean }> = [];

    // Process recommended slots
    suggestions.recommended.forEach(slot => {
      const [start, end] = slot.time_slot.split(' - ');
      alternatives.push({
        start: start,
        end: end,
        type: slot.availability_type,
        recommended: true
      });
    });

    // Process alternative slots
    suggestions.alternatives.forEach(slot => {
      const [start, end] = slot.time_slot.split(' - ');
      alternatives.push({
        start: start,
        end: end,
        type: slot.availability_type,
        recommended: false
      });
    });

    return alternatives.slice(0, 5); // Return top 5 suggestions
  } catch (error) {
    console.error('Error getting database-powered suggestions:', error);
    return [];
  }
}

// Utility function for time calculations
function addMinutesToTimeString(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
}

// Format duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

// Calculate optimal task spacing
export function calculateOptimalSpacing(
  tasks: Task[],
  workingHours: { start: number; end: number } = { start: 6, end: 23 }
): {
  averageTaskDuration: number;
  recommendedBreakTime: number;
  optimalTasksPerBlock: number;
  efficiency: number;
} {
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
  const averageTaskDuration = tasks.length > 0 ? totalDuration / tasks.length : 0;
  const availableHours = workingHours.end - workingHours.start;
  const availableMinutes = availableHours * 60;

  // Calculate recommended break time (15% of total scheduled time)
  const recommendedBreakTime = Math.max(15, Math.round(totalDuration * 0.15));

  // Calculate optimal tasks per time block
  const optimalTasksPerBlock = Math.max(1, Math.round(tasks.length / 3));

  // Calculate efficiency (how well time is utilized)
  const efficiency = availableMinutes > 0 ? Math.min(100, (totalDuration / availableMinutes) * 100) : 0;

  return {
    averageTaskDuration,
    recommendedBreakTime,
    optimalTasksPerBlock,
    efficiency
  };
}