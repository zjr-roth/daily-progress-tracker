import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProgressData, DayProgress, Task } from '../lib/types';
import { useLocalStorage } from './useLocalStorage';
import { tasks } from '../data/tasks';
import { formatDate } from '../lib/utils';

export function useProgressData() {
  const [progressData, setProgressData] = useLocalStorage<ProgressData>('dailyProgressData', {});
  const [currentDate, setCurrentDate] = useState<string>('');

  // Set current date after component mounts to avoid hydration issues
  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  const isTaskCompleted = useCallback((taskId: string, date: string): boolean => {
    if (!progressData[date]) {
      return false;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const incompleteTasks = progressData[date].incompleteTasks || [];
    return !incompleteTasks.includes(task.name);
  }, [progressData]);

  const updateTaskCompletion = useCallback((taskId: string, isCompleted: boolean, date: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

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
  }, [setProgressData]);

  const getDateProgress = useCallback((date: string): DayProgress => {
    return progressData[date] || {
      completionPercentage: 0,
      incompleteTasks: tasks.map(t => t.name)
    };
  }, [progressData]);

  const goToToday = useCallback(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    progressData,
    currentDate,
    setCurrentDate,
    isTaskCompleted,
    updateTaskCompletion,
    getDateProgress,
    goToToday,
    setProgressData
  }), [
    progressData,
    currentDate,
    isTaskCompleted,
    updateTaskCompletion,
    getDateProgress,
    goToToday,
    setProgressData
  ]);
}