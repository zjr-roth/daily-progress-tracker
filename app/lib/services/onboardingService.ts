// app/lib/services/onboardingService.ts - Fixed database column references
import { supabase } from '../supabase';
import { UserPreferences } from '../types';

export interface UserPreferencesRecord {
  id: string;
  user_id: string;
  commitments: any[];
  goals: any[];
  custom_goals: string | null;
  sleep_schedule: any;
  work_preferences: any;
  meal_times: any;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class OnboardingService {
  /**
   * Get user's onboarding preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        commitments: data.commitments || [],
        naturalLanguageCommitments: data.natural_language_commitments || '',
        goals: data.goals || [],
        customGoals: data.custom_goals || '',
        sleepSchedule: data.sleep_schedule || {
          wakeUpTime: '',
          bedTime: '',
          sleepDuration: 8,
        },
        workPreferences: data.work_preferences || {
          workType: '',
          peakHours: [],
          breakPreference: '',
          focusBlocks: 2,
        },
        mealTimes: data.meal_times || {
          breakfast: '',
          lunch: '',
          dinner: '',
        },
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  /**
   * Save or update user's onboarding preferences
   */
  static async saveUserPreferences(
    userId: string,
    preferences: UserPreferences,
    isCompleted: boolean = false
  ): Promise<void> {
    try {
      const updateData = {
        user_id: userId,
        commitments: preferences.commitments,
        natural_language_commitments: preferences.naturalLanguageCommitments || '',
        goals: preferences.goals,
        custom_goals: preferences.customGoals || null,
        sleep_schedule: preferences.sleepSchedule,
        work_preferences: preferences.workPreferences,
        meal_times: preferences.mealTimes,
        onboarding_completed: isCompleted,
        onboarding_completed_at: isCompleted ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('user_preferences')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      console.log('User preferences saved successfully');
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Mark onboarding as completed in users_data table
   */
  static async completeOnboarding(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users_data')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId); // Fixed: using 'id' instead of 'user_id'

      if (error) throw error;

      console.log('Onboarding status marked as completed in users_data table');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users_data')
        .select('onboarding_completed')
        .eq('id', userId) // Fixed: using 'id' instead of 'user_id'
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - user hasn't started onboarding
          return false;
        }
        throw error;
      }

      return data?.onboarding_completed || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Get onboarding status with additional details
   */
  static async getOnboardingStatus(userId: string): Promise<{
    hasStarted: boolean;
    isCompleted: boolean;
    completedAt: string | null;
    preferences: UserPreferences | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('users_data')
        .select('*')
        .eq('id', userId) // Fixed: using 'id' instead of 'user_id'
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return {
            hasStarted: false,
            isCompleted: false,
            completedAt: null,
            preferences: null,
          };
        }
        throw error;
      }

      const preferences: UserPreferences = {
        commitments: data.commitments || [],
        naturalLanguageCommitments: data.natural_language_commitments || '',
        goals: data.goals || [],
        customGoals: data.custom_goals || '',
        sleepSchedule: data.sleep_schedule || {
          wakeUpTime: '',
          bedTime: '',
          sleepDuration: 8,
        },
        workPreferences: data.work_preferences || {
          workType: '',
          peakHours: [],
          breakPreference: '',
          focusBlocks: 2,
        },
        mealTimes: data.meal_times || {
          breakfast: '',
          lunch: '',
          dinner: '',
        },
      };

      return {
        hasStarted: true,
        isCompleted: data.onboarding_completed || false,
        completedAt: data.onboarding_completed_at,
        preferences,
      };
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      throw error;
    }
  }

  /**
   * Reset onboarding (for users who want to start over)
   */
  static async resetOnboarding(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users_data')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId); // Fixed: using 'id' instead of 'user_id'

      if (error) throw error;

      console.log('Onboarding reset successfully');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }

  /**
   * Delete user preferences (for account deletion)
   */
  static async deleteUserPreferences(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users_data')
        .delete()
        .eq('id', userId); // Fixed: using 'id' instead of 'user_id'

      if (error) throw error;

      console.log('User preferences deleted successfully');
    } catch (error) {
      console.error('Error deleting user preferences:', error);
      throw error;
    }
  }

  /**
   * Partially update user preferences (for step-by-step saving during onboarding)
   */
  static async updatePreferencesPartial(
    userId: string,
    updates: Partial<{
      commitments: any[];
      naturalLanguageCommitments: string;
      goals: any[];
      customGoals: string;
      sleepSchedule: any;
      workPreferences: any;
      mealTimes: any;
    }>
  ): Promise<void> {
    try {
      const updateData: any = { user_id: userId };

      if (updates.commitments !== undefined) {
        updateData.commitments = updates.commitments;
      }
      if (updates.naturalLanguageCommitments !== undefined) {
        updateData.natural_language_commitments = updates.naturalLanguageCommitments;
      }
      if (updates.goals !== undefined) {
        updateData.goals = updates.goals;
      }
      if (updates.customGoals !== undefined) {
        updateData.custom_goals = updates.customGoals;
      }
      if (updates.sleepSchedule !== undefined) {
        updateData.sleep_schedule = updates.sleepSchedule;
      }
      if (updates.workPreferences !== undefined) {
        updateData.work_preferences = updates.workPreferences;
      }
      if (updates.mealTimes !== undefined) {
        updateData.meal_times = updates.mealTimes;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      console.log('User preferences updated partially');
    } catch (error) {
      console.error('Error updating preferences partially:', error);
      throw error;
    }
  }

  /**
   * Get user onboarding analytics (for admin/analytics purposes)
   */
  static async getOnboardingAnalytics(): Promise<{
    totalUsers: number;
    completedOnboarding: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  }> {
    try {
      // This would typically be restricted to admin users
      const { data: allUsers, error: usersError } = await supabase
        .from('users_data')
        .select('onboarding_completed');

      if (usersError) throw usersError;

      const stats = allUsers.reduce(
        (acc, user) => {
          acc.totalUsers++;
          if (user.onboarding_completed) {
            acc.completedOnboarding++;
          } else {
            acc.notStarted++;
          }
          return acc;
        },
        {
          totalUsers: 0,
          completedOnboarding: 0,
          inProgress: 0,
          notStarted: 0,
        }
      );

      return {
        ...stats,
        completionRate: stats.totalUsers > 0
          ? Math.round((stats.completedOnboarding / stats.totalUsers) * 100)
          : 0,
      };
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      throw error;
    }
  }

  /**
   * Backup user preferences to JSON (for export/backup purposes)
   */
  static async exportUserPreferences(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) {
        throw new Error('No preferences found for user');
      }

      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Error exporting user preferences:', error);
      throw error;
    }
  }

  /**
   * Import user preferences from JSON backup
   */
  static async importUserPreferences(
    userId: string,
    preferencesJson: string
  ): Promise<void> {
    try {
      const preferences = JSON.parse(preferencesJson) as UserPreferences;
      await this.saveUserPreferences(userId, preferences, false);
      console.log('User preferences imported successfully');
    } catch (error) {
      console.error('Error importing user preferences:', error);
      throw error;
    }
  }
}