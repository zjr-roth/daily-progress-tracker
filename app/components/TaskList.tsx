"use client";

import React from "react";
import { Task, TimeBlock } from "../lib/types";
import { TaskItem } from "./TaskItem";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

interface TaskListProps {
	tasks: Task[];
	timeBlock: TimeBlock;
	isTaskCompleted: (taskId: string) => boolean;
	onTaskToggle: (taskId: string, completed: boolean) => void;
	onTaskEdit?: (taskId: string, updatedTask: Partial<Task>) => void;
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

export function TaskList({
	tasks,
	timeBlock,
	isTaskCompleted,
	onTaskToggle,
	onTaskEdit,
}: TaskListProps) {
	const blockTasks = tasks.filter((task) => task.block === timeBlock);

	return (
		<Card className={cn("border-l-4 group", blockColors[timeBlock])}>
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">
					{blockTitles[timeBlock]}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{blockTasks.map((task) => (
						<TaskItem
							key={task.id}
							task={task}
							isCompleted={isTaskCompleted(task.id)}
							onToggle={onTaskToggle}
							onEdit={onTaskEdit}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
