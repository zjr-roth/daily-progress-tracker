// app/page.tsx - Updated to include Smart Scheduling Assistant
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
import { AIOnboardingFlow } from "./components/AIOnboardingFlow";
/* import { SmartSchedulingAssistant } from "./components/SmartSchedulingAssistant"; */
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Task } from "./lib/types";
import {
	formatDisplayDate,
	calculateCategoryStats,
	calculateStreakData,
	exportToCSV,
	checkTimeConflictWithDatabase,
	suggestAlternativeTimeSlotsWithDatabase,
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
		tasks,
		categories,
		loading: taskLoading,
		error: taskError,
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

	// Local state for UI
	const [showCustomization, setShowCustomization] = useState(false);
	const [showAIOnboarding, setShowAIOnboarding] = useState(false);
	const [showSmartAssistant, setShowSmartAssistant] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);
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

	// Check if user is new (has no tasks)
	useEffect(() => {
		if (user && tasks.length === 0 && !taskLoading && !isNewUser) {
			// Show AI onboarding for new users after a brief delay
			const timer = setTimeout(() => {
				setIsNewUser(true);
				setShowAIOnboarding(true);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [user, tasks, taskLoading, isNewUser]);

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
	const completedTasks =
		tasks.length -
		(dateProgress.incompleteTaskIds?.length ||
			dateProgress.incompleteTasks.length);
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
			// Enhanced time conflict detection using database
			if (updatedTask.time && user?.id) {
				const conflict = await checkTimeConflictWithDatabase(
					user.id,
					updatedTask.time,
					updatedTask.duration || 0,
					currentDate,
					taskId
				);

				if (conflict.hasConflict) {
					// Get enhanced suggestions from database
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

	const handleScheduleGenerated = async (generatedSchedule: {
		tasks: Task[];
		insights: string[];
		recommendations: string[];
	}) => {
		try {
			// Create new tasks from generated schedule
			for (const task of generatedSchedule.tasks) {
				await createTask(task);
			}

			setShowAIOnboarding(false);
			showToast(
				"Your personalized schedule has been created! 🎉",
				"success"
			);
		} catch (error: any) {
			showToast(error.message || "Failed to create AI schedule", "error");
		}
	};

	// Handle smart assistant time slot selection
	const handleTimeSlotSelect = (timeSlot: string, timeBlock: string) => {
		setShowSmartAssistant(false);
		setShowCustomization(true);
		// You could pre-fill the task creation form with the selected time slot
		showToast(`Selected ${timeSlot} in ${timeBlock} block`, "success");
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

	const refreshAllData = () => {
		refreshTasks();
		refreshProgress();
	};

	const loading = taskLoading || progressLoading;
	const error = taskError || progressError;

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

			{/* Time Conflict Alert */}
			{timeConflictAlert.show && (
				<div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
								Scheduling Conflict
							</h3>
							<p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
								{timeConflictAlert.message}
							</p>
							{timeConflictAlert.suggestions.length > 0 && (
								<div>
									<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
										Smart suggestions from your schedule:
									</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										{timeConflictAlert.suggestions.map(
											(suggestion, index) => (
												<Button
													key={index}
													variant="outline"
													size="sm"
													className={`justify-start text-xs ${
														suggestion.recommended
															? "border-primary bg-primary/5"
															: ""
													}`}
													onClick={() => {
														// Could auto-fill the form with this time
														setTimeConflictAlert({
															show: false,
															message: "",
															suggestions: [],
														});
													}}
												>
													<div className="flex items-center gap-2">
														{suggestion.recommended && (
															<Sparkles className="h-3 w-3 text-primary" />
														)}
														<span>
															{suggestion.start} -{" "}
															{suggestion.end}
														</span>
														<span className="text-muted-foreground">
															({suggestion.type})
														</span>
													</div>
												</Button>
											)
										)}
									</div>
								</div>
							)}
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setTimeConflictAlert({
									show: false,
									message: "",
									suggestions: [],
								})
							}
						>
							×
						</Button>
					</div>
				</div>
			)}

			{/* Main Layout with Smart Assistant */}
			<div className="flex flex-col gap-6 mb-8">
				{/* Left Column - Main Content */}
				<div className="xl:col-span-3 space-y-8">
					{/* Date Selection and Progress Overview */}
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
								{/* Progress Circle */}
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
											{completedTasks} of {tasks.length}{" "}
											tasks completed
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
									{tasks.length > 0 ? (
										<CategoryStats stats={categoryStats} />
									) : (
										<div className="text-center py-8 text-muted-foreground">
											<p className="text-lg mb-2">
												No tasks yet!
											</p>
											<p className="text-sm">
												Create your first schedule to
												get started
											</p>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Task Lists or Empty State */}
					{tasks.length > 0 ? (
						<section>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-semibold">
									Daily Schedule & Tasks
								</h2>
								<div className="flex items-center gap-4">
									<div className="text-sm text-muted-foreground">
										Double-click any task to edit • Hover to
										see edit button
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
											onClick={() =>
												setShowAIOnboarding(true)
											}
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
											Create your personalized daily
											schedule to start tracking your
											productivity
										</p>
										<div className="flex gap-3 justify-center">
											<Button
												onClick={() =>
													setShowAIOnboarding(true)
												}
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

				{/* Right Column - Smart Assistant */}
				{/* 	{tasks.length > 0 && user?.id && (
					<div className="xl:col-span-1">
						<SmartSchedulingAssistant
							userId={user.id}
							currentDate={currentDate}
							onTimeSlotSelect={handleTimeSlotSelect}
						/>
					</div>
				)} */}
			</div>

			{/* Progress Chart - Only show if there's progress data */}
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

			{/* Analysis Section - Only show if there's data */}
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

			{/* Streak Stats - Only show if there's progress data */}
			{Object.keys(progressData).length > 0 && (
				<section className="mb-8">
					<StreakStats streakData={streakData} />
				</section>
			)}

			{/* Modals */}
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

			{showAIOnboarding && (
				<AIOnboardingFlow
					onScheduleGenerated={handleScheduleGenerated}
					onClose={() => setShowAIOnboarding(false)}
					userName={user?.user_metadata.full_name || ""}
				/>
			)}

			{/* {showSmartAssistant && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
						<SmartSchedulingAssistant
							userId={user?.id || ""}
							currentDate={currentDate}
							onTimeSlotSelect={handleTimeSlotSelect}
							className="bg-background"
						/>
						<div className="bg-background border-t p-4 flex justify-end">
							<Button
								variant="outline"
								onClick={() => setShowSmartAssistant(false)}
							>
								Close
							</Button>
						</div>
					</div>
				</div>
			)} */}
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
