"use client";

import React, { useState } from "react";
import { Task } from "../lib/types";
import { cn } from "../lib/utils";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TaskItemProps {
	task: Task;
	isCompleted: boolean;
	onToggle: (taskId: string, completed: boolean) => void;
	onEdit?: (taskId: string, updatedTask: Partial<Task>) => void;
}

export function TaskItem({
	task,
	isCompleted,
	onToggle,
	onEdit,
}: TaskItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({
		name: task.name,
		time: task.time,
		category: task.category,
		duration: task.duration,
	});

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

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleSave = () => {
		// Validate data before saving
		if (!editData.name.trim()) {
			alert("Task name cannot be empty");
			return;
		}
		if (!editData.time.trim()) {
			alert("Task time cannot be empty");
			return;
		}
		if (editData.duration <= 0) {
			alert("Duration must be greater than 0");
			return;
		}

		if (onEdit) {
			onEdit(task.id, editData);
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		// Reset to original values
		setEditData({
			name: task.name,
			time: task.time,
			category: task.category,
			duration: task.duration,
		});
		setIsEditing(false);
	};

	const handleDoubleClick = () => {
		if (!isEditing) {
			handleEdit();
		}
	};

	// Generate a unique ID for the checkbox to prevent the identical name issue
	const checkboxId = `checkbox-${task.id}`;

	if (isEditing) {
		return (
			<div className="flex flex-col gap-3 p-3 rounded-lg border-2 border-primary bg-secondary/20">
				<div className="flex items-center gap-2">
					<Input
						value={editData.name}
						onChange={(e) =>
							setEditData((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						placeholder="Task name"
						className="flex-1"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Input
						value={editData.time}
						onChange={(e) =>
							setEditData((prev) => ({
								...prev,
								time: e.target.value,
							}))
						}
						placeholder="Time (e.g., 9:00-10:00 AM)"
						className="flex-1"
					/>
					<select
						value={editData.category}
						onChange={(e) =>
							setEditData((prev) => ({
								...prev,
								category: e.target.value as any,
							}))
						}
						className="px-3 py-2 rounded-md border border-input bg-background text-sm"
					>
						<option value="Study">Study</option>
						<option value="Research">Research</option>
						<option value="Personal">Personal</option>
						<option value="Dog Care">Dog Care</option>
					</select>
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						value={editData.duration}
						onChange={(e) =>
							setEditData((prev) => ({
								...prev,
								duration: parseInt(e.target.value) || 0,
							}))
						}
						placeholder="Duration (minutes)"
						min="1"
						className="w-32"
					/>
					<div className="flex gap-2 ml-auto">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancel}
						>
							<X className="h-4 w-4 mr-1" />
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave}>
							<Check className="h-4 w-4 mr-1" />
							Save
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
				"hover:bg-secondary/50 cursor-pointer",
				isCompleted && "bg-green-50 dark:bg-green-900/20"
			)}
			onDoubleClick={handleDoubleClick}
		>
			<input
				id={checkboxId}
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
					{task.time} • {task.duration}min
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

			{onEdit && (
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						handleEdit();
					}}
					className="opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<Edit2 className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
