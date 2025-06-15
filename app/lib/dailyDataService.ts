import { supabase } from './supabase'
import { DayProgress, ProgressData } from './types'

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