// app/components/SmartSchedulingAssistant.tsx - Simplified version
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
	Clock,
	Lightbulb,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Zap,
	Target,
	BarChart3,
	Calendar,
	Sparkles,
	RefreshCw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { TaskService } from "../lib/services/taskService";

interface SmartSchedulingAssistantProps {
	userId: string;
	currentDate: string;
	onTimeSlotSelect?: (timeSlot: string, timeBlock: string) => void;
	className?: string;
}

interface SimpleTimeSlot {
	time_slot: string;
	duration: string;
	time_block: string;
	availability_type: string;
	recommended: boolean;
}

export function SmartSchedulingAssistant({
	userId,
	currentDate,
	onTimeSlotSelect,
	className,
}: SmartSchedulingAssistantProps) {
	const [availableSlots, setAvailableSlots] = useState<SimpleTimeSlot[]>([]);
	const [scheduleStats, setScheduleStats] = useState<{
		totalTasks: number;
		completedTasks: number;
		totalTime: number;
		utilizationScore: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("slots");

	useEffect(() => {
		loadSchedulingData();
	}, [userId, currentDate]);

	const loadSchedulingData = async () => {
		setLoading(true);
		try {
			// Get basic available slots
			const slots = await TaskService.getAvailableTimeSlots(
				userId,
				currentDate
			);
			setAvailableSlots(slots);

			// Get basic schedule stats
			const tasks = await TaskService.getUserTasks(userId, currentDate);
			const totalTasks = tasks.length;
			const totalTime = tasks.reduce(
				(sum, task) => sum + task.duration,
				0
			);

			setScheduleStats({
				totalTasks,
				completedTasks: totalTasks, // This would come from progress data in real implementation
				totalTime,
				utilizationScore: Math.min(100, (totalTime / (17 * 60)) * 100), // 17 hours available per day
			});
		} catch (error) {
			console.error("Error loading scheduling data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleTimeSlotClick = (slot: SimpleTimeSlot) => {
		if (onTimeSlotSelect) {
			onTimeSlotSelect(slot.time_slot, slot.time_block);
		}
	};

	const formatTimeUtilization = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours === 0) return `${mins}m`;
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	};

	return (
		<Card className={cn("h-fit", className)}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Sparkles className="h-5 w-5" />
						Smart Scheduling
					</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={loadSchedulingData}
						disabled={loading}
					>
						<RefreshCw
							className={cn("h-4 w-4", loading && "animate-spin")}
						/>
					</Button>
				</div>
			</CardHeader>

			<CardContent>
				<div className="space-y-4">
					{/* Tab Navigation */}
					<div className="flex gap-1 p-1 bg-muted rounded-lg">
						<button
							onClick={() => setActiveTab("slots")}
							className={cn(
								"flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
								activeTab === "slots"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Clock className="h-4 w-4 mr-2 inline" />
							Available
						</button>
						<button
							onClick={() => setActiveTab("insights")}
							className={cn(
								"flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors",
								activeTab === "insights"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Lightbulb className="h-4 w-4 mr-2 inline" />
							Insights
						</button>
					</div>

					{activeTab === "slots" && (
						<div className="space-y-3">
							<h4 className="text-sm font-medium">
								Available Time Slots
							</h4>
							{loading ? (
								<div className="space-y-2">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="h-12 bg-muted animate-pulse rounded"
										/>
									))}
								</div>
							) : availableSlots.length === 0 ? (
								<div className="text-center py-6 text-muted-foreground">
									<Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">
										No available time slots found
									</p>
									<p className="text-xs">
										Your schedule is fully booked!
									</p>
								</div>
							) : (
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{availableSlots.map((slot, index) => (
										<div
											key={index}
											className={cn(
												"p-3 rounded-lg border transition-colors cursor-pointer hover:bg-secondary/50",
												slot.recommended &&
													"border-primary/50 bg-primary/5"
											)}
											onClick={() =>
												handleTimeSlotClick(slot)
											}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Clock className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium text-sm">
														{slot.time_slot}
													</span>
													{slot.recommended && (
														<Badge
															variant="default"
															className="text-xs"
														>
															<Zap className="h-3 w-3 mr-1" />
															Optimal
														</Badge>
													)}
												</div>
												<span className="text-xs text-muted-foreground">
													{slot.duration}
												</span>
											</div>
											<div className="flex items-center justify-between mt-2">
												<Badge
													variant="outline"
													className="text-xs"
												>
													{slot.time_block}
												</Badge>
												<span className="text-xs text-muted-foreground">
													{slot.availability_type}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === "insights" && (
						<div className="space-y-4">
							{loading ? (
								<div className="space-y-4">
									<div className="h-16 bg-muted animate-pulse rounded" />
									<div className="h-24 bg-muted animate-pulse rounded" />
								</div>
							) : scheduleStats ? (
								<div className="space-y-4">
									{/* Quick Stats */}
									<div className="grid grid-cols-2 gap-3">
										<div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
											<div className="text-sm font-medium text-blue-800 dark:text-blue-200">
												Scheduled
											</div>
											<div className="text-lg font-bold text-blue-600 dark:text-blue-400">
												{formatTimeUtilization(
													scheduleStats.totalTime
												)}
											</div>
										</div>
										<div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
											<div className="text-sm font-medium text-green-800 dark:text-green-200">
												Tasks
											</div>
											<div className="text-lg font-bold text-green-600 dark:text-green-400">
												{scheduleStats.totalTasks}
											</div>
										</div>
									</div>

									{/* Utilization Score */}
									<div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<Target className="h-4 w-4 text-purple-600" />
											<span className="text-sm font-medium text-purple-800 dark:text-purple-200">
												Schedule Utilization
											</span>
										</div>
										<div className="text-lg font-bold text-purple-600 dark:text-purple-400">
											{Math.round(
												scheduleStats.utilizationScore
											)}
											%
										</div>
										<div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
											<div
												className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all"
												style={{
													width: `${Math.min(
														scheduleStats.utilizationScore,
														100
													)}%`,
												}}
											/>
										</div>
									</div>

									{/* Basic Suggestions */}
									<div className="space-y-2">
										<h4 className="text-sm font-medium flex items-center gap-2">
											<TrendingUp className="h-4 w-4 text-green-500" />
											Quick Tips
										</h4>
										<div className="space-y-2">
											{scheduleStats.utilizationScore <
												50 && (
												<div className="flex items-start gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
													<Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
													<span className="text-blue-800 dark:text-blue-200">
														Your schedule has room
														for more tasks -
														consider adding
														important activities.
													</span>
												</div>
											)}
											{scheduleStats.utilizationScore >
												80 && (
												<div className="flex items-start gap-2 text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
													<AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
													<span className="text-yellow-800 dark:text-yellow-200">
														Your schedule is quite
														full - make sure to
														include breaks.
													</span>
												</div>
											)}
											{scheduleStats.utilizationScore >=
												50 &&
												scheduleStats.utilizationScore <=
													80 && (
													<div className="flex items-start gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
														<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
														<span className="text-green-800 dark:text-green-200">
															Your schedule looks
															well balanced!
														</span>
													</div>
												)}
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-6 text-muted-foreground">
									<BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">
										Unable to load insights
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
