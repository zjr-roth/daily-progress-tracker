"use client";

import React from "react";
import { ProgressData } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface AnalysisSectionProps {
	currentDate: string;
	progressData: ProgressData;
}

export function AnalysisSection({
	currentDate,
	progressData,
}: AnalysisSectionProps) {
	const dateData = progressData[currentDate];
	const incompleteTasks = dateData?.incompleteTasks || [];

	// Calculate performance insights
	const dates = Object.keys(progressData).sort();
	const getPerformanceInsights = () => {
		if (dates.length === 0) {
			return ["No data available for insights"];
		}

		const completionPercentages = dates.map(
			(date) => progressData[date].completionPercentage
		);
		const average = Math.round(
			completionPercentages.reduce((a, b) => a + b, 0) /
				completionPercentages.length
		);
		const highPerformanceDays = completionPercentages.filter(
			(p) => p >= 80
		).length;
		const perfectDays = completionPercentages.filter(
			(p) => p === 100
		).length;

		// Most common incomplete tasks
		const allIncompleteTasks = dates.flatMap(
			(date) => progressData[date].incompleteTasks
		);
		const taskFrequency: Record<string, number> = {};
		allIncompleteTasks.forEach((task) => {
			taskFrequency[task] = (taskFrequency[task] || 0) + 1;
		});

		const mostProblematicTask =
			Object.keys(taskFrequency).length > 0
				? Object.keys(taskFrequency).reduce((a, b) =>
						taskFrequency[a] > taskFrequency[b] ? a : b
				  )
				: null;

		return [
			`Average completion rate: ${average}%`,
			`High performance days (≥80%): ${highPerformanceDays}`,
			`Perfect days (100%): ${perfectDays}`,
			mostProblematicTask
				? `Most missed task: ${mostProblematicTask}`
				: "Great consistency!",
		];
	};

	const insights = getPerformanceInsights();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{/* Incomplete Tasks */}
			<Card>
				<CardHeader>
					<CardTitle>Incomplete Tasks</CardTitle>
				</CardHeader>
				<CardContent>
					{incompleteTasks.length === 0 ? (
						<p className="text-muted-foreground">
							All tasks completed! 🎉
						</p>
					) : (
						<div className="space-y-2">
							{incompleteTasks.map((taskName, index) => (
								<div
									key={index}
									className="flex items-center p-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded"
								>
									<span className="text-sm">{taskName}</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Performance Insights */}
			<Card>
				<CardHeader>
					<CardTitle>Performance Insights</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{insights.map((insight, index) => (
							<div
								key={index}
								className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded"
							>
								<span className="text-sm">{insight}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
