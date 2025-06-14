import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProgressData, DayProgress, Task } from '../lib/types';
import { tasks } from '../data/tasks';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { DailyDataService } from '../lib/dailyDataService';

export function useProgressData() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [currentDate, setCurrentDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set current date after component mounts to avoid hydration issues
  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  // Load progress data when user changes
  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    } else {
      setProgressData({});
    }
  }, [user?.id]);

  const loadProgressData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await DailyDataService.getProgressData(user.id);
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const isTaskCompleted = useCallback((taskId: string, date: string): boolean => {
    if (!progressData[date]) {
      return false;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const incompleteTasks = progressData[date].incompleteTasks || [];
    return !incompleteTasks.includes(task.name);
  }, [progressData]);

  const updateTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean, date: string) => {
    if (!user?.id) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      // Update local state optimistically
      setProgressData(prevData => {
        const newData = { ...prevData };

        // Initialize date data if it doesn't exist
        if (!newData[date]) {
          newData[date] = {
            completionPercentage: 0,
            incompleteTasks: tasks.map(t => t.name)
          };
        }

        const dateData = { ...newData[date] };
        const incompleteTasks = [...(dateData.incompleteTasks || [])];

        if (isCompleted) {
          // Remove from incomplete tasks
          const index = incompleteTasks.indexOf(task.name);
          if (index > -1) {
            incompleteTasks.splice(index, 1);
          }
        } else {
          // Add to incomplete tasks
          if (!incompleteTasks.includes(task.name)) {
            incompleteTasks.push(task.name);
          }
        }

        // Update completion percentage
        const totalTasks = tasks.length;
        const completedTasks = totalTasks - incompleteTasks.length;
        dateData.completionPercentage = Math.round((completedTasks / totalTasks) * 100);
        dateData.incompleteTasks = incompleteTasks;

        newData[date] = dateData;
        return newData;
      });

      // Calculate updated values for database
      const currentData = progressData[date] || {
        completionPercentage: 0,
        incompleteTasks: tasks.map(t => t.name)
      };

      const incompleteTasks = [...(currentData.incompleteTasks || [])];

      if (isCompleted) {
        const index = incompleteTasks.indexOf(task.name);
        if (index > -1) {
          incompleteTasks.splice(index, 1);
        }
      } else {
        if (!incompleteTasks.includes(task.name)) {
          incompleteTasks.push(task.name);
        }
      }

      const totalTasks = tasks.length;
      const completedTasks = totalTasks - incompleteTasks.length;
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

      // Update database
      await DailyDataService.updateTaskCompletion(
        user.id,
        date,
        incompleteTasks,
        completionPercentage
      );

    } catch (error) {
      console.error('Error updating task completion:', error);
      setError('Failed to update task completion');
      // Reload data to ensure consistency
      loadProgressData();
    } finally {
      setLoading(false);
    }
  }, [user?.id, progressData, loadProgressData]);

  const getDateProgress = useCallback((date: string): DayProgress => {
    return progressData[date] || {
      completionPercentage: 0,
      incompleteTasks: tasks.map(t => t.name)
    };
  }, [progressData]);

  const goToToday = useCallback(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  const refreshData = useCallback(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    progressData,
    currentDate,
    setCurrentDate,
    isTaskCompleted,
    updateTaskCompletion,
    getDateProgress,
    goToToday,
    loading,
    error,
    refreshData
  }), [
    progressData,
    currentDate,
    isTaskCompleted,
    updateTaskCompletion,
    getDateProgress,
    goToToday,
    loading,
    error,
    refreshData
  ]);
}