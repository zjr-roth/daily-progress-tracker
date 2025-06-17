// app/lib/utils/scheduleConverter.ts
import { Schedule, TimeSlot, Task, TimeBlock } from '../types';
import { TaskService } from '../services/taskService';
import { CategoryService } from '../services/categoryService';

export interface ScheduleConversionOptions {
  userId: string;
  targetDate?: string;
  preserveExistingTasks?: boolean;
  createMissingCategories?: boolean;
}

export interface ConversionResult {
  createdTasks: Task[];
  skippedSlots: TimeSlot[];
  createdCategories: string[];
  errors: string[];
}

export class ScheduleConverter {
  /**
   * Convert AI-generated schedule to actual tasks in the database
   */
  static async convertScheduleToTasks(
    schedule: Schedule,
    options: ScheduleConversionOptions
  ): Promise<ConversionResult> {
    const {
      userId,
      targetDate = new Date().toISOString().split('T')[0],
      preserveExistingTasks = false,
      createMissingCategories = true,
    } = options;

    const result: ConversionResult = {
      createdTasks: [],
      skippedSlots: [],
      createdCategories: [],
      errors: [],
    };

    try {
      // Get existing categories
      const existingCategories = await CategoryService.getUserCategories(userId);
      const categoryMap = new Map(existingCategories.map(cat => [cat.name.toLowerCase(), cat]));

      // Get existing tasks for the date if preserving
      let existingTasks: Task[] = [];
      if (preserveExistingTasks) {
        existingTasks = await TaskService.getUserTasks(userId, targetDate);
      }

      // Process each time slot
      for (const slot of schedule.timeSlots) {
        try {
          // Skip if this conflicts with existing tasks and we're preserving them
          if (preserveExistingTasks && this.hasTimeConflict(slot, existingTasks)) {
            result.skippedSlots.push(slot);
            continue;
          }

          // Handle category mapping
          const categoryName = this.mapAICategoryToUserCategory(slot.category);
          let categoryId: string | undefined;

          const existingCategory = categoryMap.get(categoryName.toLowerCase());
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else if (createMissingCategories) {
            // Create new category
            try {
              const newCategory = await CategoryService.createCategory(userId, {
                name: categoryName,
                color: this.getCategoryColor(categoryName),
                bgColor: this.getCategoryBgColor(categoryName),
                textColor: this.getCategoryTextColor(categoryName),
              });
              categoryId = newCategory.id;
              categoryMap.set(categoryName.toLowerCase(), newCategory);
              result.createdCategories.push(categoryName);
            } catch (error) {
              console.warn(`Failed to create category "${categoryName}":`, error);
              // Use default category or skip
              const defaultCategory = existingCategories.find(cat => cat.name === 'Personal');
              categoryId = defaultCategory?.id;
            }
          }

          // Convert time slot to task
          const taskData = this.convertTimeSlotToTask(slot, categoryName, targetDate);

          // Create the task
          const createdTask = await TaskService.createTask(userId, {
            ...taskData,
            categoryId,
          });

          result.createdTasks.push(createdTask);

        } catch (error: any) {
          console.error(`Error processing time slot "${slot.activity}":`, error);
          result.errors.push(`Failed to create task "${slot.activity}": ${error.message}`);
          result.skippedSlots.push(slot);
        }
      }

      return result;

    } catch (error: any) {
      console.error('Error converting schedule to tasks:', error);
      result.errors.push(`Conversion failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Convert a single time slot to a task format
   */
  private static convertTimeSlotToTask(
    slot: TimeSlot,
    categoryName: string,
    scheduledDate: string
  ): Omit<Task, 'id'> & { categoryId?: string; scheduledDate: string; priority: number } {
    const timeBlock = this.determineTimeBlock(slot.time);
    const timeRange = this.formatTimeRange(slot.time, slot.duration);

    return {
      name: slot.activity,
      time: timeRange,
      category: categoryName,
      duration: slot.duration,
      block: timeBlock,
      scheduledDate,
      priority: slot.isCommitment ? 1 : 2, // Commitments get higher priority
    };
  }

  /**
   * Determine time block based on time string
   */
  private static determineTimeBlock(timeString: string): TimeBlock {
    const hour = this.parseTimeToHour24(timeString);

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Parse time string to 24-hour format
   */
  private static parseTimeToHour24(timeString: string): number {
    const match = timeString.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i);
    if (!match) return 12; // Default to noon

    let hour = parseInt(match[1]);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return hour;
  }

  /**
   * Format time range for task
   */
  private static formatTimeRange(startTime: string, duration: number): string {
    const startHour = this.parseTimeToHour24(startTime);
    const startMinutes = this.parseTimeToMinutes(startTime) % 60;

    const totalMinutes = startHour * 60 + startMinutes + duration;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    const formatTime = (hour: number, minute: number): string => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(startHour, startMinutes)}-${formatTime(endHour, endMinutes)}`;
  }

  /**
   * Parse time string to total minutes
   */
  private static parseTimeToMinutes(timeString: string): number {
    const match = timeString.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i);
    if (!match) return 12 * 60; // Default to noon

    let hour = parseInt(match[1]);
    const minute = parseInt(match[2] || '0');
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  }

  /**
   * Check if time slot conflicts with existing tasks
   */
  private static hasTimeConflict(slot: TimeSlot, existingTasks: Task[]): boolean {
    const slotStart = this.parseTimeToMinutes(slot.time);
    const slotEnd = slotStart + slot.duration;

    return existingTasks.some(task => {
      const taskTimeRange = this.parseTaskTimeRange(task.time);
      const taskStart = taskTimeRange.start;
      const taskEnd = taskTimeRange.end;

      // Check for overlap
      return (slotStart < taskEnd && slotEnd > taskStart);
    });
  }

  /**
   * Parse task time range (e.g., "9:00 AM-10:00 AM")
   */
  private static parseTaskTimeRange(timeRange: string): { start: number; end: number } {
    const parts = timeRange.split('-');
    if (parts.length !== 2) {
      return { start: 0, end: 0 };
    }

    return {
      start: this.parseTimeToMinutes(parts[0].trim()),
      end: this.parseTimeToMinutes(parts[1].trim()),
    };
  }

  /**
   * Map AI category names to user-friendly category names
   */
  private static mapAICategoryToUserCategory(aiCategory: string): string {
    const categoryMap: Record<string, string> = {
      'Personal Care': 'Personal',
      'Meals': 'Personal',
      'Work': 'Work',
      'Goals': 'Personal Development',
      'Commitment': 'Commitments',
      'Exercise': 'Health & Fitness',
      'Learning': 'Study',
      'Social': 'Personal',
      'Health': 'Health & Fitness',
      'Productivity': 'Work',
      'Self-Care': 'Personal',
      'Family': 'Personal',
      'Hobbies': 'Personal Development',
      'Travel': 'Personal',
      'Finance': 'Work',
      'Education': 'Study',
    };

    return categoryMap[aiCategory] || aiCategory || 'Personal';
  }

  /**
   * Get default color for category
   */
  private static getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      'Work': 'bg-blue-500',
      'Personal': 'bg-purple-500',
      'Personal Development': 'bg-green-500',
      'Health & Fitness': 'bg-orange-500',
      'Study': 'bg-indigo-500',
      'Commitments': 'bg-red-500',
    };

    return colorMap[categoryName] || 'bg-gray-500';
  }

  /**
   * Get default background color for category
   */
  private static getCategoryBgColor(categoryName: string): string {
    const bgColorMap: Record<string, string> = {
      'Work': 'bg-blue-100 dark:bg-blue-900',
      'Personal': 'bg-purple-100 dark:bg-purple-900',
      'Personal Development': 'bg-green-100 dark:bg-green-900',
      'Health & Fitness': 'bg-orange-100 dark:bg-orange-900',
      'Study': 'bg-indigo-100 dark:bg-indigo-900',
      'Commitments': 'bg-red-100 dark:bg-red-900',
    };

    return bgColorMap[categoryName] || 'bg-gray-100 dark:bg-gray-900';
  }

  /**
   * Get default text color for category
   */
  private static getCategoryTextColor(categoryName: string): string {
    const textColorMap: Record<string, string> = {
      'Work': 'text-blue-800 dark:text-blue-200',
      'Personal': 'text-purple-800 dark:text-purple-200',
      'Personal Development': 'text-green-800 dark:text-green-200',
      'Health & Fitness': 'text-orange-800 dark:text-orange-200',
      'Study': 'text-indigo-800 dark:text-indigo-200',
      'Commitments': 'text-red-800 dark:text-red-200',
    };

    return textColorMap[categoryName] || 'text-gray-800 dark:text-gray-200';
  }

  /**
   * Generate summary of conversion results
   */
  static generateConversionSummary(result: ConversionResult): string {
    const { createdTasks, skippedSlots, createdCategories, errors } = result;

    let summary = `Schedule conversion completed:\n`;
    summary += `✅ Created ${createdTasks.length} tasks\n`;

    if (createdCategories.length > 0) {
      summary += `🏷️ Created ${createdCategories.length} new categories: ${createdCategories.join(', ')}\n`;
    }

    if (skippedSlots.length > 0) {
      summary += `⏭️ Skipped ${skippedSlots.length} time slots due to conflicts\n`;
    }

    if (errors.length > 0) {
      summary += `❌ ${errors.length} errors occurred\n`;
      errors.forEach(error => {
        summary += `   • ${error}\n`;
      });
    }

    return summary;
  }

  /**
   * Validate schedule before conversion
   */
  static validateSchedule(schedule: Schedule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schedule.timeSlots || schedule.timeSlots.length === 0) {
      errors.push('Schedule must contain at least one time slot');
    }

    schedule.timeSlots?.forEach((slot, index) => {
      if (!slot.activity || slot.activity.trim() === '') {
        errors.push(`Time slot ${index + 1}: Activity name is required`);
      }

      if (!slot.time || slot.time.trim() === '') {
        errors.push(`Time slot ${index + 1}: Time is required`);
      }

      if (!slot.duration || slot.duration <= 0) {
        errors.push(`Time slot ${index + 1}: Duration must be greater than 0`);
      }

      if (slot.duration > 480) { // 8 hours
        errors.push(`Time slot ${index + 1}: Duration seems too long (${slot.duration} minutes)`);
      }
    });

    // Check for time conflicts within the schedule
    const sortedSlots = [...(schedule.timeSlots || [])].sort((a, b) => {
      return this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time);
    });

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];

      const currentEnd = this.parseTimeToMinutes(current.time) + current.duration;
      const nextStart = this.parseTimeToMinutes(next.time);

      if (currentEnd > nextStart) {
        errors.push(`Time conflict between "${current.activity}" and "${next.activity}"`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Optimize schedule before conversion (remove conflicts, adjust times)
   */
  static optimizeSchedule(schedule: Schedule): Schedule {
    const optimizedSlots = [...schedule.timeSlots];

    // Sort by time
    optimizedSlots.sort((a, b) => {
      return this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time);
    });

    // Resolve conflicts by adjusting times
    for (let i = 0; i < optimizedSlots.length - 1; i++) {
      const current = optimizedSlots[i];
      const next = optimizedSlots[i + 1];

      const currentEnd = this.parseTimeToMinutes(current.time) + current.duration;
      const nextStart = this.parseTimeToMinutes(next.time);

      if (currentEnd > nextStart) {
        // Conflict detected - adjust the next slot's time
        const newNextStart = currentEnd + 15; // Add 15-minute buffer
        const newNextTime = this.minutesToTimeString(newNextStart);
        optimizedSlots[i + 1] = { ...next, time: newNextTime };
      }
    }

    return {
      ...schedule,
      timeSlots: optimizedSlots,
    };
  }

  /**
   * Convert minutes to time string
   */
  private static minutesToTimeString(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Preview what tasks would be created without actually creating them
   */
  static async previewTaskCreation(
    schedule: Schedule,
    options: ScheduleConversionOptions
  ): Promise<{
    tasks: Array<Omit<Task, 'id'>>;
    newCategories: string[];
    conflicts: string[];
    warnings: string[];
  }> {
    const { userId, targetDate = new Date().toISOString().split('T')[0] } = options;

    const preview = {
      tasks: [] as Array<Omit<Task, 'id'>>,
      newCategories: [] as string[],
      conflicts: [] as string[],
      warnings: [] as string[],
    };

    try {
      // Get existing categories
      const existingCategories = await CategoryService.getUserCategories(userId);
      const categoryNames = new Set(existingCategories.map(cat => cat.name.toLowerCase()));

      // Get existing tasks
      const existingTasks = await TaskService.getUserTasks(userId, targetDate);

      for (const slot of schedule.timeSlots) {
        const categoryName = this.mapAICategoryToUserCategory(slot.category);

        // Check if category exists
        if (!categoryNames.has(categoryName.toLowerCase())) {
          preview.newCategories.push(categoryName);
          categoryNames.add(categoryName.toLowerCase());
        }

        // Convert to task format
        const taskData = this.convertTimeSlotToTask(slot, categoryName, targetDate);
        preview.tasks.push(taskData);

        // Check for conflicts
        if (this.hasTimeConflict(slot, existingTasks)) {
          preview.conflicts.push(`"${slot.activity}" conflicts with existing tasks at ${slot.time}`);
        }

        // Generate warnings
        if (slot.duration > 240) { // 4 hours
          preview.warnings.push(`"${slot.activity}" has a very long duration (${slot.duration} minutes)`);
        }
      }

      return preview;

    } catch (error: any) {
      console.error('Error generating preview:', error);
      return {
        tasks: [],
        newCategories: [],
        conflicts: [`Preview failed: ${error.message}`],
        warnings: [],
      };
    }
  }

  /**
   * Convert existing tasks back to schedule format (for editing/regeneration)
   */
  static async convertTasksToSchedule(
    userId: string,
    targetDate?: string
  ): Promise<Schedule> {
    try {
      const tasks = await TaskService.getUserTasks(userId, targetDate);

      const timeSlots: TimeSlot[] = tasks.map((task, index) => {
        const timeRange = task.time.split('-');
        const startTime = timeRange[0]?.trim() || '8:00 AM';

        return {
          id: task.id,
          time: startTime,
          activity: task.name,
          description: `Task: ${task.name}`,
          category: task.category,
          duration: task.duration,
          isCommitment: task.category === 'Commitments',
        };
      });

      // Sort by time
      timeSlots.sort((a, b) => {
        return this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time);
      });

      return {
        timeSlots,
        summary: `Current schedule with ${tasks.length} tasks`,
        optimizationReasoning: 'Converted from existing user tasks',
        confidence: 1.0,
      };

    } catch (error: any) {
      console.error('Error converting tasks to schedule:', error);
      throw new Error(`Failed to convert tasks to schedule: ${error.message}`);
    }
  }
}