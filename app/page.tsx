"use client";

import React from "react";
import { Download } from "lucide-react";
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
import { tasks } from "./data/tasks";
import {
	formatDisplayDate,
	calculateCategoryStats,
	calculateStreakData,
	exportToCSV,
} from "./lib/utils";
import Image from "next/image";

export default function HomePage() {
	const {
		progressData,
		currentDate,
		setCurrentDate,
		isTaskCompleted,
		updateTaskCompletion,
		getDateProgress,
		goToToday,
	} = useProgressData();

	// Don't render anything until currentDate is set to avoid hydration issues
	if (!currentDate) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				<div className="flex items-center justify-center h-64">
					<div className="text-lg text-muted-foreground">
						Loading...
					</div>
				</div>
			</div>
		);
	}

	const dateProgress = getDateProgress(currentDate);
	const completedTasks = tasks.length - dateProgress.incompleteTasks.length;
	const categoryStats = calculateCategoryStats(
		tasks,
		dateProgress.incompleteTasks
	);
	const streakData = calculateStreakData(progressData);

	const handleTaskToggle = (taskId: string, completed: boolean) => {
		updateTaskCompletion(taskId, completed, currentDate);
	};

	const handleDateClick = (date: string) => {
		setCurrentDate(date);
	};

	const handleExport = () => {
		exportToCSV(progressData, tasks);
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			{/* Header */}
			<header className="text-left mb-8 flex flex-row items-center">
				<Image
					src="/atomic-logo.png"
					alt="Atomic"
					width={100}
					height={100}
				/>
				<h1 className="text-4xl text-orange-400 font-light">Atomic</h1>
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
				<h2 className="text-2xl font-semibold mb-6">
					Daily Schedule & Tasks
				</h2>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<TaskList
						tasks={tasks}
						timeBlock="morning"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
					/>
					<TaskList
						tasks={tasks}
						timeBlock="afternoon"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
					/>
					<TaskList
						tasks={tasks}
						timeBlock="evening"
						isTaskCompleted={(taskId) =>
							isTaskCompleted(taskId, currentDate)
						}
						onTaskToggle={handleTaskToggle}
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
