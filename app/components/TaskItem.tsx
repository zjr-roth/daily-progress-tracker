"use client";

import React from "react";
import { Task } from "../lib/types";
import { cn } from "../lib/utils";

interface TaskItemProps {
	task: Task;
	isCompleted: boolean;
	onToggle: (taskId: string, completed: boolean) => void;
}

export function TaskItem({ task, isCompleted, onToggle }: TaskItemProps) {
	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Study":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Research":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Personal":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "Dog Care":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
				"hover:bg-secondary/50",
				isCompleted && "bg-green-50 dark:bg-green-900/20"
			)}
		>
			<input
				type="checkbox"
				checked={isCompleted}
				onChange={(e) => onToggle(task.id, e.target.checked)}
				className="w-5 h-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
			/>

			<div className="flex-1 min-w-0">
				<div
					className={cn(
						"font-medium text-sm",
						isCompleted && "line-through text-muted-foreground"
					)}
				>
					{task.name}
				</div>
				<div className="text-xs text-muted-foreground mt-1">
					{task.time}
				</div>
			</div>

			<span
				className={cn(
					"px-2 py-1 rounded-full text-xs font-medium",
					getCategoryColor(task.category)
				)}
			>
				{task.category}
			</span>
		</div>
	);
}
