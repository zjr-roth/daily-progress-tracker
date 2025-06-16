// app/hooks/useProgressData.ts - Enhanced to handle proper task deletion
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProgressData, DayProgress, Task } from '../lib/types';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { DailyDataService } from '../lib/services/dailyDataService';

export function useProgressData(tasks: Task[]) {
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

  // Recalculate progress when tasks change (handles task additions/deletions)
  useEffect(() => {
    if (user?.id && tasks.length >= 0 && currentDate) {
      recalculateProgressForCurrentTasks();
    }
  }, [user?.id, tasks, currentDate]);

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

  // NEW: Recalculate progress to match current tasks
  const recalculateProgressForCurrentTasks = useCallback(async () => {
    if (!user?.id || !currentDate || tasks.length < 0) return;

    try {
      const currentProgress = progressData[currentDate];
      if (!currentProgress) return;

      // Get current task IDs
      const currentTaskIds = tasks.map(t => t.id);
      const currentTaskNames = tasks.map(t => t.name);

      // Clean up incomplete task IDs to only include existing tasks
      const existingIncompleteTaskIds = (currentProgress.incompleteTaskIds || [])
        .filter(id => currentTaskIds.includes(id));

      // Clean up incomplete task names to only include existing tasks
      const existingIncompleteTasks = (currentProgress.incompleteTasks || [])
        .filter(name => currentTaskNames.includes(name));

      // Check if we need to update the progress data
      const needsUpdate =
        existingIncompleteTaskIds.length !== (currentProgress.incompleteTaskIds || []).length ||
        existingIncompleteTasks.length !== (currentProgress.incompleteTasks || []).length;

      if (needsUpdate) {
        // Recalculate completion percentage
        const totalTasks = tasks.length;
        const completedTasks = totalTasks - existingIncompleteTaskIds.length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        // Update local state
        setProgressData(prevData => ({
          ...prevData,
          [currentDate]: {
            ...currentProgress,
            completionPercentage,
            incompleteTaskIds: existingIncompleteTaskIds,
            incompleteTasks: existingIncompleteTasks
          }
        }));

        // Update database
        await DailyDataService.updateTaskCompletion(
          user.id,
          currentDate,
          existingIncompleteTasks,
          completionPercentage,
          existingIncompleteTaskIds
        );

        console.log(`Recalculated progress for ${currentDate}: ${completionPercentage}% (${completedTasks}/${totalTasks} tasks)`);
      }
    } catch (error) {
      console.error('Error recalculating progress:', error);
    }
  }, [user?.id, currentDate, progressData, tasks]);

  const isTaskCompleted = useCallback((taskId: string, date: string): boolean => {
    if (!progressData[date]) {
      return false;
    }

    // Check if this specific task ID is in the incomplete task IDs array
    const incompleteTaskIds = progressData[date].incompleteTaskIds || [];
    return !incompleteTaskIds.includes(taskId);
  }, [progressData]);

  const updateTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean, date: string) => {
    if (!user?.id || tasks.length === 0) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task with ID ${taskId} not found in current tasks`);
      return;
    }

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
            incompleteTasks: tasks.map(t => t.name),
            incompleteTaskIds: tasks.map(t => t.id)
          };
        }

        const dateData = { ...newData[date] };
        const incompleteTaskIds = [...(dateData.incompleteTaskIds || [])];
        const incompleteTasks = [...(dateData.incompleteTasks || [])];

        if (isCompleted) {
          // Remove from incomplete task IDs
          const idIndex = incompleteTaskIds.indexOf(taskId);
          if (idIndex > -1) {
            incompleteTaskIds.splice(idIndex, 1);
          }
          // Remove from incomplete task names (for backward compatibility)
          const nameIndex = incompleteTasks.indexOf(task.name);
          if (nameIndex > -1) {
            incompleteTasks.splice(nameIndex, 1);
          }
        } else {
          // Add to incomplete task IDs
          if (!incompleteTaskIds.includes(taskId)) {
            incompleteTaskIds.push(taskId);
          }
          // Add to incomplete task names (for backward compatibility)
          if (!incompleteTasks.includes(task.name)) {
            incompleteTasks.push(task.name);
          }
        }

        // Update completion percentage based on current tasks
        const totalTasks = tasks.length;
        const completedTasks = totalTasks - incompleteTaskIds.length;
        dateData.completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
        dateData.incompleteTaskIds = incompleteTaskIds;
        dateData.incompleteTasks = incompleteTasks; // Keep for backward compatibility

        newData[date] = dateData;
        return newData;
      });

      // Calculate updated values for database
      const currentData = progressData[date] || {
        completionPercentage: 0,
        incompleteTasks: tasks.map(t => t.name),
        incompleteTaskIds: tasks.map(t => t.id)
      };

      const incompleteTaskIds = [...(currentData.incompleteTaskIds || [])];
      const incompleteTasks = [...(currentData.incompleteTasks || [])];

      if (isCompleted) {
        const idIndex = incompleteTaskIds.indexOf(taskId);
        if (idIndex > -1) {
          incompleteTaskIds.splice(idIndex, 1);
        }
        const nameIndex = incompleteTasks.indexOf(task.name);
        if (nameIndex > -1) {
          incompleteTasks.splice(nameIndex, 1);
        }
      } else {
        if (!incompleteTaskIds.includes(taskId)) {
          incompleteTaskIds.push(taskId);
        }
        if (!incompleteTasks.includes(task.name)) {
          incompleteTasks.push(task.name);
        }
      }

      const totalTasks = tasks.length;
      const completedTasks = totalTasks - incompleteTaskIds.length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Update database
      await DailyDataService.updateTaskCompletion(
        user.id,
        date,
        incompleteTasks, // Keep for backward compatibility
        completionPercentage,
        incompleteTaskIds // Add new field
      );

    } catch (error) {
      console.error('Error updating task completion:', error);
      setError('Failed to update task completion');
      // Reload data to ensure consistency
      loadProgressData();
    } finally {
      setLoading(false);
    }
  }, [user?.id, progressData, tasks, loadProgressData]);

  const getDateProgress = useCallback((date: string): DayProgress => {
    const defaultProgress = {
      completionPercentage: 0,
      incompleteTasks: tasks.map(t => t.name),
      incompleteTaskIds: tasks.map(t => t.id)
    };

    const existingProgress = progressData[date];
    if (!existingProgress) return defaultProgress;

    // Ensure the progress data matches current tasks
    const currentTaskIds = tasks.map(t => t.id);
    const currentTaskNames = tasks.map(t => t.name);

    // Filter out any references to tasks that no longer exist
    const validIncompleteTaskIds = (existingProgress.incompleteTaskIds || [])
      .filter(id => currentTaskIds.includes(id));

    const validIncompleteTasks = (existingProgress.incompleteTasks || [])
      .filter(name => currentTaskNames.includes(name));

    // If the counts don't match, we need to recalculate
    const totalTasks = tasks.length;
    const completedTasks = totalTasks - validIncompleteTaskIds.length;
    const recalculatedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return {
      completionPercentage: recalculatedPercentage,
      incompleteTasks: validIncompleteTasks,
      incompleteTaskIds: validIncompleteTaskIds
    };
  }, [progressData, tasks]);

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