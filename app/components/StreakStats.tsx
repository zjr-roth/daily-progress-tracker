"use client";

import React from "react";
import { StreakData } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface StreakStatsProps {
	streakData: StreakData;
}

export function StreakStats({ streakData }: StreakStatsProps) {
	const stats = [
		{
			label: "Current Streak",
			value: streakData.currentStreak,
			description: "Days ≥80%",
			color: "text-green-600 dark:text-green-400",
		},
		{
			label: "Best Streak",
			value: streakData.maxStreak,
			description: "Best run",
			color: "text-blue-600 dark:text-blue-400",
		},
		{
			label: "Perfect Days",
			value: streakData.perfectStreak,
			description: "100% completion",
			color: "text-purple-600 dark:text-purple-400",
		},
		{
			label: "Total Days",
			value: streakData.totalDays,
			description: "Days tracked",
			color: "text-gray-600 dark:text-gray-400",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Achievement Streaks</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{stats.map((stat, index) => (
						<div
							key={index}
							className="text-center p-4 bg-secondary rounded-lg"
						>
							<div
								className={`text-2xl font-bold mb-1 ${stat.color}`}
							>
								{stat.value}
							</div>
							<div className="text-sm font-medium mb-1">
								{stat.label}
							</div>
							<div className="text-xs text-muted-foreground">
								{stat.description}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
