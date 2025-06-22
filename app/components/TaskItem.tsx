// app/components/TaskItem.tsx - Updated with enhanced category handling
"use client";

import React, { useState } from "react";
import { Task } from "../lib/types";
import { cn } from "../lib/utils";
import { Edit2, Check, X, Trash2, Clock, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TaskItemProps {
	task: Task;
	isCompleted: boolean;
	onToggle: (taskId: string, completed: boolean) => void;
	onEdit?: (taskId: string, updatedTask: Partial<Task>) => void;
	onDelete?: (taskId: string) => void;
	availableCategories?: string[]; // Add available categories for dropdown
}

export function TaskItem({
	task,
	isCompleted,
	onToggle,
	onEdit,
	onDelete,
	availableCategories = [],
}: TaskItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({
		name: task.name,
		time: task.time,
		category: task.category,
		duration: task.duration,
	});

	// Enhanced category color mapping with more categories
	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			// Original categories
			Study: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
			Research:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			Personal:
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
			"Dog Care":
				"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
			Work: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",

			// AI-generated categories
			Goals: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			"Personal Care":
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
			Meals: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
			Commitment:
				"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
			Break: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
			Travel: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
			Exercise:
				"bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",

			// Common additional categories
			Health: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
			Family: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
			Social: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
			Hobby: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
			Finance:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
			Shopping:
				"bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
		};

		return (
			colors[category] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
		);
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
		if (!isEditing && onEdit) {
			handleEdit();
		}
	};

	const handleDelete = () => {
		if (
			onDelete &&
			window.confirm("Are you sure you want to delete this task?")
		) {
			onDelete(task.id);
		}
	};

	// Generate a unique ID for the checkbox to prevent the identical name issue
	const checkboxId = `checkbox-${task.id}`;

	if (isEditing) {
		return (
			<div className="flex flex-col gap-3 p-4 rounded-lg border-2 border-primary bg-secondary/20">
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
				</div>
				<div className="flex items-center gap-2">
					{/* Enhanced category input with dropdown if categories available */}
					{availableCategories.length > 0 ? (
						<select
							value={editData.category}
							onChange={(e) =>
								setEditData((prev) => ({
									...prev,
									category: e.target.value,
								}))
							}
							className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
						>
							{availableCategories.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
							{/* Allow custom category */}
							{!availableCategories.includes(
								editData.category
							) && (
								<option value={editData.category}>
									{editData.category} (Custom)
								</option>
							)}
						</select>
					) : (
						<Input
							value={editData.category}
							onChange={(e) =>
								setEditData((prev) => ({
									...prev,
									category: e.target.value,
								}))
							}
							placeholder="Category"
							className="flex-1"
						/>
					)}
					<div className="flex gap-2">
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
				"flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
				"hover:bg-secondary/50 cursor-pointer border",
				isCompleted
					? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
					: "border-border hover:border-primary/20"
			)}
			onDoubleClick={handleDoubleClick}
		>
			<input
				id={checkboxId}
				type="checkbox"
				checked={isCompleted}
				onChange={(e) => onToggle(task.id, e.target.checked)}
				className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
			/>

			<div className="flex-1 min-w-0">
				<div
					className={cn(
						"font-medium text-sm mb-1",
						isCompleted && "line-through text-muted-foreground"
					)}
				>
					{task.name}
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Clock className="h-3 w-3" />
					<span>{task.time}</span>
					<span>•</span>
					<span>{task.duration}min</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={cn(
						"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
						getCategoryColor(task.category)
					)}
				>
					<Tag className="h-3 w-3" />
					{task.category}
				</span>

				<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					{onEdit && (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								handleEdit();
							}}
							className="h-7 w-7 p-0"
						>
							<Edit2 className="h-3 w-3" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								handleDelete();
							}}
							className="h-7 w-7 p-0 text-destructive hover:text-destructive"
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
