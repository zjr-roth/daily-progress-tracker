// app/components/ScheduleCustomization.tsx - Updated for database integration
"use client";

import React, { useState, useRef } from "react";
import { Task, TimeBlock } from "../lib/types";
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
	Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Category } from "../lib/services/categoryService";
import { validateTaskTime, suggestAlternativeTimeSlots } from "../lib/utils";

interface ScheduleCustomizationProps {
	tasks: Task[];
	categories: Category[];
	onTaskCreate: (task: Omit<Task, "id">) => Promise<Task | null>;
	onTaskUpdate: (
		taskId: string,
		updates: Partial<Task>
	) => Promise<Task | null>;
	onTaskDelete: (taskId: string) => Promise<void>;
	onCategoryCreate: (
		category: Omit<Category, "id">
	) => Promise<Category | null>;
	onCategoryUpdate: (
		categoryId: string,
		updates: Partial<Category>
	) => Promise<Category | null>;
	onCategoryDelete: (categoryId: string) => Promise<void>;
	onClose: () => void;
}

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
	categories,
	onTaskCreate,
	onTaskUpdate,
	onTaskDelete,
	onCategoryCreate,
	onCategoryUpdate,
	onCategoryDelete,
	onClose,
}: ScheduleCustomizationProps) {
	const [activeTab, setActiveTab] = useState<"tasks" | "categories">("tasks");
	const [showAddTask, setShowAddTask] = useState(false);
	const [showAddCategory, setShowAddCategory] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
		null
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// New task form state
	const [newTask, setNewTask] = useState({
		name: "",
		time: "",
		category: categories.length > 0 ? categories[0].name : "Personal",
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

	// Time conflict alert state
	const [timeConflictAlert, setTimeConflictAlert] = useState<{
		show: boolean;
		message: string;
		suggestions: Array<{ start: string; end: string }>;
	}>({ show: false, message: "", suggestions: [] });

	// Helper functions
	const getCategoryConfig = (categoryName: string) => {
		const category = categories.find((cat) => cat.name === categoryName);
		if (!category) {
			// Return default if category not found
			return {
				color: "bg-gray-500",
				bgColor: "bg-gray-100 dark:bg-gray-900",
				textColor: "text-gray-800 dark:text-gray-200",
			};
		}
		return {
			color: category.color,
			bgColor: category.bgColor,
			textColor: category.textColor,
		};
	};

	const resetNewTask = () => {
		setNewTask({
			name: "",
			time: "",
			category: categories.length > 0 ? categories[0].name : "Personal",
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

	const showToast = (
		message: string,
		type: "success" | "error" = "success"
	) => {
		// Create a simple toast notification
		const toast = document.createElement("div");
		const bgColor =
			type === "success"
				? "bg-green-100 border-green-200 text-green-700"
				: "bg-red-100 border-red-200 text-red-700";

		toast.className = `fixed top-4 right-4 ${bgColor} border px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
		toast.textContent = message;
		document.body.appendChild(toast);

		setTimeout(() => {
			if (document.body.contains(toast)) {
				document.body.removeChild(toast);
			}
		}, 3000);
	};

	// Task management functions
	const handleAddTask = async () => {
		if (!newTask.name.trim() || !newTask.time.trim()) {
			setError("Task name and time are required");
			return;
		}

		// Validate time format and check for conflicts
		const validation = validateTaskTime(
			newTask.time,
			newTask.duration,
			tasks
		);

		if (!validation.isValid) {
			const suggestions = suggestAlternativeTimeSlots(
				newTask.time,
				newTask.duration,
				newTask.block,
				tasks
			);

			setTimeConflictAlert({
				show: true,
				message: validation.error || "Time conflict detected",
				suggestions,
			});
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const taskData: Omit<Task, "id"> = {
				name: newTask.name,
				time: newTask.time,
				category: newTask.category,
				duration: newTask.duration,
				block: newTask.block,
			};

			await onTaskCreate(taskData);
			resetNewTask();
			setShowAddTask(false);
			showToast("Task created successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to create task");
			showToast(error.message || "Failed to create task", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleTaskEdit = async (
		taskId: string,
		updatedTask: Partial<Task>
	) => {
		if (updatedTask.time) {
			// Validate time if it's being updated
			const validation = validateTaskTime(
				updatedTask.time,
				updatedTask.duration || 0,
				tasks,
				taskId
			);

			if (!validation.isValid) {
				const task = tasks.find((t) => t.id === taskId);
				if (task) {
					const suggestions = suggestAlternativeTimeSlots(
						updatedTask.time,
						updatedTask.duration || task.duration,
						updatedTask.block || task.block,
						tasks
					);

					setTimeConflictAlert({
						show: true,
						message: validation.error || "Time conflict detected",
						suggestions,
					});
				}
				return;
			}
		}

		setLoading(true);
		setError(null);

		try {
			await onTaskUpdate(taskId, updatedTask);
			setEditingTaskId(null);
			showToast("Task updated successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to update task");
			showToast(error.message || "Failed to update task", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleTaskDelete = async (taskId: string) => {
		if (!window.confirm("Are you sure you want to delete this task?")) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			await onTaskDelete(taskId);
			showToast("Task deleted successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to delete task");
			showToast(error.message || "Failed to delete task", "error");
		} finally {
			setLoading(false);
		}
	};

	// Category management functions
	const handleAddCategory = async () => {
		if (!newCategory.name.trim()) {
			setError("Category name is required");
			return;
		}

		// Check if category already exists
		if (
			categories.some(
				(cat) =>
					cat.name.toLowerCase() === newCategory.name.toLowerCase()
			)
		) {
			setError("A category with this name already exists");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const categoryData: Omit<Category, "id"> = {
				name: newCategory.name,
				color: newCategory.color,
				bgColor: newCategory.bgColor,
				textColor: newCategory.textColor,
			};

			await onCategoryCreate(categoryData);
			resetNewCategory();
			setShowAddCategory(false);
			showToast("Category created successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to create category");
			showToast(error.message || "Failed to create category", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleCategoryUpdate = async (
		categoryId: string,
		updates: Partial<Category>
	) => {
		setLoading(true);
		setError(null);

		try {
			await onCategoryUpdate(categoryId, updates);
			setEditingCategoryId(null);
			showToast("Category updated successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to update category");
			showToast(error.message || "Failed to update category", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleCategoryDelete = async (categoryId: string) => {
		const category = categories.find((cat) => cat.id === categoryId);
		if (!category) return;

		const tasksUsingCategory = tasks.filter(
			(task) => task.category === category.name
		);

		if (tasksUsingCategory.length > 0) {
			if (
				!window.confirm(
					`This category is used by ${tasksUsingCategory.length} task(s). Deleting it will change those tasks to "Personal" category. Continue?`
				)
			) {
				return;
			}
		}

		setLoading(true);
		setError(null);

		try {
			await onCategoryDelete(categoryId);
			showToast("Category deleted successfully!");
		} catch (error: any) {
			setError(error.message || "Failed to delete category");
			showToast(error.message || "Failed to delete category", "error");
		} finally {
			setLoading(false);
		}
	};

	const updateCategoryColor = async (
		categoryId: string,
		colorConfig: (typeof colorOptions)[0]
	) => {
		await handleCategoryUpdate(categoryId, {
			color: colorConfig.color,
			bgColor: colorConfig.bg,
			textColor: colorConfig.text,
		});
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
							disabled={loading}
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
							disabled={loading}
						>
							<Palette className="h-4 w-4 mr-2" />
							Categories
						</Button>
					</div>
				</CardHeader>

				<CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{/* Error Alert */}
					{error && (
						<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
								<span className="text-sm text-red-800 dark:text-red-200">
									{error}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setError(null)}
									className="ml-auto"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						</div>
					)}

					{/* Time Conflict Alert */}
					{timeConflictAlert.show && (
						<div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
								<div className="flex-1">
									<h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
										Scheduling Conflict
									</h3>
									<p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
										{timeConflictAlert.message}
									</p>
									{timeConflictAlert.suggestions.length >
										0 && (
										<div>
											<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
												Suggested alternative times:
											</p>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
												{timeConflictAlert.suggestions.map(
													(suggestion, index) => (
														<Button
															key={index}
															variant="outline"
															size="sm"
															className="justify-start text-xs"
															onClick={() => {
																if (
																	activeTab ===
																		"tasks" &&
																	showAddTask
																) {
																	setNewTask({
																		...newTask,
																		time: `${suggestion.start}-${suggestion.end}`,
																	});
																}
																setTimeConflictAlert(
																	{
																		show: false,
																		message:
																			"",
																		suggestions:
																			[],
																	}
																);
															}}
														>
															{suggestion.start} -{" "}
															{suggestion.end}
														</Button>
													)
												)}
											</div>
										</div>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										setTimeConflictAlert({
											show: false,
											message: "",
											suggestions: [],
										})
									}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}

					{activeTab === "tasks" ? (
						<TaskManagement
							tasks={tasks}
							categories={categories}
							newTask={newTask}
							setNewTask={setNewTask}
							showAddTask={showAddTask}
							setShowAddTask={setShowAddTask}
							editingTaskId={editingTaskId}
							setEditingTaskId={setEditingTaskId}
							onAddTask={handleAddTask}
							onDeleteTask={handleTaskDelete}
							onTaskEdit={handleTaskEdit}
							getCategoryConfig={getCategoryConfig}
							loading={loading}
						/>
					) : (
						<CategoryManagement
							categories={categories}
							newCategory={newCategory}
							setNewCategory={setNewCategory}
							showAddCategory={showAddCategory}
							setShowAddCategory={setShowAddCategory}
							editingCategoryId={editingCategoryId}
							setEditingCategoryId={setEditingCategoryId}
							onAddCategory={handleAddCategory}
							onDeleteCategory={handleCategoryDelete}
							updateCategoryColor={updateCategoryColor}
							onCategoryUpdate={handleCategoryUpdate}
							handleNewCategoryColorChange={
								handleNewCategoryColorChange
							}
							loading={loading}
						/>
					)}
				</CardContent>

				{/* Footer */}
				<div className="border-t p-4 flex justify-between items-center bg-secondary/20">
					<div className="text-sm text-muted-foreground">
						{tasks.length} tasks • {categories.length} categories
						{loading && (
							<span className="flex items-center gap-2 ml-4">
								<Loader2 className="h-3 w-3 animate-spin" />
								Saving...
							</span>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={onClose}
							disabled={loading}
						>
							Close
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}

// Task Management Component
interface TaskManagementProps {
	tasks: Task[];
	categories: Category[];
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
	getCategoryConfig: (category: string) => any;
	loading: boolean;
}

function TaskManagement({
	tasks,
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
	getCategoryConfig,
	loading,
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
						disabled={loading}
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
								disabled={loading}
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
								disabled={loading}
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
								disabled={loading}
							>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.name}>
										{cat.name}
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
								disabled={loading}
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
								disabled={loading}
							>
								<option value="morning">Morning</option>
								<option value="afternoon">Afternoon</option>
								<option value="evening">Evening</option>
							</select>
						</div>
						<div className="lg:col-span-5">
							<Button
								onClick={onAddTask}
								className="w-full"
								disabled={loading}
							>
								{loading ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Plus className="h-4 w-4 mr-2" />
								)}
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
					>
						<div className="p-4">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Clock className="h-5 w-5" />
								{title}
							</h3>
							<div className="space-y-2">
								{tasks
									.filter((task) => task.block === key)
									.sort((a, b) => {
										// Sort by time start
										const aTime = a.time
											.split("-")[0]
											.trim();
										const bTime = b.time
											.split("-")[0]
											.trim();

										const parseTime = (timeStr: string) => {
											const [time, period] =
												timeStr.split(" ");
											const [hours, minutes] = time
												.split(":")
												.map(Number);
											let hour24 = hours;

											if (period === "PM" && hours !== 12)
												hour24 += 12;
											if (period === "AM" && hours === 12)
												hour24 = 0;

											return hour24 * 60 + minutes;
										};

										return (
											parseTime(aTime) - parseTime(bTime)
										);
									})
									.map((task) => (
										<TaskEditCard
											key={task.id}
											task={task}
											categories={categories}
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
											getCategoryConfig={
												getCategoryConfig
											}
											loading={loading}
										/>
									))}
								{tasks.filter((task) => task.block === key)
									.length === 0 && (
									<div className="text-sm text-muted-foreground text-center p-4 border-2 border-dashed rounded">
										No tasks in this time block
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
	categories: Category[];
	isEditing: boolean;
	onEdit: (updatedTask: Partial<Task>) => void;
	onDelete: () => void;
	onStartEdit: () => void;
	onCancelEdit: () => void;
	getCategoryConfig: (category: string) => any;
	loading: boolean;
}

function TaskEditCard({
	task,
	categories,
	isEditing,
	onEdit,
	onDelete,
	onStartEdit,
	onCancelEdit,
	getCategoryConfig,
	loading,
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

	const categoryConfig = getCategoryConfig(task.category);

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
						disabled={loading}
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
							disabled={loading}
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
							disabled={loading}
						/>
					</div>
					<select
						value={editData.category}
						onChange={(e) =>
							setEditData({
								...editData,
								category: e.target.value,
							})
						}
						className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
						disabled={loading}
					>
						{categories.map((cat) => (
							<option key={cat.id} value={cat.name}>
								{cat.name}
							</option>
						))}
					</select>
					<div className="flex gap-2">
						<Button
							size="sm"
							onClick={handleSave}
							disabled={loading}
						>
							{loading ? (
								<Loader2 className="h-3 w-3 mr-1 animate-spin" />
							) : (
								<Save className="h-3 w-3 mr-1" />
							)}
							Save
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={onCancelEdit}
							disabled={loading}
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
		<div className="p-3 border rounded-lg hover:bg-secondary/50 transition-colors group">
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
					<Button
						size="sm"
						variant="ghost"
						onClick={onStartEdit}
						disabled={loading}
					>
						<Edit2 className="h-3 w-3" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={onDelete}
						disabled={loading}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Category Management Component
interface CategoryManagementProps {
	categories: Category[];
	newCategory: {
		name: string;
		color: string;
		bgColor: string;
		textColor: string;
	};
	setNewCategory: (category: any) => void;
	showAddCategory: boolean;
	setShowAddCategory: (show: boolean) => void;
	editingCategoryId: string | null;
	setEditingCategoryId: (categoryId: string | null) => void;
	onAddCategory: () => void;
	onDeleteCategory: (categoryId: string) => void;
	updateCategoryColor: (categoryId: string, colorConfig: any) => void;
	onCategoryUpdate: (categoryId: string, updates: Partial<Category>) => void;
	handleNewCategoryColorChange: (colorConfig: any) => void;
	loading: boolean;
}

function CategoryManagement({
	categories,
	newCategory,
	setNewCategory,
	showAddCategory,
	setShowAddCategory,
	editingCategoryId,
	setEditingCategoryId,
	onAddCategory,
	onDeleteCategory,
	updateCategoryColor,
	onCategoryUpdate,
	handleNewCategoryColorChange,
	loading,
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
						disabled={loading}
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
									disabled={loading}
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
										disabled={loading}
									/>
								))}
							</div>
						</div>

						<Button
							onClick={onAddCategory}
							className="w-full"
							disabled={loading}
						>
							{loading ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Plus className="h-4 w-4 mr-2" />
							)}
							Create Category
						</Button>
					</div>
				)}
			</div>

			{/* Existing Categories */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{categories.map((category) => (
					<CategoryCard
						key={category.id}
						category={category}
						isEditing={editingCategoryId === category.id}
						onEdit={(updates) =>
							onCategoryUpdate(category.id, updates)
						}
						onDelete={() => onDeleteCategory(category.id)}
						onStartEdit={() => setEditingCategoryId(category.id)}
						onCancelEdit={() => setEditingCategoryId(null)}
						updateCategoryColor={(colorConfig) =>
							updateCategoryColor(category.id, colorConfig)
						}
						loading={loading}
					/>
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
								• Deleting a category will reassign its tasks to
								"Personal"
							</li>
							<li>
								• Changes are saved automatically to the
								database
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}

// Category Card Component
interface CategoryCardProps {
	category: Category;
	isEditing: boolean;
	onEdit: (updates: Partial<Category>) => void;
	onDelete: () => void;
	onStartEdit: () => void;
	onCancelEdit: () => void;
	updateCategoryColor: (colorConfig: (typeof colorOptions)[0]) => void;
	loading: boolean;
}

function CategoryCard({
	category,
	isEditing,
	onEdit,
	onDelete,
	onStartEdit,
	onCancelEdit,
	updateCategoryColor,
	loading,
}: CategoryCardProps) {
	const [editName, setEditName] = useState(category.name);

	const handleSave = () => {
		if (!editName.trim() || editName === category.name) {
			onCancelEdit();
			return;
		}
		onEdit({ name: editName });
	};

	return (
		<Card className="p-4">
			<div className="space-y-4">
				{/* Category Header */}
				<div className="flex items-center justify-between">
					{isEditing ? (
						<div className="flex items-center gap-2 flex-1">
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								className="flex-1"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSave();
									} else if (e.key === "Escape") {
										setEditName(category.name);
										onCancelEdit();
									}
								}}
								disabled={loading}
								autoFocus
							/>
							<Button
								size="sm"
								onClick={handleSave}
								disabled={loading}
							>
								{loading ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<Save className="h-3 w-3" />
								)}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setEditName(category.name);
									onCancelEdit();
								}}
								disabled={loading}
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
										category.color
									)}
								/>
								<span className="font-medium">
									{category.name}
								</span>
							</div>
							<div className="flex gap-1">
								<Button
									size="sm"
									variant="ghost"
									onClick={onStartEdit}
									disabled={loading}
								>
									<Edit2 className="h-3 w-3" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={onDelete}
									disabled={loading}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
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
							category.bgColor,
							category.textColor
						)}
					>
						{category.name} Task
					</div>
				</div>

				{/* Color Options */}
				<div className="space-y-2">
					<Label className="text-xs">Color</Label>
					<div className="grid grid-cols-4 gap-2">
						{colorOptions.slice(0, 8).map((colorOption, index) => (
							<button
								key={index}
								onClick={() => updateCategoryColor(colorOption)}
								className={cn(
									"w-8 h-8 rounded-full border-2 transition-all",
									colorOption.color,
									category.color === colorOption.color
										? "border-foreground scale-110"
										: "border-transparent hover:border-muted-foreground"
								)}
								title={colorOption.name}
								disabled={loading}
							/>
						))}
					</div>
				</div>
			</div>
		</Card>
	);
}
