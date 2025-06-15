"use client";

import React, { useState, useRef } from "react";
import { Task, TaskCategory, TimeBlock } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
	Plus,
	Edit2,
	Trash2,
	Save,
	X,
	Clock,
	GripVertical,
	Settings,
	Palette,
	AlertCircle,
	Tag,
} from "lucide-react";
import { cn } from "../lib/utils";

interface ScheduleCustomizationProps {
	tasks: Task[];
	onTasksUpdate: (tasks: Task[]) => void;
	onClose: () => void;
}

interface CategoryConfig {
	name: string;
	color: string;
	bgColor: string;
	textColor: string;
}

const defaultCategories: Record<string, CategoryConfig> = {
	Study: {
		name: "Study",
		color: "bg-blue-500",
		bgColor: "bg-blue-100 dark:bg-blue-900",
		textColor: "text-blue-800 dark:text-blue-200",
	},
	Research: {
		name: "Research",
		color: "bg-green-500",
		bgColor: "bg-green-100 dark:bg-green-900",
		textColor: "text-green-800 dark:text-green-200",
	},
	Personal: {
		name: "Personal",
		color: "bg-purple-500",
		bgColor: "bg-purple-100 dark:bg-purple-900",
		textColor: "text-purple-800 dark:text-purple-200",
	},
	"Dog Care": {
		name: "Dog Care",
		color: "bg-orange-500",
		bgColor: "bg-orange-100 dark:bg-orange-900",
		textColor: "text-orange-800 dark:text-orange-200",
	},
};

const colorOptions = [
	{
		name: "Blue",
		color: "bg-blue-500",
		bg: "bg-blue-100 dark:bg-blue-900",
		text: "text-blue-800 dark:text-blue-200",
	},
	{
		name: "Green",
		color: "bg-green-500",
		bg: "bg-green-100 dark:bg-green-900",
		text: "text-green-800 dark:text-green-200",
	},
	{
		name: "Purple",
		color: "bg-purple-500",
		bg: "bg-purple-100 dark:bg-purple-900",
		text: "text-purple-800 dark:text-purple-200",
	},
	{
		name: "Orange",
		color: "bg-orange-500",
		bg: "bg-orange-100 dark:bg-orange-900",
		text: "text-orange-800 dark:text-orange-200",
	},
	{
		name: "Red",
		color: "bg-red-500",
		bg: "bg-red-100 dark:bg-red-900",
		text: "text-red-800 dark:text-red-200",
	},
	{
		name: "Yellow",
		color: "bg-yellow-500",
		bg: "bg-yellow-100 dark:bg-yellow-900",
		text: "text-yellow-800 dark:text-yellow-200",
	},
	{
		name: "Pink",
		color: "bg-pink-500",
		bg: "bg-pink-100 dark:bg-pink-900",
		text: "text-pink-800 dark:text-pink-200",
	},
	{
		name: "Indigo",
		color: "bg-indigo-500",
		bg: "bg-indigo-100 dark:bg-indigo-900",
		text: "text-indigo-800 dark:text-indigo-200",
	},
	{
		name: "Teal",
		color: "bg-teal-500",
		bg: "bg-teal-100 dark:bg-teal-900",
		text: "text-teal-800 dark:text-teal-200",
	},
	{
		name: "Cyan",
		color: "bg-cyan-500",
		bg: "bg-cyan-100 dark:bg-cyan-900",
		text: "text-cyan-800 dark:text-cyan-200",
	},
];

const timeBlocks: { key: TimeBlock; title: string; color: string }[] = [
	{ key: "morning", title: "Morning Block", color: "border-l-yellow-500" },
	{ key: "afternoon", title: "Afternoon Block", color: "border-l-blue-500" },
	{ key: "evening", title: "Evening Block", color: "border-l-purple-500" },
];

export function ScheduleCustomization({
	tasks,
	onTasksUpdate,
	onClose,
}: ScheduleCustomizationProps) {
	const [localTasks, setLocalTasks] = useState<Task[]>([...tasks]);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [categories, setCategories] =
		useState<Record<string, CategoryConfig>>(defaultCategories);
	const [activeTab, setActiveTab] = useState<"tasks" | "categories">("tasks");
	const [showAddTask, setShowAddTask] = useState(false);
	const [showAddCategory, setShowAddCategory] = useState(false);
	const [editingCategory, setEditingCategory] = useState<string | null>(null);
	const dragCounter = useRef(0);

	// New task form state
	const [newTask, setNewTask] = useState({
		name: "",
		time: "",
		category: "Personal" as string,
		duration: 30,
		block: "morning" as TimeBlock,
	});

	// New category form state
	const [newCategory, setNewCategory] = useState({
		name: "",
		color: "bg-blue-500",
		bgColor: "bg-blue-100 dark:bg-blue-900",
		textColor: "text-blue-800 dark:text-blue-200",
	});

	// Helper functions
	const generateUniqueId = () =>
		`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const getCategoryConfig = (category: string) => {
		return categories[category] || defaultCategories["Personal"];
	};

	const resetNewTask = () => {
		setNewTask({
			name: "",
			time: "",
			category: "Personal",
			duration: 30,
			block: "morning",
		});
	};

	const resetNewCategory = () => {
		setNewCategory({
			name: "",
			color: "bg-blue-500",
			bgColor: "bg-blue-100 dark:bg-blue-900",
			textColor: "text-blue-800 dark:text-blue-200",
		});
	};

	// Task management functions
	const handleAddTask = () => {
		if (!newTask.name.trim() || !newTask.time.trim()) {
			return;
		}

		const task: Task = {
			id: `task-${generateUniqueId()}`,
			name: newTask.name,
			time: newTask.time,
			category: newTask.category as TaskCategory,
			duration: newTask.duration,
			block: newTask.block,
		};

		setLocalTasks([...localTasks, task]);
		resetNewTask();
		setShowAddTask(false);
	};

	const handleDeleteTask = (taskId: string) => {
		if (window.confirm("Are you sure you want to delete this task?")) {
			setLocalTasks(localTasks.filter((t) => t.id !== taskId));
		}
	};

	const handleTaskEdit = (taskId: string, updatedTask: Partial<Task>) => {
		setLocalTasks(
			localTasks.map((task) =>
				task.id === taskId ? { ...task, ...updatedTask } : task
			)
		);
		setEditingTaskId(null);
	};

	// Drag and drop functions
	const handleDragStart = (e: React.DragEvent, taskId: string) => {
		setDraggedTaskId(taskId);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, targetBlock: TimeBlock) => {
		e.preventDefault();

		if (!draggedTaskId) return;

		setLocalTasks(
			localTasks.map((task) =>
				task.id === draggedTaskId
					? { ...task, block: targetBlock }
					: task
			)
		);

		setDraggedTaskId(null);
		dragCounter.current = 0;
	};

	// Category management functions
	const handleAddCategory = () => {
		if (!newCategory.name.trim()) {
			return;
		}

		if (categories[newCategory.name]) {
			alert("Category with this name already exists!");
			return;
		}

		const updatedCategories = {
			...categories,
			[newCategory.name]: { ...newCategory },
		};

		setCategories(updatedCategories);
		resetNewCategory();
		setShowAddCategory(false);
	};

	const handleDeleteCategory = (categoryName: string) => {
		const tasksUsingCategory = localTasks.filter(
			(task) => task.category === categoryName
		);

		if (tasksUsingCategory.length > 0) {
			if (
				!window.confirm(
					`This category is used by ${tasksUsingCategory.length} task(s). Deleting it will change those tasks to "Personal" category. Continue?`
				)
			) {
				return;
			}
			setLocalTasks(
				localTasks.map((task) =>
					task.category === categoryName
						? { ...task, category: "Personal" as TaskCategory }
						: task
				)
			);
		}

		if (defaultCategories[categoryName]) {
			alert("Cannot delete default categories!");
			return;
		}

		const updatedCategories = { ...categories };
		delete updatedCategories[categoryName];
		setCategories(updatedCategories);
	};

	const updateCategoryColor = (
		category: string,
		colorConfig: (typeof colorOptions)[0]
	) => {
		const updatedCategories = {
			...categories,
			[category]: {
				...categories[category],
				color: colorConfig.color,
				bgColor: colorConfig.bg,
				textColor: colorConfig.text,
			},
		};
		setCategories(updatedCategories);
	};

	const updateCategoryName = (oldName: string, newName: string) => {
		if (!newName.trim() || oldName === newName) {
			setEditingCategory(null);
			return;
		}

		if (categories[newName]) {
			alert("Category with this name already exists!");
			setEditingCategory(null);
			return;
		}

		const updatedCategories = { ...categories };
		updatedCategories[newName] = {
			...updatedCategories[oldName],
			name: newName,
		};
		delete updatedCategories[oldName];

		setCategories(updatedCategories);
		setEditingCategory(null);
	};

	const handleNewCategoryColorChange = (
		colorConfig: (typeof colorOptions)[0]
	) => {
		setNewCategory({
			...newCategory,
			color: colorConfig.color,
			bgColor: colorConfig.bg,
			textColor: colorConfig.text,
		});
	};

	// Save changes
	const handleSaveChanges = () => {
		onTasksUpdate(localTasks);
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl flex items-center gap-2">
								<Settings className="h-6 w-6" />
								Schedule Customization
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Customize your daily schedule, add tasks, and
								organize your time blocks
							</p>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Tab Navigation */}
					<div className="flex gap-2 mt-4">
						<Button
							variant={
								activeTab === "tasks" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setActiveTab("tasks")}
						>
							Manage Tasks
						</Button>
						<Button
							variant={
								activeTab === "categories"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => setActiveTab("categories")}
						>
							<Palette className="h-4 w-4 mr-2" />
							Categories
						</Button>
					</div>
				</CardHeader>

				<CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{activeTab === "tasks" ? (
						<TaskManagement
							localTasks={localTasks}
							categories={categories}
							newTask={newTask}
							setNewTask={setNewTask}
							showAddTask={showAddTask}
							setShowAddTask={setShowAddTask}
							editingTaskId={editingTaskId}
							setEditingTaskId={setEditingTaskId}
							onAddTask={handleAddTask}
							onDeleteTask={handleDeleteTask}
							onTaskEdit={handleTaskEdit}
							onDragStart={handleDragStart}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							getCategoryConfig={getCategoryConfig}
						/>
					) : (
						<CategoryManagement
							categories={categories}
							newCategory={newCategory}
							setNewCategory={setNewCategory}
							showAddCategory={showAddCategory}
							setShowAddCategory={setShowAddCategory}
							editingCategory={editingCategory}
							setEditingCategory={setEditingCategory}
							onAddCategory={handleAddCategory}
							onDeleteCategory={handleDeleteCategory}
							updateCategoryColor={updateCategoryColor}
							updateCategoryName={updateCategoryName}
							handleNewCategoryColorChange={
								handleNewCategoryColorChange
							}
						/>
					)}
				</CardContent>

				{/* Footer */}
				<div className="border-t p-4 flex justify-between items-center bg-secondary/20">
					<div className="text-sm text-muted-foreground">
						{localTasks.length} tasks •{" "}
						{Object.keys(categories).length} categories • Drag and
						drop to reorder
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSaveChanges}>
							<Save className="h-4 w-4 mr-2" />
							Save Changes
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}

// Task Management Component
interface TaskManagementProps {
	localTasks: Task[];
	categories: Record<string, CategoryConfig>;
	newTask: {
		name: string;
		time: string;
		category: string;
		duration: number;
		block: TimeBlock;
	};
	setNewTask: (task: any) => void;
	showAddTask: boolean;
	setShowAddTask: (show: boolean) => void;
	editingTaskId: string | null;
	setEditingTaskId: (id: string | null) => void;
	onAddTask: () => void;
	onDeleteTask: (taskId: string) => void;
	onTaskEdit: (taskId: string, updatedTask: Partial<Task>) => void;
	onDragStart: (e: React.DragEvent, taskId: string) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent, targetBlock: TimeBlock) => void;
	getCategoryConfig: (category: string) => CategoryConfig;
}

function TaskManagement({
	localTasks,
	categories,
	newTask,
	setNewTask,
	showAddTask,
	setShowAddTask,
	editingTaskId,
	setEditingTaskId,
	onAddTask,
	onDeleteTask,
	onTaskEdit,
	onDragStart,
	onDragOver,
	onDrop,
	getCategoryConfig,
}: TaskManagementProps) {
	return (
		<div className="space-y-6">
			{/* Add New Task Section */}
			<div className="border rounded-lg p-4 bg-secondary/30">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Add New Task</h3>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddTask(!showAddTask)}
					>
						<Plus className="h-4 w-4 mr-2" />
						{showAddTask ? "Cancel" : "Add Task"}
					</Button>
				</div>

				{showAddTask && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<div>
							<Label>Task Name</Label>
							<Input
								value={newTask.name}
								onChange={(e) =>
									setNewTask({
										...newTask,
										name: e.target.value,
									})
								}
								placeholder="Enter task name"
							/>
						</div>
						<div>
							<Label>Time</Label>
							<Input
								value={newTask.time}
								onChange={(e) =>
									setNewTask({
										...newTask,
										time: e.target.value,
									})
								}
								placeholder="9:00-10:00 AM"
							/>
						</div>
						<div>
							<Label>Category</Label>
							<select
								value={newTask.category}
								onChange={(e) =>
									setNewTask({
										...newTask,
										category: e.target.value,
									})
								}
								className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
							>
								{Object.keys(categories).map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
						<div>
							<Label>Duration (min)</Label>
							<Input
								type="number"
								value={newTask.duration}
								onChange={(e) =>
									setNewTask({
										...newTask,
										duration: parseInt(e.target.value) || 0,
									})
								}
								min="1"
							/>
						</div>
						<div>
							<Label>Time Block</Label>
							<select
								value={newTask.block}
								onChange={(e) =>
									setNewTask({
										...newTask,
										block: e.target.value as TimeBlock,
									})
								}
								className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
							>
								<option value="morning">Morning</option>
								<option value="afternoon">Afternoon</option>
								<option value="evening">Evening</option>
							</select>
						</div>
						<div className="lg:col-span-5">
							<Button onClick={onAddTask} className="w-full">
								<Plus className="h-4 w-4 mr-2" />
								Add Task
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Task Management by Time Blocks */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{timeBlocks.map(({ key, title, color }) => (
					<div
						key={key}
						className={cn(
							"border-l-4 rounded-lg border bg-card",
							color
						)}
						onDragOver={onDragOver}
						onDrop={(e) => onDrop(e, key)}
					>
						<div className="p-4">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Clock className="h-5 w-5" />
								{title}
							</h3>
							<div className="space-y-2">
								{localTasks
									.filter((task) => task.block === key)
									.map((task) => (
										<TaskEditCard
											key={task.id}
											task={task}
											isEditing={
												editingTaskId === task.id
											}
											onEdit={(updatedTask) =>
												onTaskEdit(task.id, updatedTask)
											}
											onDelete={() =>
												onDeleteTask(task.id)
											}
											onStartEdit={() =>
												setEditingTaskId(task.id)
											}
											onCancelEdit={() =>
												setEditingTaskId(null)
											}
											onDragStart={(e) =>
												onDragStart(e, task.id)
											}
											categoryConfig={getCategoryConfig(
												task.category
											)}
											availableCategories={Object.keys(
												categories
											)}
										/>
									))}
								{localTasks.filter((task) => task.block === key)
									.length === 0 && (
									<div className="text-sm text-muted-foreground text-center p-4 border-2 border-dashed rounded">
										Drop tasks here or add new ones
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// Task Edit Card Component
interface TaskEditCardProps {
	task: Task;
	isEditing: boolean;
	onEdit: (updatedTask: Partial<Task>) => void;
	onDelete: () => void;
	onStartEdit: () => void;
	onCancelEdit: () => void;
	onDragStart: (e: React.DragEvent) => void;
	categoryConfig: CategoryConfig;
	availableCategories: string[];
}

function TaskEditCard({
	task,
	isEditing,
	onEdit,
	onDelete,
	onStartEdit,
	onCancelEdit,
	onDragStart,
	categoryConfig,
	availableCategories,
}: TaskEditCardProps) {
	const [editData, setEditData] = useState({
		name: task.name,
		time: task.time,
		category: task.category,
		duration: task.duration,
	});

	const handleSave = () => {
		if (!editData.name.trim() || !editData.time.trim()) return;
		onEdit(editData);
	};

	if (isEditing) {
		return (
			<div className="p-3 border rounded-lg bg-secondary/20">
				<div className="space-y-3">
					<Input
						value={editData.name}
						onChange={(e) =>
							setEditData({ ...editData, name: e.target.value })
						}
						placeholder="Task name"
					/>
					<div className="grid grid-cols-2 gap-2">
						<Input
							value={editData.time}
							onChange={(e) =>
								setEditData({
									...editData,
									time: e.target.value,
								})
							}
							placeholder="Time"
						/>
						<Input
							type="number"
							value={editData.duration}
							onChange={(e) =>
								setEditData({
									...editData,
									duration: parseInt(e.target.value) || 0,
								})
							}
							placeholder="Duration"
							min="1"
						/>
					</div>
					<select
						value={editData.category}
						onChange={(e) =>
							setEditData({
								...editData,
								category: e.target.value as TaskCategory,
							})
						}
						className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
					>
						{availableCategories.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
					<div className="flex gap-2">
						<Button size="sm" onClick={handleSave}>
							<Save className="h-3 w-3 mr-1" />
							Save
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={onCancelEdit}
						>
							<X className="h-3 w-3 mr-1" />
							Cancel
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			draggable
			onDragStart={onDragStart}
			className="p-3 border rounded-lg hover:bg-secondary/50 transition-colors cursor-move group"
		>
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-2 flex-1 min-w-0">
					<GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm truncate">
							{task.name}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							{task.time} • {task.duration}min
						</div>
						<span
							className={cn(
								"inline-block px-2 py-1 rounded-full text-xs font-medium mt-2",
								categoryConfig.bgColor,
								categoryConfig.textColor
							)}
						>
							{task.category}
						</span>
					</div>
				</div>
				<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<Button size="sm" variant="ghost" onClick={onStartEdit}>
						<Edit2 className="h-3 w-3" />
					</Button>
					<Button size="sm" variant="ghost" onClick={onDelete}>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Category Management Component
interface CategoryManagementProps {
	categories: Record<string, CategoryConfig>;
	newCategory: {
		name: string;
		color: string;
		bgColor: string;
		textColor: string;
	};
	setNewCategory: (category: any) => void;
	showAddCategory: boolean;
	setShowAddCategory: (show: boolean) => void;
	editingCategory: string | null;
	setEditingCategory: (category: string | null) => void;
	onAddCategory: () => void;
	onDeleteCategory: (categoryName: string) => void;
	updateCategoryColor: (category: string, colorConfig: any) => void;
	updateCategoryName: (oldName: string, newName: string) => void;
	handleNewCategoryColorChange: (colorConfig: any) => void;
}

function CategoryManagement({
	categories,
	newCategory,
	setNewCategory,
	showAddCategory,
	setShowAddCategory,
	editingCategory,
	setEditingCategory,
	onAddCategory,
	onDeleteCategory,
	updateCategoryColor,
	updateCategoryName,
	handleNewCategoryColorChange,
}: CategoryManagementProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">
					Category Management
				</h3>
				<p className="text-sm text-muted-foreground mb-6">
					Customize the appearance and names of your task categories,
					or create new ones
				</p>
			</div>

			{/* Add New Category Section */}
			<div className="border rounded-lg p-4 bg-secondary/30">
				<div className="flex items-center justify-between mb-4">
					<h4 className="text-md font-semibold flex items-center gap-2">
						<Tag className="h-4 w-4" />
						Add New Category
					</h4>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddCategory(!showAddCategory)}
					>
						<Plus className="h-4 w-4 mr-2" />
						{showAddCategory ? "Cancel" : "Add Category"}
					</Button>
				</div>

				{showAddCategory && (
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label>Category Name</Label>
								<Input
									value={newCategory.name}
									onChange={(e) =>
										setNewCategory({
											...newCategory,
											name: e.target.value,
										})
									}
									placeholder="Enter category name"
								/>
							</div>
							<div>
								<Label>Preview</Label>
								<div
									className={cn(
										"px-3 py-2 rounded-full text-sm font-medium inline-block",
										newCategory.bgColor,
										newCategory.textColor
									)}
								>
									{newCategory.name || "New Category"} Task
								</div>
							</div>
						</div>

						<div>
							<Label className="text-sm">Choose Color</Label>
							<div className="grid grid-cols-5 md:grid-cols-10 gap-2 mt-2">
								{colorOptions.map((colorOption, index) => (
									<button
										key={index}
										onClick={() =>
											handleNewCategoryColorChange(
												colorOption
											)
										}
										className={cn(
											"w-8 h-8 rounded-full border-2 transition-all",
											colorOption.color,
											newCategory.color ===
												colorOption.color
												? "border-foreground scale-110"
												: "border-transparent hover:border-muted-foreground"
										)}
										title={colorOption.name}
									/>
								))}
							</div>
						</div>

						<Button onClick={onAddCategory} className="w-full">
							<Plus className="h-4 w-4 mr-2" />
							Create Category
						</Button>
					</div>
				)}
			</div>

			{/* Existing Categories */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{Object.entries(categories).map(([key, config]) => (
					<Card key={key} className="p-4">
						<div className="space-y-4">
							{/* Category Header */}
							<div className="flex items-center justify-between">
								{editingCategory === key ? (
									<div className="flex items-center gap-2 flex-1">
										<Input
											defaultValue={config.name}
											className="flex-1"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													updateCategoryName(
														key,
														e.currentTarget.value
													);
												} else if (e.key === "Escape") {
													setEditingCategory(null);
												}
											}}
											onBlur={(e) =>
												updateCategoryName(
													key,
													e.target.value
												)
											}
											autoFocus
										/>
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												setEditingCategory(null)
											}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<>
										<div className="flex items-center gap-3">
											<div
												className={cn(
													"w-4 h-4 rounded-full",
													config.color
												)}
											/>
											<span className="font-medium">
												{config.name}
											</span>
										</div>
										<div className="flex gap-1">
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													setEditingCategory(key)
												}
											>
												<Edit2 className="h-3 w-3" />
											</Button>
											{!defaultCategories[key] && (
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														onDeleteCategory(key)
													}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											)}
										</div>
									</>
								)}
							</div>

							{/* Preview */}
							<div className="space-y-2">
								<Label className="text-xs">Preview</Label>
								<div
									className={cn(
										"px-3 py-2 rounded-full text-sm font-medium inline-block",
										config.bgColor,
										config.textColor
									)}
								>
									{config.name} Task
								</div>
							</div>

							{/* Color Options */}
							<div className="space-y-2">
								<Label className="text-xs">Color</Label>
								<div className="grid grid-cols-4 gap-2">
									{colorOptions
										.slice(0, 8)
										.map((colorOption, index) => (
											<button
												key={index}
												onClick={() =>
													updateCategoryColor(
														key,
														colorOption
													)
												}
												className={cn(
													"w-8 h-8 rounded-full border-2 transition-all",
													colorOption.color,
													config.color ===
														colorOption.color
														? "border-foreground scale-110"
														: "border-transparent hover:border-muted-foreground"
												)}
												title={colorOption.name}
											/>
										))}
								</div>
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Tips Section */}
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
							Category Tips
						</p>
						<ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
							<li>
								• Categories help organize and track different
								types of activities
							</li>
							<li>
								• Choose colors that are visually distinct for
								better organization
							</li>
							<li>
								• Category names can be edited by clicking the
								edit button
							</li>
							<li>
								• Default categories cannot be deleted, but
								custom ones can be
							</li>
							<li>
								• Changes are saved automatically when you close
								this dialog
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
