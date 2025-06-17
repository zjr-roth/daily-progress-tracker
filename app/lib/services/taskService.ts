// app/lib/services/taskService.ts - Fixed version with proper task deletion
import { supabase } from '../supabase';
import { Task, TimeBlock } from '../types';

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
  scheduled_date?: string;
  priority?: number;
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
  slot_type: 'gap' | 'morning_free' | 'afternoon_free' | 'evening_free';
}

export interface FormattedTimeSlot {
  time_slot: string;
  duration: string;
  time_block: string;
  availability_type: string;
  recommended: boolean;
}

export class TaskService {
  static async getUserTasks(userId: string, date?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            bg_color,
            text_color
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      // Filter by date if provided (only if scheduled_date column exists)
      if (date) {
        // We'll handle this gracefully in case the column doesn't exist
        try {
          query = query.eq('scheduled_date', date);
        } catch (error) {
          console.warn('scheduled_date column not found, ignoring date filter');
        }
      }

      const { data, error } = await query.order('time_start', { ascending: true });

      if (error) throw error;

      return data?.map(TaskService.transformDatabaseTaskToTask) || [];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  }

  static async createTasksFromSchedule(
    userId: string,
    timeSlots: any[]
  ): Promise<Task[]> {
    try {
      const tasksToInsert = timeSlots.map((slot, index) => {
        // The AI gives us the start time and duration directly.
        const timeStart = `${slot.time}:00`;
        const timeEnd = TaskService.addMinutesToTime(timeStart, slot.duration);

        return {
          user_id: userId,
          name: slot.activity,
          time_start: timeStart,
          time_end: timeEnd,
          // We will create tasks without a category for now, user can assign later.
          // In a more advanced implementation, you'd match AI category to your DB categories.
          category_id: null,
          duration: slot.duration,
          time_block: this.getTimeBlockFromTime(slot.time),
          position: index,
          is_active: true,
          // Assuming the schedule is for today
          scheduled_date: new Date().toISOString().split("T")[0],
        };
      });

      const { data, error } = await supabase
        .from("tasks")
        .insert(tasksToInsert)
        .select(`
          *,
          categories (
            id,
            name,
            color,
            bg_color,
            text_color
          )
        `);

      if (error) {
        // The "range lower bound" error comes from here if time is invalid
        console.error("Database batch insert error:", error);
        throw new Error(error.message);
      }

      return data?.map(TaskService.transformDatabaseTaskToTask) || [];
    } catch (error) {
      console.error("Error creating tasks from schedule:", error);
      throw error;
    }
  }

  // Helper function to determine time block from a time string like "HH:MM"
  static getTimeBlockFromTime(time: string): TimeBlock {
    const [hours] = time.split(":").map(Number);
    if (hours < 12) {
      return "morning";
    } else if (hours < 18) {
      return "afternoon";
    } else {
      return "evening";
    }
  }

  static async createTask(
    userId: string,
    taskData: Omit<Task, 'id'> & {
      categoryId?: string;
      scheduledDate?: string;
      priority?: number;
    }
  ): Promise<Task> {
    try {
      // First check if time slot is available using basic validation
      const timeStart = TaskService.extractTimeFromTimeString(taskData.time);
      const timeEnd = TaskService.addMinutesToTime(timeStart, taskData.duration);

      // Basic conflict check with existing tasks
      const existingTasks = await this.getUserTasks(userId, taskData.scheduledDate);
      const hasConflict = TaskService.checkBasicTimeConflict(existingTasks, taskData.time);

      if (hasConflict) {
        throw new Error('Time slot conflicts with an existing task. Please choose a different time.');
      }

      // Get next position for the time block
      const position = await TaskService.getNextPositionForTimeBlock(
        userId,
        taskData.block,
        taskData.scheduledDate
      );

      // Prepare insert data - only include columns that exist
      const insertData: any = {
        user_id: userId,
        name: taskData.name,
        time_start: timeStart,
        time_end: timeEnd,
        category_id: taskData.categoryId || null,
        duration: taskData.duration,
        time_block: taskData.block,
        position: position,
      };

      // Only add these fields if they're provided (to avoid column errors)
      if (taskData.scheduledDate) {
        insertData.scheduled_date = taskData.scheduledDate;
      }
      if (taskData.priority !== undefined) {
        insertData.priority = taskData.priority;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select(`
          *,
          categories (
            id,
            name,
            color,
            bg_color,
            text_color
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return TaskService.transformDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Omit<Task, 'id'>> & {
      categoryId?: string;
      scheduledDate?: string;
      priority?: number;
    }
  ): Promise<Task> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.duration) updateData.duration = updates.duration;

      if (updates.time) {
        updateData.time_start = TaskService.extractTimeFromTimeString(updates.time);
        updateData.time_end = TaskService.addMinutesToTime(
          updateData.time_start,
          updates.duration || 0
        );
      }
      if (updates.block) updateData.time_block = updates.block;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;

      // Only add these fields if they're provided and columns exist
      if (updates.scheduledDate) {
        updateData.scheduled_date = updates.scheduledDate;
      }
      if (updates.priority !== undefined) {
        updateData.priority = updates.priority;
      }

      // If time is being updated, check for conflicts
      if (updateData.time_start && updateData.time_end) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('user_id')
          .eq('id', taskId)
          .single();

        if (taskData) {
          const existingTasks = await TaskService.getUserTasks(taskData.user_id);
          const hasConflict = TaskService.checkBasicTimeConflict(
            existingTasks,
            updates.time!,
            taskId
          );

          if (hasConflict) {
            throw new Error('Time slot conflicts with an existing task.');
          }
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          categories (
            id,
            name,
            color,
            bg_color,
            text_color
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to update task: ${error.message}`);
      }

      return TaskService.transformDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // FIXED: Actually delete tasks from database instead of just marking as inactive
  static async deleteTask(taskId: string): Promise<void> {
    try {
      // Get the task details before deletion for cleanup
      const { data: taskToDelete, error: fetchError } = await supabase
        .from('tasks')
        .select('user_id, name')
        .eq('id', taskId)
        .single();

      if (fetchError) {
        console.error('Error fetching task to delete:', fetchError);
        throw new Error(`Failed to fetch task for deletion: ${fetchError.message}`);
      }

      // Step 1: Remove the task from any daily progress data
      if (taskToDelete) {
        await TaskService.cleanupTaskFromProgressData(taskId, taskToDelete.name);
      }

      // Step 2: Actually DELETE the task from the database
      const { error } = await supabase
        .from('tasks')
        .delete()  // Changed from update to delete
        .eq('id', taskId);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to delete task: ${error.message}`);
      }

      console.log(`Task ${taskId} successfully deleted from database`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // NEW: Clean up task references from daily progress data
  static async cleanupTaskFromProgressData(taskId: string, taskName: string): Promise<void> {
    try {
      // Get all daily data entries that might reference this task
      const { data: dailyDataEntries, error: fetchError } = await supabase
        .from('daily_data')
        .select('id, incomplete_task_ids, incomplete_tasks, completion_percentage')
        .or(`incomplete_task_ids.cs.{${taskId}},incomplete_tasks.cs.{${taskName}}`);

      if (fetchError) {
        console.warn('Error fetching daily data for cleanup:', fetchError);
        return; // Don't throw, just log and continue
      }

      if (!dailyDataEntries || dailyDataEntries.length === 0) {
        console.log('No daily data entries found containing this task');
        return;
      }

      // Update each entry to remove references to the deleted task
      for (const entry of dailyDataEntries) {
        const updates: any = {};
        let needsUpdate = false;

        // Clean up incomplete_task_ids array
        if (entry.incomplete_task_ids && Array.isArray(entry.incomplete_task_ids)) {
          const cleanedTaskIds = entry.incomplete_task_ids.filter((id: string) => id !== taskId);
          if (cleanedTaskIds.length !== entry.incomplete_task_ids.length) {
            updates.incomplete_task_ids = cleanedTaskIds;
            needsUpdate = true;
          }
        }

        // Clean up incomplete_tasks array (for backward compatibility)
        if (entry.incomplete_tasks && Array.isArray(entry.incomplete_tasks)) {
          const cleanedTasks = entry.incomplete_tasks.filter((name: string) => name !== taskName);
          if (cleanedTasks.length !== entry.incomplete_tasks.length) {
            updates.incomplete_tasks = cleanedTasks;
            needsUpdate = true;
          }
        }

        // If we removed any tasks, we might need to recalculate completion percentage
        // Note: This is a simplified recalculation. In a real scenario, you'd want to
        // get the current total task count for that day to calculate the proper percentage
        if (needsUpdate) {
          // For now, we'll leave the completion percentage as is, since we don't have
          // the total task count for that specific day readily available here
          updates.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('daily_data')
            .update(updates)
            .eq('id', entry.id);

          if (updateError) {
            console.error(`Error updating daily data entry ${entry.id}:`, updateError);
          } else {
            console.log(`Cleaned up daily data entry ${entry.id}`);
          }
        }
      }

      console.log(`Completed cleanup for task ${taskId} (${taskName})`);
    } catch (error) {
      console.error('Error cleaning up task from progress data:', error);
      // Don't throw here - we want task deletion to succeed even if cleanup fails
    }
  }

  static async reorderTasks(
    userId: string,
    timeBlock: TimeBlock,
    taskIds: string[],
    scheduledDate?: string
  ): Promise<void> {
    try {
      const updates = taskIds.map((taskId, index) => ({
        id: taskId,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ position: update.position })
          .eq('id', update.id)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      throw error;
    }
  }

  // Enhanced function using the database function (with fallback)
  static async getAvailableTimeSlots(
    userId: string,
    date?: string,
    minDuration: number = 15,
    bufferMinutes: number = 5
  ): Promise<FormattedTimeSlot[]> {
    try {
      // Try the enhanced database function first
      const { data, error } = await supabase
        .rpc('get_formatted_available_slots', {
          p_user_id: userId,
          p_date: date || new Date().toISOString().split('T')[0],
          p_min_duration: minDuration
        });

      if (error) {
        console.warn('Enhanced time slots function not available, using basic fallback');
        // Fallback to basic implementation
        return TaskService.getBasicAvailableTimeSlots(userId, date, minDuration);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting available time slots:', error);
      // Return basic fallback
      return TaskService.getBasicAvailableTimeSlots(userId, date, minDuration);
    }
  }

  // Basic fallback for available time slots
  static async getBasicAvailableTimeSlots(
    userId: string,
    date?: string,
    minDuration: number = 15
  ): Promise<FormattedTimeSlot[]> {
    try {
      const tasks = await TaskService.getUserTasks(userId, date);
      const timeBlocks = ['morning', 'afternoon', 'evening'] as const;
      const slots: FormattedTimeSlot[] = [];

      const blockRanges = {
        morning: { start: '6:00 AM', end: '12:00 PM' },
        afternoon: { start: '12:00 PM', end: '6:00 PM' },
        evening: { start: '6:00 PM', end: '11:00 PM' }
      };

      timeBlocks.forEach(block => {
        const blockTasks = tasks.filter(task => task.block === block);
        if (blockTasks.length === 0) {
          // Entire block is free
          slots.push({
            time_slot: `${blockRanges[block].start} - ${blockRanges[block].end}`,
            duration: '6 hours',
            time_block: block,
            availability_type: `Free ${block} time`,
            recommended: block === 'morning'
          });
        }
      });

      return slots;
    } catch (error) {
      console.error('Error getting basic available time slots:', error);
      return [];
    }
  }

  // Simplified conflict check
  static checkBasicTimeConflict(
    existingTasks: Task[],
    newTaskTime: string,
    excludeTaskId?: string
  ): boolean {
    try {
      const newTaskTimeRange = TaskService.parseTimeString(newTaskTime);

      for (const task of existingTasks) {
        if (excludeTaskId && task.id === excludeTaskId) continue;

        const taskTimeRange = TaskService.parseTimeString(task.time);

        // Check for overlap
        if (
          (newTaskTimeRange.start < taskTimeRange.end &&
           newTaskTimeRange.end > taskTimeRange.start)
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

  // Helper to parse time string
  static parseTimeString(timeString: string): { start: Date; end: Date } {
    // Updated regex to handle formats like "8:00 AM-9:00 AM", "8:00-9:00 AM", "2:30 PM-3:45 PM"
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = timeString.match(timePattern);

    if (!match) {
      throw new Error(`Invalid time format: ${timeString}`);
    }

    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;

    const start = new Date();
    const end = new Date();

    let startHour24 = parseInt(startHour);
    let endHour24 = parseInt(endHour);

    // Handle start time period (use end period if start period is missing)
    const actualStartPeriod = startPeriod || endPeriod;
    if (actualStartPeriod?.toUpperCase() === 'PM' && startHour24 !== 12) {
      startHour24 += 12;
    } else if (actualStartPeriod?.toUpperCase() === 'AM' && startHour24 === 12) {
      startHour24 = 0;
    }

    // Handle end time period
    if (endPeriod?.toUpperCase() === 'PM' && endHour24 !== 12) {
      endHour24 += 12;
    } else if (endPeriod?.toUpperCase() === 'AM' && endHour24 === 12) {
      endHour24 = 0;
    }

    start.setHours(startHour24, parseInt(startMin), 0, 0);
    end.setHours(endHour24, parseInt(endMin), 0, 0);

    return { start, end };
  }

  static async checkTimeSlotAvailability(
    userId: string,
    startTime: string,
    endTime: string,
    date?: string,
    excludeTaskId?: string
  ): Promise<boolean> {
    try {
      // Try the enhanced database function first
      const { data, error } = await supabase
        .rpc('check_time_slot_availability', {
          p_user_id: userId,
          p_start_time: startTime,
          p_end_time: endTime,
          p_exclude_task_id: excludeTaskId || null,
        });

      if (error) {
        console.warn('Enhanced availability check not available, using basic fallback');
        // Fallback to basic check
        const tasks = await TaskService.getUserTasks(userId, date);
        const timeString = TaskService.formatTimeRange(startTime, endTime);
        return !TaskService.checkBasicTimeConflict(tasks, timeString, excludeTaskId);
      }

      return data || false;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  // Simplified scheduling suggestions
  static async getSmartSchedulingSuggestions(
    userId: string,
    taskDuration: number,
    preferredTimeBlock?: TimeBlock,
    date?: string
  ): Promise<{
    recommended: FormattedTimeSlot[];
    alternatives: FormattedTimeSlot[];
  }> {
    try {
      const allSlots = await TaskService.getAvailableTimeSlots(userId, date, taskDuration);

      let recommended = allSlots.filter(slot => slot.recommended);
      let alternatives = allSlots.filter(slot => !slot.recommended);

      // If user has a preferred time block, prioritize that
      if (preferredTimeBlock) {
        const preferredSlots = allSlots.filter(slot =>
          slot.time_block.toLowerCase() === preferredTimeBlock.toLowerCase()
        );

        if (preferredSlots.length > 0) {
          recommended = preferredSlots.filter(slot => slot.recommended);
          alternatives = [
            ...preferredSlots.filter(slot => !slot.recommended),
            ...allSlots.filter(slot =>
              slot.time_block.toLowerCase() !== preferredTimeBlock.toLowerCase()
            )
          ];
        }
      }

      return {
        recommended: recommended.slice(0, 3),
        alternatives: alternatives.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting smart scheduling suggestions:', error);
      return { recommended: [], alternatives: [] };
    }
  }

  // Simplified optimization insights
  static async getScheduleOptimizationInsights(
    userId: string,
    date?: string
  ): Promise<{
    totalScheduledTime: number;
    totalFreeTime: number;
    largestFreeBlock: number;
    timeBlockUtilization: Record<TimeBlock, number>;
    suggestions: string[];
  }> {
    try {
      const tasks = await TaskService.getUserTasks(userId, date);
      const availableSlots = await TaskService.getAvailableTimeSlots(userId, date);

      const totalScheduledTime = tasks.reduce((sum, task) => sum + task.duration, 0);

      // Calculate total free time from available slots
      let totalFreeTime = 0;
      let largestFreeBlock = 0;

      availableSlots.forEach(slot => {
        const duration = TaskService.parseDurationString(slot.duration);
        totalFreeTime += duration;
        largestFreeBlock = Math.max(largestFreeBlock, duration);
      });

      // Calculate time block utilization
      const timeBlockUtilization: Record<TimeBlock, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0
      };

      const blockDurations = {
        morning: 6 * 60,
        afternoon: 6 * 60,
        evening: 5 * 60
      };

      tasks.forEach(task => {
        timeBlockUtilization[task.block] += task.duration;
      });

      // Convert to percentages
      Object.keys(timeBlockUtilization).forEach(block => {
        const blockKey = block as TimeBlock;
        timeBlockUtilization[blockKey] = Math.round(
          (timeBlockUtilization[blockKey] / blockDurations[blockKey]) * 100
        );
      });

      // Generate suggestions
      const suggestions: string[] = [];

      if (totalFreeTime > 180) {
        suggestions.push("You have significant free time - consider adding important tasks.");
      }

      if (largestFreeBlock >= 120) {
        suggestions.push(`You have a ${Math.round(largestFreeBlock/60)}+ hour free block - perfect for deep work.`);
      }

      if (timeBlockUtilization.morning < 50) {
        suggestions.push("Your morning has light scheduling - consider moving important tasks here.");
      }

      return {
        totalScheduledTime,
        totalFreeTime,
        largestFreeBlock,
        timeBlockUtilization,
        suggestions
      };
    } catch (error) {
      console.error('Error getting schedule optimization insights:', error);
      return {
        totalScheduledTime: 0,
        totalFreeTime: 0,
        largestFreeBlock: 0,
        timeBlockUtilization: { morning: 0, afternoon: 0, evening: 0 },
        suggestions: []
      };
    }
  }

  // Helper methods
  static parseDurationString(duration: string): number {
    // Parse duration strings like "2h 30m", "90 minutes", etc.
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)\s*m/);

    let totalMinutes = 0;
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

    // If no matches, try to parse as plain number
    if (totalMinutes === 0) {
      const numberMatch = duration.match(/(\d+)/);
      if (numberMatch) totalMinutes = parseInt(numberMatch[1]);
    }

    return totalMinutes;
  }

  static transformDatabaseTaskToTask(dbTask: DatabaseTask): Task {
    return {
      id: dbTask.id,
      name: dbTask.name,
      time: TaskService.formatTimeRange(dbTask.time_start, dbTask.time_end),
      category: dbTask.categories?.name || 'Personal',
      duration: dbTask.duration,
      block: dbTask.time_block,
    };
  }

  static extractTimeFromTimeString(timeString: string): string {
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) {
      throw new Error('Invalid time format');
    }

    let [, hours, minutes, ampm] = timeMatch;
    let hour24 = parseInt(hours);

    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
    }

    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  }

  static addMinutesToTime(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
  }

  static formatTimeRange(startTime: string, endTime: string): string {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(startTime)}-${formatTime(endTime)}`;
  }

  static async getNextPositionForTimeBlock(
    userId: string,
    timeBlock: TimeBlock,
    scheduledDate?: string
  ): Promise<number> {
    let query = supabase
      .from('tasks')
      .select('position')
      .eq('user_id', userId)
      .eq('time_block', timeBlock)
      .eq('is_active', true);

    // Only filter by scheduled_date if it's provided and column exists
    if (scheduledDate) {
      try {
        query = query.eq('scheduled_date', scheduledDate);
      } catch (error) {
        console.warn('scheduled_date column not found, ignoring date filter');
      }
    }

    const { data, error } = await query
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Error getting position:', error);
      return 0;
    }

    return data && data.length > 0 ? data[0].position + 1 : 0;
  }
}