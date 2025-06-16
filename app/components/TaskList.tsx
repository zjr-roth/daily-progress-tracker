// app/components/TaskList.tsx - Updated for database integration
"use client";

import React from "react";
import { Task, TimeBlock } from "../lib/types";
import { TaskItem } from "./TaskItem";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Plus, Clock } from "lucide-react";

interface TaskListProps {
	tasks: Task[];
	timeBlock: TimeBlock;
	isTaskCompleted: (taskId: string) => boolean;
	onTaskToggle: (taskId: string, completed: boolean) => void;
	onTaskEdit?: (taskId: string, updatedTask: Partial<Task>) => void;
	onTaskDelete?: (taskId: string) => void;
	onAddTask?: (timeBlock: TimeBlock) => void;
}

const blockTitles: Record<TimeBlock, string> = {
	morning: "Morning Block",
	afternoon: "Afternoon Block",
	evening: "Evening Block",
};

const blockColors: Record<TimeBlock, string> = {
	morning: "border-l-yellow-500",
	afternoon: "border-l-blue-500",
	evening: "border-l-purple-500",
};

const blockTimes: Record<TimeBlock, string> = {
	morning: "6:00 AM - 12:00 PM",
	afternoon: "12:00 PM - 6:00 PM",
	evening: "6:00 PM - 11:00 PM",
};

export function TaskList({
	tasks,
	timeBlock,
	isTaskCompleted,
	onTaskToggle,
	onTaskEdit,
	onTaskDelete,
	onAddTask,
}: TaskListProps) {
	const blockTasks = tasks
		.filter((task) => task.block === timeBlock)
		.sort((a, b) => {
			// Sort by time start
			const aTime = a.time.split("-")[0].trim();
			const bTime = b.time.split("-")[0].trim();

			// Convert to 24-hour format for comparison
			const parseTime = (timeStr: string) => {
				const [time, period] = timeStr.split(" ");
				const [hours, minutes] = time.split(":").map(Number);
				let hour24 = hours;

				if (period === "PM" && hours !== 12) hour24 += 12;
				if (period === "AM" && hours === 12) hour24 = 0;

				return hour24 * 60 + minutes;
			};

			return parseTime(aTime) - parseTime(bTime);
		});

	return (
		<Card className={cn("border-l-4 group h-fit", blockColors[timeBlock])}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Clock className="h-5 w-5 text-muted-foreground" />
						<div>
							<CardTitle className="text-lg">
								{blockTitles[timeBlock]}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{blockTimes[timeBlock]}
							</p>
						</div>
					</div>
					{onAddTask && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onAddTask(timeBlock)}
							className="opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<Plus className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{blockTasks.length > 0 ? (
						blockTasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								isCompleted={isTaskCompleted(task.id)}
								onToggle={onTaskToggle}
								onEdit={onTaskEdit}
								onDelete={onTaskDelete}
							/>
						))
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
								<Plus className="h-6 w-6" />
							</div>
							<p className="text-sm mb-2">
								No tasks in this time block
							</p>
							{onAddTask && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddTask(timeBlock)}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Task
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
