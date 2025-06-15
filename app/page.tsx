"use client";

import React, { useState } from "react";
import { Download, LogOut, User, Loader2 } from "lucide-react";
import { useProgressData } from "./hooks/useProgressData";
import { DateSelector } from "./components/DateSelector";
import { ProgressCircle } from "./components/ProgressCircle";
import { CategoryStats } from "./components/CategoryStats";
import { TaskList } from "./components/TaskList";
import { ProgressChart } from "./components/ProgressChart";
import { AnalysisSection } from "./components/AnalysisSection";
import { StreakStats } from "./components/StreakStats";
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
	const dateString = today.toDateString(); // e.g., "Mon Dec 25 2023"

	// Simple hash function to convert date string to number
	let hash = 0;
	for (let i = 0; i < dateString.length; i++) {
		const char = dateString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Use absolute value to ensure positive index
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
		const toast = document.createElement("div");
		toast.className =
			"fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg shadow-lg z-50";
		toast.textContent = "Task updated successfully!";
		document.body.appendChild(toast);

		setTimeout(() => {
			if (document.body.contains(toast)) {
				document.body.removeChild(toast);
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
					<div className="text-sm text-muted-foreground">
						Double-click any task to edit • Hover to see edit button
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
