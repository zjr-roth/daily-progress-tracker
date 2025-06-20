"use client";

import React, { useState, useEffect } from "react";
import {
	Download,
	LogOut,
	Loader2,
	Settings,
	Sparkles,
	Plus,
	AlertCircle,
	Brain,
} from "lucide-react";
import { useTaskData } from "./hooks/useTaskData";
import { useProgressData } from "./hooks/useProgressData";
import { DateSelector } from "./components/DateSelector";
import { ProgressCircle } from "./components/ProgressCircle";
import { CategoryStats } from "./components/CategoryStats";
import { TaskList } from "./components/TaskList";
import { ProgressChart } from "./components/ProgressChart";
import { AnalysisSection } from "./components/AnalysisSection";
import { StreakStats } from "./components/StreakStats";
import { ScheduleCustomization } from "./components/ScheduleCustomization";
import { LoadingScreen } from "./components/LoadingScreen";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Task, TimeBlock, Schedule } from "./lib/types";
import {
	formatDisplayDate,
	calculateCategoryStats,
	calculateStreakData,
	exportToCSV,
	checkTimeConflictWithDatabase,
	suggestAlternativeTimeSlotsWithDatabase,
} from "./lib/utils";
import Image from "next/image";
import OnboardingContainer from "./components/onboarding/OnboardingContainer";

const randomGreeting = [
	"Hey",
	"Hello",
	"Hi",
	"Let's get after it",
	"Welcome back",
	"Good to see you",
	"Let's level up",
	"Let's get it",
];

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

/**
 * This component acts as a router ONLY for authenticated users.
 * It should only render if ProtectedRoute has verified the user exists.
 */
function DashboardContent() {
	const { user, markOnboardingComplete, onboardingState, loading } =
		useAuth();
	const { createTasksFromSchedule } = useTaskData();
	const [scheduleGenerating, setScheduleGenerating] = useState(false);

	console.log("DashboardContent render:", {
		userId: user?.id,
		userEmail: user?.email,
		loading,
		onboardingState,
	});

	// CRITICAL: If no user at this point, something is wrong with ProtectedRoute
	// Don't show onboarding - show an error or return null
	if (!user) {
		console.error(
			"DashboardContent: No user found! This should not happen if ProtectedRoute is working correctly."
		);
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-destructive">
						Authentication error. Please refresh the page.
					</p>
				</div>
			</div>
		);
	}

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
		}, 4000);
	};

	const handleScheduleGenerated = async (generatedSchedule: Schedule) => {
		setScheduleGenerating(true);
		try {
			await createTasksFromSchedule(generatedSchedule.timeSlots);
			await markOnboardingComplete();
			showToast(
				"🎉 Your personalized schedule has been created! Welcome to Atomic!",
				"success"
			);
		} catch (error: any) {
			console.error("Error creating schedule tasks:", error);
			showToast(error.message || "Failed to create AI schedule", "error");
		} finally {
			setScheduleGenerating(false);
		}
	};

	// Handle schedule generation loading
	if (scheduleGenerating) {
		console.log("DashboardContent: Generating schedule");
		return (
			<LoadingScreen
				message="Creating your personalized schedule..."
				submessage="Our AI is setting up your tasks and optimizing your daily routine"
			/>
		);
	}

	// Handle onboarding status checking
	if (onboardingState.isCheckingOnboardingStatus) {
		console.log("DashboardContent: Checking onboarding status");
		return <LoadingScreen message="Checking your profile..." />;
	}

	// Show onboarding if not completed
	if (!onboardingState.hasCompletedOnboarding) {
		console.log(
			"DashboardContent: User has not completed onboarding, showing onboarding"
		);
		return (
			<OnboardingContainer
				onScheduleGenerated={handleScheduleGenerated}
			/>
		);
	}

	// Show main dashboard
	console.log(
		"DashboardContent: User authenticated and onboarded, showing main dashboard"
	);
	return <MainDashboard />;
}

/**
 * This component contains the entire UI for your main application dashboard.
 * It will only be rendered if the user has completed onboarding.
 */
function MainDashboard() {
	const { user, signOut } = useAuth();
	const {
		tasks,
		categories,
		loading: taskLoading,
		error: taskError,
		createTasksFromSchedule,
		createTask,
		updateTask,
		deleteTask,
		createCategory,
		updateCategory,
		deleteCategory,
		refreshData: refreshTasks,
	} = useTaskData();

	const {
		progressData,
		currentDate,
		setCurrentDate,
		isTaskCompleted,
		updateTaskCompletion,
		getDateProgress,
		goToToday,
		loading: progressLoading,
		error: progressError,
		refreshData: refreshProgress,
	} = useProgressData(tasks);

	const [showCustomization, setShowCustomization] = useState(false);
	const [onboardingMode, setOnboardingMode] = useState<
		"first-time" | "new-schedule"
	>("first-time");
	const [timeConflictAlert, setTimeConflictAlert] = useState<{
		show: boolean;
		message: string;
		suggestions: Array<{
			start: string;
			end: string;
			type: string;
			recommended: boolean;
		}>;
	}>({ show: false, message: "", suggestions: [] });

	if (!currentDate) {
		return <LoadingScreen message="Loading your dashboard..." />;
	}

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
		}, 4000);
	};

	const dateProgress = getDateProgress(currentDate);
	const completedTasks =
		tasks.length > 0
			? tasks.length -
			  (dateProgress.incompleteTaskIds?.length ||
					dateProgress.incompleteTasks.length)
			: 0;
	const categoryStats = calculateCategoryStats(tasks, dateProgress);
	const streakData = calculateStreakData(progressData);

	const handleTaskToggle = async (taskId: string, completed: boolean) => {
		try {
			await updateTaskCompletion(taskId, completed, currentDate);
		} catch (error) {
			showToast("Failed to update task completion", "error");
		}
	};

	const handleTaskEdit = async (
		taskId: string,
		updatedTask: Partial<Task>
	) => {
		try {
			if (updatedTask.time && user?.id) {
				const conflict = await checkTimeConflictWithDatabase(
					user.id,
					updatedTask.time,
					updatedTask.duration || 0,
					currentDate,
					taskId
				);
				if (conflict.hasConflict) {
					const suggestions =
						await suggestAlternativeTimeSlotsWithDatabase(
							user.id,
							updatedTask.duration || 0,
							updatedTask.block,
							currentDate
						);
					setTimeConflictAlert({
						show: true,
						message:
							"This time slot conflicts with an existing task",
						suggestions,
					});
					return;
				}
			}
			await updateTask(taskId, updatedTask);
			showToast("Task updated successfully!", "success");
		} catch (error: any) {
			showToast(error.message || "Failed to update task", "error");
		}
	};

	const handleTaskDelete = async (taskId: string) => {
		try {
			await deleteTask(taskId);
			showToast("Task deleted successfully!", "success");
		} catch (error: any) {
			showToast(error.message || "Failed to delete task", "error");
		}
	};

	const handleNewScheduleClick = () => {
		setOnboardingMode("new-schedule");
		// This state change would need to be handled to show the OnboardingContainer again
		// For now, this button might need a different implementation if used outside the initial onboarding
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

	const refreshAllData = () => {
		refreshTasks();
		refreshProgress();
	};

	const loading = taskLoading || progressLoading;
	const error = taskError || progressError;

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
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
						<h1 className="text-sm text-nowrap sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2">
							{getDailyGreeting()}{" "}
							<span>{user?.user_metadata.full_name}</span>!
						</h1>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{error && (
						<div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							<span>{error}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={refreshAllData}
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

			{timeConflictAlert.show && (
				<div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					{/* ... Time Conflict Alert JSX ... */}
				</div>
			)}

			<div className="flex flex-col gap-6 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="mb-6">
							<DateSelector
								currentDate={currentDate}
								onDateChange={setCurrentDate}
								onGoToToday={goToToday}
							/>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
							<div className="flex items-center gap-4">
								<ProgressCircle
									percentage={
										dateProgress.completionPercentage
									}
								/>
								<div>
									<h3 className="text-xl font-semibold mb-1">
										Progress for{" "}
										{
											formatDisplayDate(
												currentDate
											).split(",")[0]
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
							<div className="lg:col-span-2">
								{tasks.length > 0 ? (
									<CategoryStats stats={categoryStats} />
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<p className="text-lg mb-2">
											No tasks yet!
										</p>
										<p className="text-sm">
											Create your first schedule to get
											started
										</p>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{tasks.length > 0 ? (
					<section>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-semibold">
								Daily Schedule & Tasks
							</h2>
							<div className="flex items-center gap-4">
								<div className="text-sm text-muted-foreground">
									Double-click any task to edit • Hover to see
									edit button
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setShowCustomization(true)
										}
									>
										<Settings className="h-4 w-4 mr-2" />
										Customize
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleNewScheduleClick}
									>
										<Brain className="h-4 w-4 mr-2" />
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
								onTaskDelete={handleTaskDelete}
							/>
							<TaskList
								tasks={tasks}
								timeBlock="afternoon"
								isTaskCompleted={(taskId) =>
									isTaskCompleted(taskId, currentDate)
								}
								onTaskToggle={handleTaskToggle}
								onTaskEdit={handleTaskEdit}
								onTaskDelete={handleTaskDelete}
							/>
							<TaskList
								tasks={tasks}
								timeBlock="evening"
								isTaskCompleted={(taskId) =>
									isTaskCompleted(taskId, currentDate)
								}
								onTaskToggle={handleTaskToggle}
								onTaskEdit={handleTaskEdit}
								onTaskDelete={handleTaskDelete}
							/>
						</div>
					</section>
				) : (
					<section>
						<Card>
							<CardContent className="p-12 text-center">
								<div className="max-w-md mx-auto">
									<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
										<Plus className="h-8 w-8 text-primary" />
									</div>
									<h3 className="text-xl font-semibold mb-2">
										Ready to get organized?
									</h3>
									<p className="text-muted-foreground mb-6">
										Create your personalized daily schedule
										to start tracking your productivity
									</p>
									<div className="flex gap-3 justify-center">
										<Button
											onClick={handleNewScheduleClick}
										>
											<Sparkles className="h-4 w-4 mr-2" />
											Create with AI
										</Button>
										<Button
											variant="outline"
											onClick={() =>
												setShowCustomization(true)
											}
										>
											<Plus className="h-4 w-4 mr-2" />
											Add Manually
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</section>
				)}
			</div>

			{Object.keys(progressData).length > 0 && (
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
			)}

			{tasks.length > 0 && Object.keys(progressData).length > 0 && (
				<section className="mb-8">
					<h2 className="text-2xl font-semibold mb-6">
						Task Analysis
					</h2>
					<AnalysisSection
						currentDate={currentDate}
						progressData={progressData}
					/>
				</section>
			)}

			{Object.keys(progressData).length > 0 && (
				<section className="mb-8">
					<StreakStats streakData={streakData} />
				</section>
			)}

			{showCustomization && (
				<ScheduleCustomization
					tasks={tasks}
					categories={categories}
					onTaskCreate={createTask}
					onTaskUpdate={updateTask}
					onTaskDelete={deleteTask}
					onCategoryCreate={createCategory}
					onCategoryUpdate={updateCategory}
					onCategoryDelete={deleteCategory}
					onClose={() => setShowCustomization(false)}
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
