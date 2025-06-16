import { supabase } from '../supabase'
import { DayProgress, ProgressData } from '../types'

export class DailyDataService {
  static async getDailyProgress(userId: string, date: string): Promise<DayProgress | null> {
    try {
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return null
      }

      return {
        completionPercentage: data.completion_percentage,
        incompleteTasks: data.incomplete_tasks || [],
        incompleteTaskIds: data.incomplete_task_ids || []
      }
    } catch (error) {
      console.error('Error fetching daily progress:', error)
      throw error
    }
  }

  static async getProgressData(userId: string): Promise<ProgressData> {
    try {
      const { data, error } = await supabase
        .from('daily_data')
        .select('date, completion_percentage, incomplete_tasks, incomplete_task_ids')
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (error) throw error

      const progressData: ProgressData = {}

      if (data) {
        data.forEach((item) => {
          progressData[item.date] = {
            completionPercentage: item.completion_percentage,
            incompleteTasks: item.incomplete_tasks || [],
            incompleteTaskIds: item.incomplete_task_ids || []
          }
        })
      }

      return progressData
    } catch (error) {
      console.error('Error fetching progress data:', error)
      throw error
    }
  }

  static async updateTaskCompletion(
    userId: string,
    date: string,
    incompleteTasks: string[],
    completionPercentage: number,
    incompleteTaskIds?: string[]
  ): Promise<void> {
    try {
      const updateData: any = {
        user_id: userId,
        date: date,
        incomplete_tasks: incompleteTasks,
        completion_percentage: completionPercentage,
        updated_at: new Date().toISOString()
      }

      // Add incomplete_task_ids if provided
      if (incompleteTaskIds !== undefined) {
        updateData.incomplete_task_ids = incompleteTaskIds
      }

      const { error } = await supabase
        .from('daily_data')
        .upsert(updateData, {
          onConflict: 'user_id,date'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating task completion:', error)
      throw error
    }
  }

  static async createDailyEntry(
    userId: string,
    date: string,
    incompleteTasks: string[],
    incompleteTaskIds?: string[]
  ): Promise<void> {
    try {
      const insertData: any = {
        user_id: userId,
        date: date,
        incomplete_tasks: incompleteTasks,
        completion_percentage: 0,
        tasks: [],
        schedule_items: [],
        progress_metrics: {},
        completion_status: {}
      }

      // Add incomplete_task_ids if provided
      if (incompleteTaskIds !== undefined) {
        insertData.incomplete_task_ids = incompleteTaskIds
      }

      const { error } = await supabase
        .from('daily_data')
        .insert(insertData)

      if (error && error.code !== '23505') { // Ignore unique constraint violation
        throw error
      }
    } catch (error) {
      console.error('Error creating daily entry:', error)
      throw error
    }
  }

  static async deleteDailyData(userId: string, date: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('daily_data')
        .delete()
        .eq('user_id', userId)
        .eq('date', date)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting daily data:', error)
      throw error
    }
  }

  // NEW: Clean up references to a deleted task across all dates
  static async cleanupDeletedTaskReferences(
    userId: string,
    deletedTaskId: string,
    deletedTaskName: string
  ): Promise<void> {
    try {
      console.log(`Starting cleanup for deleted task: ${deletedTaskId} (${deletedTaskName})`);

      // Get all daily data entries for this user that might contain the deleted task
      const { data: dailyEntries, error: fetchError } = await supabase
        .from('daily_data')
        .select('id, date, incomplete_task_ids, incomplete_tasks, completion_percentage')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching daily data for cleanup:', fetchError);
        return;
      }

      if (!dailyEntries || dailyEntries.length === 0) {
        console.log('No daily data entries found for user');
        return;
      }

      // Process each entry that contains references to the deleted task
      for (const entry of dailyEntries) {
        let needsUpdate = false;
        const updates: any = {};

        // Clean up incomplete_task_ids array
        if (entry.incomplete_task_ids && Array.isArray(entry.incomplete_task_ids)) {
          const originalLength = entry.incomplete_task_ids.length;
          const cleanedTaskIds = entry.incomplete_task_ids.filter((id: string) => id !== deletedTaskId);

          if (cleanedTaskIds.length !== originalLength) {
            updates.incomplete_task_ids = cleanedTaskIds;
            needsUpdate = true;
            console.log(`Removed task ID ${deletedTaskId} from date ${entry.date}`);
          }
        }

        // Clean up incomplete_tasks array (for backward compatibility)
        if (entry.incomplete_tasks && Array.isArray(entry.incomplete_tasks)) {
          const originalLength = entry.incomplete_tasks.length;
          const cleanedTasks = entry.incomplete_tasks.filter((name: string) => name !== deletedTaskName);

          if (cleanedTasks.length !== originalLength) {
            updates.incomplete_tasks = cleanedTasks;
            needsUpdate = true;
            console.log(`Removed task name "${deletedTaskName}" from date ${entry.date}`);
          }
        }

        // Update the entry if changes were made
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('daily_data')
            .update(updates)
            .eq('id', entry.id);

          if (updateError) {
            console.error(`Error updating daily data entry ${entry.id}:`, updateError);
          } else {
            console.log(`Successfully cleaned up daily data entry for ${entry.date}`);
          }
        }
      }

      console.log(`Completed cleanup for deleted task: ${deletedTaskId}`);
    } catch (error) {
      console.error('Error during task cleanup:', error);
      // Don't throw - we want the task deletion to succeed even if cleanup fails
    }
  }

  // NEW: Recalculate completion percentages for a specific date based on current tasks
  static async recalculateCompletionForDate(
    userId: string,
    date: string,
    currentTasks: { id: string; name: string }[]
  ): Promise<void> {
    try {
      // Get the current progress data for this date
      const { data: currentEntry, error: fetchError } = await supabase
        .from('daily_data')
        .select('incomplete_task_ids, incomplete_tasks, completion_percentage')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current entry for recalculation:', fetchError);
        return;
      }

      if (!currentEntry) {
        console.log(`No daily data entry found for ${date}, skipping recalculation`);
        return;
      }

      // Get current task IDs and names
      const currentTaskIds = currentTasks.map(t => t.id);
      const currentTaskNames = currentTasks.map(t => t.name);

      // Clean up incomplete task references to only include existing tasks
      const validIncompleteTaskIds = (currentEntry.incomplete_task_ids || [])
        .filter((id: string) => currentTaskIds.includes(id));

      const validIncompleteTasks = (currentEntry.incomplete_tasks || [])
        .filter((name: string) => currentTaskNames.includes(name));

      // Recalculate completion percentage
      const totalTasks = currentTasks.length;
      const completedTasks = totalTasks - validIncompleteTaskIds.length;
      const newCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Check if we need to update
      const needsUpdate =
        validIncompleteTaskIds.length !== (currentEntry.incomplete_task_ids || []).length ||
        validIncompleteTasks.length !== (currentEntry.incomplete_tasks || []).length ||
        newCompletionPercentage !== currentEntry.completion_percentage;

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('daily_data')
          .update({
            incomplete_task_ids: validIncompleteTaskIds,
            incomplete_tasks: validIncompleteTasks,
            completion_percentage: newCompletionPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('date', date);

        if (updateError) {
          console.error(`Error updating recalculated data for ${date}:`, updateError);
        } else {
          console.log(`Recalculated completion for ${date}: ${newCompletionPercentage}% (${completedTasks}/${totalTasks} tasks)`);
        }
      }
    } catch (error) {
      console.error('Error recalculating completion:', error);
    }
  }

  // NEW: Bulk cleanup for when multiple tasks are deleted
  static async bulkCleanupDeletedTasks(
    userId: string,
    deletedTasks: { id: string; name: string }[]
  ): Promise<void> {
    try {
      if (deletedTasks.length === 0) return;

      console.log(`Starting bulk cleanup for ${deletedTasks.length} deleted tasks`);

      const deletedTaskIds = deletedTasks.map(t => t.id);
      const deletedTaskNames = deletedTasks.map(t => t.name);

      // Get all daily data entries for this user
      const { data: dailyEntries, error: fetchError } = await supabase
        .from('daily_data')
        .select('id, date, incomplete_task_ids, incomplete_tasks')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching daily data for bulk cleanup:', fetchError);
        return;
      }

      if (!dailyEntries || dailyEntries.length === 0) {
        console.log('No daily data entries found for bulk cleanup');
        return;
      }

      // Process each entry
      for (const entry of dailyEntries) {
        let needsUpdate = false;
        const updates: any = {};

        // Clean up incomplete_task_ids array
        if (entry.incomplete_task_ids && Array.isArray(entry.incomplete_task_ids)) {
          const originalLength = entry.incomplete_task_ids.length;
          const cleanedTaskIds = entry.incomplete_task_ids.filter((id: string) => !deletedTaskIds.includes(id));

          if (cleanedTaskIds.length !== originalLength) {
            updates.incomplete_task_ids = cleanedTaskIds;
            needsUpdate = true;
          }
        }

        // Clean up incomplete_tasks array
        if (entry.incomplete_tasks && Array.isArray(entry.incomplete_tasks)) {
          const originalLength = entry.incomplete_tasks.length;
          const cleanedTasks = entry.incomplete_tasks.filter((name: string) => !deletedTaskNames.includes(name));

          if (cleanedTasks.length !== originalLength) {
            updates.incomplete_tasks = cleanedTasks;
            needsUpdate = true;
          }
        }

        // Update if needed
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('daily_data')
            .update(updates)
            .eq('id', entry.id);

          if (updateError) {
            console.error(`Error in bulk update for entry ${entry.id}:`, updateError);
          }
        }
      }

      console.log(`Completed bulk cleanup for ${deletedTasks.length} tasks`);
    } catch (error) {
      console.error('Error during bulk cleanup:', error);
    }
  }

  static async getUserData(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users_data')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching user data:', error)
      throw error
    }
  }
}