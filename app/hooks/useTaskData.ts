// app/hooks/useTaskData.ts - Updated to handle new category system
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TimeBlock } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { TaskService } from '../lib/services/taskService';
import { CategoryService, Category } from '../lib/services/categoryService';

export function useTaskData() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks and categories when user changes
  useEffect(() => {
    if (user?.id) {
      loadTaskData();
      loadCategories();
    } else {
      setTasks([]);
      setCategories([]);
    }
  }, [user?.id]);

  const loadTaskData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userTasks = await TaskService.getUserTasks(user.id);
      setTasks(userTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCategories = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userCategories = await CategoryService.getUserCategories(user.id);
      setCategories(userCategories);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError(error.message || 'Failed to load categories');
    }
  }, [user?.id]);

  // Updated to handle automatic category creation
  const createTasksFromSchedule = useCallback(async (timeSlots: any[]) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);
    try {
      const newTasks = await TaskService.createTasksFromSchedule(user.id, timeSlots);

      // Refresh categories after schedule creation (new ones might have been created)
      await loadCategories();

      // Replace existing tasks with the new schedule
      setTasks(newTasks);
      return newTasks;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create schedule tasks";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadCategories]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);
    try {
      // Find category ID by name, or let TaskService create it if it doesn't exist
      const category = categories.find(cat => cat.name === taskData.category);
      const categoryId = category?.id;

      // Add current date as scheduled date
      const scheduledDate = new Date().toISOString().split('T')[0];

      const newTask = await TaskService.createTask(user.id, {
        ...taskData,
        categoryId,
        scheduledDate,
        priority: 1, // Default priority
      });

      // If a new category was created, refresh categories
      if (!category && taskData.category) {
        await loadCategories();
      }

      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMessage = error.message || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categories, loadCategories]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);
    try {
      // Find category ID by name if category is being updated
      let categoryId: string | undefined;
      if (updates.category) {
        const category = categories.find(cat => cat.name === updates.category);
        categoryId = category?.id;

        // If category doesn't exist, TaskService will create it
        if (!category) {
          // We'll refresh categories after the update
        }
      }

      const updatedTask = await TaskService.updateTask(taskId, {
        ...updates,
        categoryId,
      });

      // Refresh categories if a new one might have been created
      if (updates.category && !categories.find(cat => cat.name === updates.category)) {
        await loadCategories();
      }

      setTasks(prevTasks =>
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );
      return updatedTask;
    } catch (error: any) {
      console.error('Error updating task:', error);
      const errorMessage = error.message || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categories, loadCategories]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      await TaskService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      const errorMessage = error.message || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const reorderTasks = useCallback(async (timeBlock: TimeBlock, taskIds: string[]) => {
    if (!user?.id) return;

    try {
      await TaskService.reorderTasks(user.id, timeBlock, taskIds);
      // Update local state to match the new order
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.block !== timeBlock);
        const reorderedTasks = taskIds.map(id =>
          prevTasks.find(task => task.id === id)
        ).filter(Boolean) as Task[];

        return [...otherTasks, ...reorderedTasks];
      });
    } catch (error: any) {
      console.error('Error reordering tasks:', error);
      setError(error.message || 'Failed to reorder tasks');
    }
  }, [user?.id]);

  const createCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);
    try {
      const newCategory = await CategoryService.createCategory(user.id, categoryData);
      setCategories(prevCategories => [...prevCategories, newCategory]);
      return newCategory;
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage = error.message || 'Failed to create category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<Category>) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);
    try {
      const updatedCategory = await CategoryService.updateCategory(categoryId, updates);
      setCategories(prevCategories =>
        prevCategories.map(cat => cat.id === categoryId ? updatedCategory : cat)
      );

      // Update tasks that use this category
      if (updates.name) {
        setTasks(prevTasks =>
          prevTasks.map(task => {
            const taskCategory = categories.find(cat => cat.name === task.category);
            if (taskCategory?.id === categoryId) {
              return { ...task, category: updates.name! };
            }
            return task;
          })
        );
      }

      return updatedCategory;
    } catch (error: any) {
      console.error('Error updating category:', error);
      const errorMessage = error.message || 'Failed to update category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categories]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      await CategoryService.deleteCategory(categoryId);
      setCategories(prevCategories =>
        prevCategories.filter(cat => cat.id !== categoryId)
      );

      // Update tasks that used this category to 'Personal'
      setTasks(prevTasks =>
        prevTasks.map(task => {
          const taskCategory = categories.find(cat => cat.name === task.category);
          if (taskCategory?.id === categoryId) {
            return { ...task, category: 'Personal' };
          }
          return task;
        })
      );
    } catch (error: any) {
      console.error('Error deleting category:', error);
      const errorMessage = error.message || 'Failed to delete category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, categories]);

  const getTasksByTimeBlock = useCallback((timeBlock: TimeBlock) => {
    return tasks.filter(task => task.block === timeBlock);
  }, [tasks]);

  const refreshData = useCallback(() => {
    loadTaskData();
    loadCategories();
  }, [loadTaskData, loadCategories]);

  return useMemo(() => ({
    tasks,
    categories,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    createCategory,
    updateCategory,
    deleteCategory,
    getTasksByTimeBlock,
    refreshData,
    createTasksFromSchedule,
  }), [
    tasks,
    categories,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    createCategory,
    updateCategory,
    deleteCategory,
    getTasksByTimeBlock,
    refreshData,
    createTasksFromSchedule,
  ]);
}