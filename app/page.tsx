"use client";

import React, { useState, useEffect } from "react";
import { Download, LogOut, Loader2, Settings, Sparkles } from "lucide-react";
import { useProgressData } from "./hooks/useProgressData";
import { DateSelector } from "./components/DateSelector";
import { ProgressCircle } from "./components/ProgressCircle";
import { CategoryStats } from "./components/CategoryStats";
import { TaskList } from "./components/TaskList";
import { ProgressChart } from "./components/ProgressChart";
import { AnalysisSection } from "./components/AnalysisSection";
import { StreakStats } from "./components/StreakStats";
import { ScheduleCustomization } from "./components/ScheduleCustomization";
import { AIOnboardingFlow } from "./components/AIOnboardingFlow";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { tasks as defaultTasks } from "./data/tasks";
import { Task } from "./lib/types";
import {
	formatDisplayDate,
	calculateCategoryStats,
	calculateStreakData,
	exportToCSV,
} from "./lib/utils";
import Image from "next/image";

const randomGreeting = [
	"Hey",
	"Hello",
	"Hi",
	"Let's get after it",
	"Welcome back",
	"Good to see you",
	"Let's level up",
	"Let's get it",
	"Ready to seize the day",
];

// Get consistent daily greeting based on current date
const getDailyGreeting = () => {
	const today = new Date();
	const dateString = today.toDateString();

	let hash = 0;
	for (let i = 0; i < dateString.length; i++) {
		const char = dateString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	const index = Math.abs(hash) % randomGreeting.length;
	return randomGreeting[index];
};

function DashboardContent() {
	const { user, signOut } = useAuth();
	const {
		progressData,
		currentDate,
		setCurrentDate,
		isTaskCompleted,
		updateTaskCompletion,
		getDateProgress,
		goToToday,
		loading,
		error,
		refreshData,
	} = useProgressData();

	// Local state for task management
	const [tasks, setTasks] = useState<Task[]>(defaultTasks);
	const [showCustomization, setShowCustomization] = useState(false);
	const [showAIOnboarding, setShowAIOnboarding] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);

	// Check if user is new (has no progress data)
	useEffect(() => {
		if (user && Object.keys(progressData).length === 0 && !loading) {
			// Show AI onboarding for new users after a brief delay
			const timer = setTimeout(() => {
				setIsNewUser(true);
				setShowAIOnboarding(true);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [user, progressData, loading]);

	// Don't render anything until currentDate is set to avoid hydration issues
	if (!currentDate) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
						<div className="text-lg text-muted-foreground">
							Loading...
						</div>
					</div>
				</div>
			</div>
		);
	}

	const dateProgress = getDateProgress(currentDate);
	const completedTasks = tasks.length - dateProgress.incompleteTasks.length;
	const categoryStats = calculateCategoryStats(tasks, dateProgress);
	const streakData = calculateStreakData(progressData);

	const handleTaskToggle = (taskId: string, completed: boolean) => {
		updateTaskCompletion(taskId, completed, currentDate);
	};

	const handleTaskEdit = (taskId: string, updatedTask: Partial<Task>) => {
		setTasks((prevTasks) =>
			prevTasks.map((task) =>
				task.id === taskId ? { ...task, ...updatedTask } : task
			)
		);

		// Show success message
		showToast("Task updated successfully!", "success");
	};

	const handleTasksUpdate = (updatedTasks: Task[]) => {
		setTasks(updatedTasks);

		// Recalculate progress based on new task list
		recalculateProgressForNewTasks(updatedTasks);

		showToast("Schedule updated successfully!", "success");
	};

	// Function to recalculate progress when tasks change
	const recalculateProgressForNewTasks = async (newTasks: Task[]) => {
		if (!user?.id) return;

		try {
			// Get current progress data to find which tasks are incomplete
			const currentProgress = getDateProgress(currentDate);
			const currentIncompleteTaskIds =
				currentProgress.incompleteTaskIds || [];

			// Filter incomplete task IDs to only include tasks that still exist
			const existingTaskIds = newTasks.map((task) => task.id);
			const validIncompleteTaskIds = currentIncompleteTaskIds.filter(
				(taskId) => existingTaskIds.includes(taskId)
			);

			// Convert to task names for backward compatibility
			const validIncompleteTasks = newTasks
				.filter((task) => validIncompleteTaskIds.includes(task.id))
				.map((task) => task.name);

			// Recalculate completion percentage
			const totalTasks = newTasks.length;
			const completedTasksCount =
				totalTasks - validIncompleteTaskIds.length;
			const newCompletionPercentage = Math.round(
				(completedTasksCount / totalTasks) * 100
			);

			// Update the progress data if there are changes
			if (
				validIncompleteTaskIds.length !==
					currentIncompleteTaskIds.length ||
				newCompletionPercentage !== currentProgress.completionPercentage
			) {
				await updateTaskCompletion(
					newTasks[0]?.id || "dummy-task",
					true,
					currentDate
				);

				// Force refresh the data to reflect the changes
				refreshData();
			}
		} catch (error) {
			console.error("Error recalculating progress:", error);
		}
	};

	const handleScheduleGenerated = (generatedSchedule: {
		tasks: Task[];
		insights: string[];
		recommendations: string[];
	}) => {
		setTasks(generatedSchedule.tasks);
		setShowAIOnboarding(false);

		// Reset progress for the new schedule
		resetProgressForNewSchedule(generatedSchedule.tasks);

		showToast("Your personalized schedule has been created! 🎉", "success");
	};

	// Function to reset progress when a completely new schedule is generated
	const resetProgressForNewSchedule = async (newTasks: Task[]) => {
		if (!user?.id) return;

		try {
			// Create fresh progress data with all tasks incomplete
			const incompleteTaskIds = newTasks.map((task) => task.id);
			const incompleteTasks = newTasks.map((task) => task.name);

			// Update the current date's progress to reflect the new schedule
			await updateTaskCompletion(
				newTasks[0]?.id || "dummy-task",
				false, // Mark as incomplete to reset
				currentDate
			);

			// Refresh data to show the updated progress
			refreshData();
		} catch (error) {
			console.error("Error resetting progress for new schedule:", error);
		}
	};

	const showToast = (
		message: string,
		type: "success" | "error" = "success"
	) => {
		const toast = document.createElement("div");
		const bgColor =
			type === "success"
				? "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
				: "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";

		toast.className = `fixed top-4 right-4 ${bgColor} border px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-in slide-in-from-right duration-300`;
		toast.textContent = message;
		document.body.appendChild(toast);

		setTimeout(() => {
			if (document.body.contains(toast)) {
				toast.style.animation = "fade-out 300ms ease-in-out forwards";
				setTimeout(() => {
					if (document.body.contains(toast)) {
						document.body.removeChild(toast);
					}
				}, 300);
			}
		}, 3000);
	};

	const handleDateClick = (date: string) => {
		setCurrentDate(date);
	};

	const handleExport = () => {
		exportToCSV(progressData, tasks);
	};

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			{/* Header with User Info */}
			<header className="flex justify-between items-center mb-8">
				<div className="flex items-center">
					<Image
						src="/atomic-logo.png"
						alt="Atomic"
						width={100}
						height={100}
					/>
					<h1 className="text-2xl text-orange-400 font-light">
						Atomic
					</h1>
				</div>

				<div className="flex items-center text-sm text-muted-foreground">
					<div className="flex flex-col items-center">
						<h1 className="text-5xl font-semibold mb-2">
							{getDailyGreeting()}{" "}
							<span>{user?.user_metadata.full_name}</span>!
						</h1>
						{isNewUser && !showAIOnboarding && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowAIOnboarding(true)}
								className="mt-2"
							>
								<Sparkles className="h-4 w-4 mr-2" />
								Create AI Schedule
							</Button>
						)}
					</div>
				</div>

				<div className="flex items-center gap-4">
					{error && (
						<div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-center gap-2">
							<span>{error}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={refreshData}
							>
								Retry
							</Button>
						</div>
					)}

					<Button variant="outline" size="sm" onClick={handleSignOut}>
						<LogOut className="h-4 w-4 mr-2" />
						Sign Out
					</Button>
				</div>
			</header>

			{/* Date Selection and Progress Overview */}
			<Card className="mb-8">
				<CardContent className="p-6">
					<div className="mb-6">
						<DateSelector
							currentDate={currentDate}
							onDateChange={setCurrentDate}
							onGoToToday={goToToday}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
						{/* Progress Circle */}
						<div className="flex items-center gap-4">
							<ProgressCircle
								percentage={dateProgress.completionPercentage}
							/>
							<div>
								<h3 className="text-xl font-semibold mb-1">
									Progress for{" "}
									{
										formatDisplayDate(currentDate).split(
											","
										)[0]
									}
								</h3>
								<p className="text-muted-foreground">
									{completedTasks} of {tasks.length} tasks
									completed
								</p>
								{loading && (
									<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
										<Loader2 className="h-3 w-3 animate-spin" />
										Syncing...
									</p>
								)}
							</div>
						</div>

						{/* Category Stats */}
						<div className="lg:col-span-2">
							<CategoryStats stats={categoryStats} />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Task Lists */}
			<section className="mb-8">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-semibold">
						Daily Schedule & Tasks
					</h2>
					<div className="flex items-center gap-4">
						<div className="text-sm text-muted-foreground">
							Double-click any task to edit • Hover to see edit
							button
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowCustomization(true)}
							>
								<Settings className="h-4 w-4 mr-2" />
								Customize Schedule
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowAIOnboarding(true)}
							>
								<Sparkles className="h-4 w-4 mr-2" />
								AI Assistant
							</Button>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<TaskList
						tasks={tasks}
						timeBlock="morning"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
						onTaskEdit={handleTaskEdit}
					/>
					<TaskList
						tasks={tasks}
						timeBlock="afternoon"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
						onTaskEdit={handleTaskEdit}
					/>
					<TaskList
						tasks={tasks}
						timeBlock="evening"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
						onTaskEdit={handleTaskEdit}
					/>
				</div>
			</section>

			{/* Progress Chart */}
			<section className="mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-semibold">
								Progress History
							</h2>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExport}
								disabled={
									Object.keys(progressData).length === 0
								}
							>
								<Download className="w-4 h-4 mr-2" />
								Export CSV
							</Button>
						</div>
						<ProgressChart
							progressData={progressData}
							onDateClick={handleDateClick}
						/>
					</CardContent>
				</Card>
			</section>

			{/* Analysis Section */}
			<section className="mb-8">
				<h2 className="text-2xl font-semibold mb-6">Task Analysis</h2>
				<AnalysisSection
					currentDate={currentDate}
					progressData={progressData}
				/>
			</section>

			{/* Streak Stats */}
			<section className="mb-8">
				<StreakStats streakData={streakData} />
			</section>

			{/* Modals */}
			{showCustomization && (
				<ScheduleCustomization
					tasks={tasks}
					onTasksUpdate={handleTasksUpdate}
					onClose={() => setShowCustomization(false)}
				/>
			)}

			{showAIOnboarding && (
				<AIOnboardingFlow
					onScheduleGenerated={handleScheduleGenerated}
					onClose={() => setShowAIOnboarding(false)}
					userName={user?.user_metadata.full_name || ""}
				/>
			)}
		</div>
	);
}

export default function HomePage() {
	return (
		<ProtectedRoute>
			<DashboardContent />
		</ProtectedRoute>
	);
}
