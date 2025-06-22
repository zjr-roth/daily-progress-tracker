// app/lib/services/taskService.ts - Enhanced with proper category handling
import { supabase } from '../supabase';
import { Task, TimeBlock } from '../types';
import { CategoryService } from './categoryService';

export interface DatabaseTask {
  id: string;
  user_id: string;
  name: string;
  time_start: string;
  time_end: string;
  category_id: string | null;
  category_name: string | null;
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
        .eq('is_active', false);

      if (date) {
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

  // Helper function to determine time block from a time string like "HH" or "HH:MM"
  static getTimeBlockFromTime(timeInput: string): TimeBlock {
    let hours: number;

    if (typeof timeInput === 'string') {
      const hourMatch = timeInput.match(/(\d{1,2})/);
      if (hourMatch) {
        hours = parseInt(hourMatch[1]);
      } else {
        hours = 12;
      }
    } else {
      hours = 12;
    }


    if (hours < 0 || hours > 23) {
      hours = 12;
    }

    if (hours >= 6 && hours < 12) {
      return "morning";
    } else if (hours >= 12 && hours < 18) {
      return "afternoon";
    } else {
      return "evening";
    }
  }

  // Enhanced function to create or find category
  static async createOrFindCategory(userId: string, categoryName: string) {
    try {
      // First, try to find existing category
      const existingCategories = await CategoryService.getUserCategories(userId);
      const existingCategory = existingCategories.find(
        cat => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory) {
        return existingCategory;
      }

      // If not found, create new category with default styling
      const defaultCategoryStyles = {
        'Work': { color: 'bg-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-800 dark:text-blue-200' },
        'Goals': { color: 'bg-green-500', bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-800 dark:text-green-200' },
        'Personal Care': { color: 'bg-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900', textColor: 'text-purple-800 dark:text-purple-200' },
        'Meals': { color: 'bg-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900', textColor: 'text-orange-800 dark:text-orange-200' },
        'Commitment': { color: 'bg-red-500', bgColor: 'bg-red-100 dark:bg-red-900', textColor: 'text-red-800 dark:text-red-200' },
        'Break': { color: 'bg-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900', textColor: 'text-gray-800 dark:text-gray-200' },
        'Travel': { color: 'bg-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900', textColor: 'text-indigo-800 dark:text-indigo-200' },
        'Study': { color: 'bg-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900', textColor: 'text-cyan-800 dark:text-cyan-200' },
        'Exercise': { color: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900', textColor: 'text-emerald-800 dark:text-emerald-200' },
        'Personal': { color: 'bg-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-900', textColor: 'text-violet-800 dark:text-violet-200' }
      };

      const style = defaultCategoryStyles[categoryName as keyof typeof defaultCategoryStyles] ||
                   defaultCategoryStyles['Personal'];

      const newCategory = await CategoryService.createCategory(userId, {
        name: categoryName,
        ...style
      });

      return newCategory;
    } catch (error) {
      console.error(`Error creating/finding category "${categoryName}":`, error);
      // Return null if category creation fails
      return null;
    }
  }

  // Enhanced createTasksFromSchedule with proper category handling and better time parsing
  static async createTasksFromSchedule(
    userId: string,
    timeSlots: any[]
  ): Promise<Task[]> {
    try {
      const scheduledDate = new Date().toISOString().split("T")[0];

      // Delete existing tasks for the date
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('scheduled_date', scheduledDate);

      if (!timeSlots || timeSlots.length === 0) return [];

      const createdTasks: Task[] = [];

      // Process each time slot individually to handle category creation
      for (let index = 0; index < timeSlots.length; index++) {
        const slot = timeSlots[index];

        try {
          console.log(`Processing slot ${index + 1}:`, slot);

          // Enhanced time parsing with better error handling
          let timeStart: string;
          let timeEnd: string;

          // Parse the time more carefully
          if (typeof slot.time === 'string' && slot.time.includes(':')) {
            // Handle various time formats: "HH:MM", "H:MM", "HH:MM AM/PM"
            const timeStr = slot.time.trim();

            // Extract just the time part (remove AM/PM if present)
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);

              // Validate time values
              if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error(`Invalid time values: ${hours}:${minutes}`);
              }

              timeStart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            } else {
              throw new Error(`Could not parse time: ${timeStr}`);
            }
          } else {
            // Fallback for other formats
            timeStart = '08:00:00'; // Default start time
          }

          // Calculate end time with proper validation
          const duration = slot.duration || 60; // Default 1 hour if not specified
          if (duration <= 0 || duration > 1440) { // Max 24 hours
            throw new Error(`Invalid duration: ${duration} minutes`);
          }

          // Parse start time for calculation
          const [startHours, startMinutes] = timeStart.split(':').map(Number);
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = startTotalMinutes + duration;

          // Handle day overflow (e.g., sleep tasks that go past midnight)
          let endHours, endMins;
          if (endTotalMinutes >= 1440) { // 24 hours = 1440 minutes
            // Task goes into next day
            endHours = Math.floor((endTotalMinutes - 1440) / 60);
            endMins = (endTotalMinutes - 1440) % 60;

            // For tasks that cross midnight, we'll cap them at 23:59:59
            endHours = 23;
            endMins = 59;
            timeEnd = '23:59:59';

            console.log(`Task "${slot.activity}" crosses midnight, capping at 23:59:59`);
          } else {
            endHours = Math.floor(endTotalMinutes / 60);
            endMins = endTotalMinutes % 60;
            timeEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
          }

          console.log(`Creating task: ${slot.activity} from ${timeStart} to ${timeEnd} (${duration} minutes)`);

          // Validate that end time is after start time
          const startTime = new Date(`1970-01-01T${timeStart}`);
          const endTime = new Date(`1970-01-01T${timeEnd}`);

          if (endTime <= startTime) {
            console.warn(`Invalid time range for "${slot.activity}": ${timeStart} to ${timeEnd}. Adjusting...`);
            // Adjust end time to be at least 30 minutes after start
            const adjustedEndTime = new Date(startTime.getTime() + 30 * 60 * 1000);
            timeEnd = adjustedEndTime.toTimeString().split(' ')[0];
            console.log(`Adjusted end time to: ${timeEnd}`);
          }

          // Handle category creation/lookup
          let categoryId: string | null = null;
          const categoryName = slot.category || 'Personal';

          const category = await this.createOrFindCategory(userId, categoryName);
          if (category) {
            categoryId = category.id;
          }

          // Prepare task data
          const taskData = {
            user_id: userId,
            name: slot.activity,
            time_start: timeStart,
            time_end: timeEnd,
            category_id: categoryId,
            category_name: categoryName, // Store category name directly as fallback
            duration: duration,
            time_block: this.getTimeBlockFromTime(timeStart.split(':')[0]), // Pass just the hour
            position: index,
            is_active: false,
            scheduled_date: scheduledDate,
          };

          console.log('Inserting task data:', taskData);

          // Insert single task
          const { data, error } = await supabase
            .from("tasks")
            .insert(taskData)
            .select(`*, categories (*)`)
            .single();

          if (error) {
            console.error('Database error for task:', slot.activity, error);

            // Try to provide more specific error handling
            if (error.message.includes('range lower bound')) {
              console.error(`Time range issue: ${timeStart} to ${timeEnd}`);
              // Skip this task and continue with others
              continue;
            }

            throw new Error(`Failed to save task "${slot.activity}": ${error.message}`);
          }

          if (data) {
            const transformedTask = TaskService.transformDatabaseTaskToTask(data);
            createdTasks.push(transformedTask);
            console.log(`Successfully created task: ${slot.activity}`);
          }

        } catch (taskError) {
          console.error(`Error creating task "${slot.activity}":`, taskError);
          // Continue with other tasks even if one fails
        }
      }

      console.log(`Successfully created ${createdTasks.length} out of ${timeSlots.length} tasks`);
      return createdTasks;

    } catch (error) {
      console.error("Error creating tasks from schedule:", error);
      throw error;
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
      // Handle category creation/lookup if needed
      let categoryId = taskData.categoryId;
      if (!categoryId && taskData.category) {
        const category = await this.createOrFindCategory(userId, taskData.category);
        categoryId = category?.id;
      }

      // First check if time slot is available using basic validation
      const timeStart = TaskService.extractTimeFromTimeString(taskData.time);

      const endDate = new Date(`1970-01-01T${timeStart}`);
      endDate.setMinutes(endDate.getMinutes() + taskData.duration);
      endDate.setSeconds(endDate.getSeconds() - 1);

      const timeEnd = endDate.toTimeString().split(' ')[0];

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

      // Prepare insert data
      const insertData: any = {
        user_id: userId,
        name: taskData.name,
        time_start: timeStart,
        time_end: timeEnd,
        category_id: categoryId || null,
        category_name: taskData.category, // Store category name as fallback
        duration: taskData.duration,
        time_block: taskData.block,
        position: position,
      };

      // Only add these fields if they're provided
      if (taskData.scheduledDate) {
        insertData.scheduled_date = taskData.scheduledDate;
      }
      if (taskData.priority !== undefined) {
        insertData.priority = taskData.priority;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select(`*, categories (*)`)
        .single();

      if (error) {
        if (error.message.includes('exclusion constraint')) {
          throw new Error(`This time slot overlaps with an existing task.`);
        }
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return TaskService.transformDatabaseTaskToTask(data);

    } catch (error) {
      console.error('Error in TaskService.createTask:', error);
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

      // Handle category updates
      if (updates.category || updates.categoryId !== undefined) {
        if (updates.categoryId) {
          updateData.category_id = updates.categoryId;
        } else if (updates.category) {
          // Find or create category
          const { data: taskData } = await supabase
            .from('tasks')
            .select('user_id')
            .eq('id', taskId)
            .single();

          if (taskData) {
            const category = await this.createOrFindCategory(taskData.user_id, updates.category);
            updateData.category_id = category?.id;
          }
        }
        updateData.category_name = updates.category;
      }

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
        .select(`*, categories (*)`)
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

  // Rest of the methods remain the same...
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { data: taskToDelete, error: fetchError } = await supabase
        .from('tasks')
        .select('user_id, name')
        .eq('id', taskId)
        .single();

      if (fetchError) {
        console.error('Error fetching task to delete:', fetchError);
        throw new Error(`Failed to fetch task for deletion: ${fetchError.message}`);
      }

      if (taskToDelete) {
        await TaskService.cleanupTaskFromProgressData(taskId, taskToDelete.name);
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
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

  // Enhanced transform function to handle both category_id and category_name
  static transformDatabaseTaskToTask(dbTask: DatabaseTask): Task {
    // Use category from joined table, or fall back to category_name column
    let categoryName = 'Personal'; // Default fallback

    if (dbTask.categories?.name) {
      categoryName = dbTask.categories.name;
    } else if (dbTask.category_name) {
      categoryName = dbTask.category_name;
    }

    return {
      id: dbTask.id,
      name: dbTask.name,
      time: TaskService.formatTimeRange(dbTask.time_start, dbTask.time_end),
      category: categoryName,
      duration: dbTask.duration,
      block: dbTask.time_block,
    };
  }

  // All other helper methods remain the same...
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
    const formatTime = (time: string, isEndTime: boolean = false) => {
      let [hours, minutes, seconds] = time.split(':').map(Number);

      if (isEndTime && seconds === 59) {
        const d = new Date();
        d.setHours(hours, minutes, seconds);
        d.setSeconds(d.getSeconds() + 1);
        hours = d.getHours();
        minutes = d.getMinutes();
      }

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(startTime)}-${formatTime(endTime, true)}`;
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

        if (
          (newTaskTimeRange.start < taskTimeRange.end &&
           newTaskTimeRange.end > taskTimeRange.start)
        ) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return true;
    }
  }

  static parseTimeString(timeString: string): { start: Date; end: Date } {
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

    const actualStartPeriod = startPeriod || endPeriod;
    if (actualStartPeriod?.toUpperCase() === 'PM' && startHour24 !== 12) {
      startHour24 += 12;
    } else if (actualStartPeriod?.toUpperCase() === 'AM' && startHour24 === 12) {
      startHour24 = 0;
    }

    if (endPeriod?.toUpperCase() === 'PM' && endHour24 !== 12) {
      endHour24 += 12;
    } else if (endPeriod?.toUpperCase() === 'AM' && endHour24 === 12) {
      endHour24 = 0;
    }

    start.setHours(startHour24, parseInt(startMin), 0, 0);
    end.setHours(endHour24, parseInt(endMin), 0, 0);

    return { start, end };
  }

  static async cleanupTaskFromProgressData(taskId: string, taskName: string): Promise<void> {
    try {
      const { data: dailyDataEntries, error: fetchError } = await supabase
        .from('daily_data')
        .select('id, incomplete_task_ids, incomplete_tasks, completion_percentage')
        .or(`incomplete_task_ids.cs.{${taskId}},incomplete_tasks.cs.{${taskName}}`);

      if (fetchError) {
        console.warn('Error fetching daily data for cleanup:', fetchError);
        return;
      }

      if (!dailyDataEntries || dailyDataEntries.length === 0) {
        console.log('No daily data entries found containing this task');
        return;
      }

      for (const entry of dailyDataEntries) {
        const updates: any = {};
        let needsUpdate = false;

        if (entry.incomplete_task_ids && Array.isArray(entry.incomplete_task_ids)) {
          const cleanedTaskIds = entry.incomplete_task_ids.filter((id: string) => id !== taskId);
          if (cleanedTaskIds.length !== entry.incomplete_task_ids.length) {
            updates.incomplete_task_ids = cleanedTaskIds;
            needsUpdate = true;
          }
        }

        if (entry.incomplete_tasks && Array.isArray(entry.incomplete_tasks)) {
          const cleanedTasks = entry.incomplete_tasks.filter((name: string) => name !== taskName);
          if (cleanedTasks.length !== entry.incomplete_tasks.length) {
            updates.incomplete_tasks = cleanedTasks;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
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