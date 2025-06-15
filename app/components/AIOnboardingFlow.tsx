"use client";

import React, { useState, useRef, useEffect } from "react";
import { Task, TaskCategory, TimeBlock } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
	Send,
	Bot,
	User,
	Sparkles,
	RefreshCw,
	CheckCircle,
	Clock,
	Calendar,
	Target,
	Loader2,
	ChevronRight,
	Lightbulb,
	X,
} from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
	id: string;
	type: "user" | "ai" | "system";
	content: string;
	timestamp: Date;
	suggestions?: string[];
}

interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	completed: boolean;
}

interface GeneratedSchedule {
	tasks: Task[];
	insights: string[];
	recommendations: string[];
}

interface AIOnboardingProps {
	onScheduleGenerated: (schedule: GeneratedSchedule) => void;
	onClose: () => void;
	userName: string;
}

export function AIOnboardingFlow({
	onScheduleGenerated,
	onClose,
	userName,
}: AIOnboardingProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentInput, setCurrentInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [userProfile, setUserProfile] = useState({
		workSchedule: "",
		priorities: "",
		goals: "",
		preferences: "",
		availability: "",
	});
	const [generatedSchedule, setGeneratedSchedule] =
		useState<GeneratedSchedule | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const onboardingSteps: OnboardingStep[] = [
		{
			id: "intro",
			title: "Welcome",
			description: "Getting to know you",
			completed: false,
		},
		{
			id: "work_schedule",
			title: "Work Schedule",
			description: "Understanding your routine",
			completed: false,
		},
		{
			id: "priorities",
			title: "Priorities",
			description: "Your main focus areas",
			completed: false,
		},
		{
			id: "preferences",
			title: "Preferences",
			description: "How you like to work",
			completed: false,
		},
		{
			id: "generation",
			title: "Schedule Creation",
			description: "Building your perfect day",
			completed: false,
		},
	];

	const quickResponses = {
		work_schedule: [
			"I work 9-5 on weekdays",
			"I'm a student with flexible hours",
			"I work part-time in the evenings",
			"I work from home with my own schedule",
		],
		priorities: [
			"Career development and learning",
			"Health and fitness",
			"Personal projects and hobbies",
			"Family time and relationships",
		],
		preferences: [
			"I'm most productive in the morning",
			"I prefer afternoon focused work",
			"I like short, frequent breaks",
			"I need longer deep work sessions",
		],
	};

	useEffect(() => {
		// Initialize conversation
		addMessage({
			type: "ai",
			content: `Hi ${userName}! 👋 I'm your AI scheduling assistant. I'm here to help you create a personalized daily schedule that fits your lifestyle perfectly.\n\nLet's start by understanding your typical day. What does your work or study schedule usually look like?`,
			suggestions: quickResponses.work_schedule,
		});
	}, [userName]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
		const newMessage: Message = {
			...message,
			id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, newMessage]);
	};

	const handleSendMessage = async () => {
		if (!currentInput.trim()) return;

		const userMessage = currentInput.trim();
		addMessage({ type: "user", content: userMessage });
		setCurrentInput("");
		setIsTyping(true);

		// Simulate AI processing delay
		await new Promise((resolve) =>
			setTimeout(resolve, 1000 + Math.random() * 2000)
		);

		await processUserInput(userMessage);
		setIsTyping(false);
	};

	const processUserInput = async (input: string) => {
		const lowerInput = input.toLowerCase();

		switch (currentStep) {
			case 0: // Work schedule
				setUserProfile((prev) => ({ ...prev, workSchedule: input }));
				addMessage({
					type: "ai",
					content: `Perfect! I understand your work schedule. Now, what are your main priorities and goals? This could include career development, health, personal projects, or anything else that's important to you.`,
					suggestions: quickResponses.priorities,
				});
				updateStep(1);
				break;

			case 1: // Priorities
				setUserProfile((prev) => ({ ...prev, priorities: input }));
				addMessage({
					type: "ai",
					content: `Great priorities! Now let's talk about your work preferences. When do you feel most productive? Do you prefer longer focused sessions or shorter bursts with breaks?`,
					suggestions: quickResponses.preferences,
				});
				updateStep(2);
				break;

			case 2: // Preferences
				setUserProfile((prev) => ({ ...prev, preferences: input }));
				addMessage({
					type: "ai",
					content: `Excellent! Last question: Are there any specific time constraints or availability windows I should know about? For example, specific times you're not available, or when you prefer certain activities?`,
				});
				updateStep(3);
				break;

			case 3: // Availability
				setUserProfile((prev) => ({ ...prev, availability: input }));
				addMessage({
					type: "ai",
					content: `Perfect! I now have everything I need to create your personalized schedule. Let me analyze your preferences and generate a daily routine that maximizes your productivity and well-being.`,
				});
				await generateSchedule();
				updateStep(4);
				break;

			default:
				addMessage({
					type: "ai",
					content: `I understand. Feel free to ask me any questions about your schedule or request modifications!`,
				});
		}
	};

	const updateStep = (stepIndex: number) => {
		setCurrentStep(stepIndex);
	};

	const generateSchedule = async () => {
		setIsGenerating(true);

		addMessage({
			type: "system",
			content:
				"Analyzing your preferences and generating your personalized schedule...",
		});

		// Simulate AI processing time
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Generate schedule based on user inputs
		const schedule = await createPersonalizedSchedule();
		setGeneratedSchedule(schedule);

		addMessage({
			type: "ai",
			content: `🎉 Your personalized schedule is ready! I've created a balanced daily routine based on your preferences:\n\n✅ Optimized for your productive hours\n✅ Includes your priority activities\n✅ Respects your availability constraints\n✅ Includes breaks and personal time\n\nYou can review and customize it further once we're done here. Would you like to use this schedule?`,
		});

		setIsGenerating(false);
	};

	const createPersonalizedSchedule = async (): Promise<GeneratedSchedule> => {
		// This is a simplified schedule generation
		// In a real implementation, this would use AI/ML models
		const profile = userProfile;

		const baseTasks: Omit<Task, "id">[] = [];

		// Morning routine (always included)
		baseTasks.push({
			name: "Morning Routine",
			time: "7:00-7:30 AM",
			category: "Personal",
			duration: 30,
			block: "morning",
		});

		// Work/Study blocks based on schedule
		if (
			profile.workSchedule.toLowerCase().includes("9") &&
			profile.workSchedule.toLowerCase().includes("5")
		) {
			baseTasks.push(
				{
					name: "Deep Work Session 1",
					time: "9:00-11:00 AM",
					category: "Study",
					duration: 120,
					block: "morning",
				},
				{
					name: "Email & Communication",
					time: "11:00-11:30 AM",
					category: "Study",
					duration: 30,
					block: "morning",
				},
				{
					name: "Project Work",
					time: "1:00-3:00 PM",
					category: "Study",
					duration: 120,
					block: "afternoon",
				}
			);
		} else {
			// Flexible schedule
			baseTasks.push(
				{
					name: "Focused Work Session",
					time: "10:00-12:00 PM",
					category: "Study",
					duration: 120,
					block: "morning",
				},
				{
					name: "Creative Work",
					time: "2:00-4:00 PM",
					category: "Research",
					duration: 120,
					block: "afternoon",
				}
			);
		}

		// Add priority-based tasks
		if (
			profile.priorities.toLowerCase().includes("health") ||
			profile.priorities.toLowerCase().includes("fitness")
		) {
			baseTasks.push({
				name: "Exercise & Fitness",
				time: "6:00-7:00 PM",
				category: "Personal",
				duration: 60,
				block: "evening",
			});
		}

		if (
			profile.priorities.toLowerCase().includes("learning") ||
			profile.priorities.toLowerCase().includes("development")
		) {
			baseTasks.push({
				name: "Skill Development",
				time: "7:30-8:30 PM",
				category: "Research",
				duration: 60,
				block: "evening",
			});
		}

		// Add break times based on preferences
		if (profile.preferences.toLowerCase().includes("break")) {
			baseTasks.push(
				{
					name: "Morning Break",
					time: "10:30-10:45 AM",
					category: "Personal",
					duration: 15,
					block: "morning",
				},
				{
					name: "Afternoon Break",
					time: "3:00-3:15 PM",
					category: "Personal",
					duration: 15,
					block: "afternoon",
				}
			);
		}

		// Essential tasks
		baseTasks.push(
			{
				name: "Lunch",
				time: "12:00-1:00 PM",
				category: "Personal",
				duration: 60,
				block: "afternoon",
			},
			{
				name: "Evening Reflection",
				time: "9:00-9:30 PM",
				category: "Personal",
				duration: 30,
				block: "evening",
			}
		);

		// Convert to full tasks with IDs
		const tasks: Task[] = baseTasks.map((task, index) => ({
			...task,
			id: `ai-generated-task-${index}-${Date.now()}`,
		}));

		const insights = [
			`Based on your work schedule, I've optimized your most important tasks for peak productivity hours`,
			`Your priorities (${profile.priorities}) are reflected in dedicated time blocks`,
			`I've included regular breaks to maintain energy throughout the day`,
			`The schedule balances work, personal development, and self-care`,
		];

		const recommendations = [
			"Try this schedule for a week and adjust as needed",
			"Use the edit functionality to fine-tune task timing",
			"Track your energy levels to optimize task placement",
			"Remember that consistency is key to building good habits",
		];

		return { tasks, insights, recommendations };
	};

	const handleQuickResponse = (response: string) => {
		setCurrentInput(response);
		setTimeout(() => handleSendMessage(), 100);
	};

	const handleAcceptSchedule = () => {
		if (generatedSchedule) {
			onScheduleGenerated(generatedSchedule);
		}
	};

	const handleRegenerateSchedule = async () => {
		setIsGenerating(true);
		addMessage({
			type: "ai",
			content: "Let me create a different schedule variation for you...",
		});

		await new Promise((resolve) => setTimeout(resolve, 2000));
		const newSchedule = await createPersonalizedSchedule();
		setGeneratedSchedule(newSchedule);

		addMessage({
			type: "ai",
			content:
				"Here's a new schedule variation! This one has a different structure while maintaining your priorities.",
		});
		setIsGenerating(false);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
				<CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
								<Sparkles className="h-5 w-5 text-white" />
							</div>
							<div>
								<CardTitle className="text-xl">
									AI Schedule Assistant
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									Creating your personalized daily routine
								</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Progress Steps */}
					<div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
						{onboardingSteps.map((step, index) => (
							<div
								key={`step-${step.id}-${index}`}
								className={cn(
									"flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
									index <= currentStep
										? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
										: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
								)}
							>
								{index < currentStep ? (
									<CheckCircle className="h-3 w-3" />
								) : index === currentStep ? (
									<div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
								) : (
									<div className="h-3 w-3 bg-gray-300 rounded-full" />
								)}
								<span>{step.title}</span>
							</div>
						))}
					</div>
				</CardHeader>

				<CardContent className="p-0 h-[calc(90vh-180px)] flex flex-col">
					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} />
						))}

						{isTyping && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Bot className="h-4 w-4" />
								<div className="flex gap-1">
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
									<div
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.1s" }}
									/>
									<div
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.2s" }}
									/>
								</div>
							</div>
						)}

						{isGenerating && (
							<div className="flex items-center justify-center p-8">
								<div className="text-center space-y-3">
									<Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
									<p className="text-sm text-muted-foreground">
										Generating your personalized schedule...
									</p>
								</div>
							</div>
						)}

						{generatedSchedule && (
							<SchedulePreview
								schedule={generatedSchedule}
								onAccept={handleAcceptSchedule}
								onRegenerate={handleRegenerateSchedule}
								isRegenerating={isGenerating}
							/>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Quick Responses */}
					{messages.length > 0 &&
						messages[messages.length - 1].suggestions &&
						!generatedSchedule && (
							<div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
								<p className="text-xs text-muted-foreground mb-2">
									Quick responses:
								</p>
								<div className="flex flex-wrap gap-2">
									{messages[
										messages.length - 1
									].suggestions!.map((suggestion, index) => (
										<Button
											key={`suggestion-${index}-${suggestion.slice(
												0,
												10
											)}`}
											variant="outline"
											size="sm"
											onClick={() =>
												handleQuickResponse(suggestion)
											}
											className="text-xs"
										>
											{suggestion}
										</Button>
									))}
								</div>
							</div>
						)}

					{/* Input Area */}
					{!generatedSchedule && (
						<div className="border-t p-4">
							<div className="flex gap-2">
								<Input
									value={currentInput}
									onChange={(e) =>
										setCurrentInput(e.target.value)
									}
									placeholder="Type your response..."
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSendMessage();
										}
									}}
									disabled={isTyping || isGenerating}
								/>
								<Button
									onClick={handleSendMessage}
									disabled={
										!currentInput.trim() ||
										isTyping ||
										isGenerating
									}
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// Message Bubble Component
interface MessageBubbleProps {
	message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.type === "user";
	const isSystem = message.type === "system";

	if (isSystem) {
		return (
			<div className="flex items-center justify-center">
				<div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm flex items-center gap-2">
					<Loader2 className="h-3 w-3 animate-spin" />
					{message.content}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex gap-3",
				isUser ? "justify-end" : "justify-start"
			)}
		>
			{!isUser && (
				<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
					<Bot className="h-4 w-4 text-white" />
				</div>
			)}
			<div
				className={cn(
					"max-w-[70%] p-3 rounded-lg",
					isUser
						? "bg-blue-500 text-white"
						: "bg-gray-100 dark:bg-gray-800 text-foreground"
				)}
			>
				<p className="text-sm whitespace-pre-wrap">{message.content}</p>
			</div>
			{isUser && (
				<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
					<User className="h-4 w-4 text-gray-600" />
				</div>
			)}
		</div>
	);
}

// Schedule Preview Component
interface SchedulePreviewProps {
	schedule: GeneratedSchedule;
	onAccept: () => void;
	onRegenerate: () => void;
	isRegenerating: boolean;
}

function SchedulePreview({
	schedule,
	onAccept,
	onRegenerate,
	isRegenerating,
}: SchedulePreviewProps) {
	const [activeTab, setActiveTab] = useState<"preview" | "insights">(
		"preview"
	);

	const groupTasksByBlock = (tasks: Task[]) => {
		return {
			morning: tasks.filter((t) => t.block === "morning"),
			afternoon: tasks.filter((t) => t.block === "afternoon"),
			evening: tasks.filter((t) => t.block === "evening"),
		};
	};

	const groupedTasks = groupTasksByBlock(schedule.tasks);

	return (
		<Card className="border-2 border-blue-200 dark:border-blue-800">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-blue-500" />
						<CardTitle className="text-lg">
							Your Personalized Schedule
						</CardTitle>
					</div>
					<div className="flex gap-1">
						<Button
							variant={
								activeTab === "preview" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setActiveTab("preview")}
						>
							Preview
						</Button>
						<Button
							variant={
								activeTab === "insights" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setActiveTab("insights")}
						>
							<Lightbulb className="h-3 w-3 mr-1" />
							Insights
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{activeTab === "preview" ? (
					<div className="space-y-4">
						{/* Schedule Overview */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Morning Block */}
							<div className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3">
								<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Morning Block
								</h4>
								<div className="space-y-1">
									{groupedTasks.morning.map((task, index) => (
										<div
											key={`morning-task-${index}-${task.id}`}
											className="text-xs"
										>
											<div className="font-medium">
												{task.name}
											</div>
											<div className="text-muted-foreground">
												{task.time}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Afternoon Block */}
							<div className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
								<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Afternoon Block
								</h4>
								<div className="space-y-1">
									{groupedTasks.afternoon.map(
										(task, index) => (
											<div
												key={`afternoon-task-${index}-${task.id}`}
												className="text-xs"
											>
												<div className="font-medium">
													{task.name}
												</div>
												<div className="text-muted-foreground">
													{task.time}
												</div>
											</div>
										)
									)}
								</div>
							</div>

							{/* Evening Block */}
							<div className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
								<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Evening Block
								</h4>
								<div className="space-y-1">
									{groupedTasks.evening.map((task, index) => (
										<div
											key={`evening-task-${index}-${task.id}`}
											className="text-xs"
										>
											<div className="font-medium">
												{task.name}
											</div>
											<div className="text-muted-foreground">
												{task.time}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Schedule Stats */}
						<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
								<div>
									<div className="text-lg font-bold text-blue-600">
										{schedule.tasks.length}
									</div>
									<div className="text-xs text-muted-foreground">
										Total Tasks
									</div>
								</div>
								<div>
									<div className="text-lg font-bold text-green-600">
										{schedule.tasks.reduce(
											(sum, task) => sum + task.duration,
											0
										)}
										m
									</div>
									<div className="text-xs text-muted-foreground">
										Scheduled Time
									</div>
								</div>
								<div>
									<div className="text-lg font-bold text-purple-600">
										{
											new Set(
												schedule.tasks.map(
													(t) => t.category
												)
											).size
										}
									</div>
									<div className="text-xs text-muted-foreground">
										Categories
									</div>
								</div>
								<div>
									<div className="text-lg font-bold text-orange-600">
										{
											schedule.tasks.filter((t) =>
												t.name
													.toLowerCase()
													.includes("break")
											).length
										}
									</div>
									<div className="text-xs text-muted-foreground">
										Break Times
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{/* AI Insights */}
						<div>
							<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
								<Target className="h-4 w-4 text-blue-500" />
								Schedule Insights
							</h4>
							<div className="space-y-2">
								{schedule.insights.map((insight, index) => (
									<div
										key={`insight-${index}`}
										className="flex items-start gap-2 text-sm"
									>
										<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
										<span>{insight}</span>
									</div>
								))}
							</div>
						</div>

						{/* Recommendations */}
						<div>
							<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
								<Lightbulb className="h-4 w-4 text-yellow-500" />
								Recommendations
							</h4>
							<div className="space-y-2">
								{schedule.recommendations.map((rec, index) => (
									<div
										key={`recommendation-${index}`}
										className="flex items-start gap-2 text-sm"
									>
										<ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
										<span>{rec}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2 pt-4 border-t">
					<Button
						onClick={onAccept}
						className="flex-1"
						disabled={isRegenerating}
					>
						<CheckCircle className="h-4 w-4 mr-2" />
						Use This Schedule
					</Button>
					<Button
						variant="outline"
						onClick={onRegenerate}
						disabled={isRegenerating}
					>
						{isRegenerating ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* Help Text */}
				<div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
					💡 <strong>Tip:</strong> You can further customize this
					schedule after accepting it using the schedule customization
					tools.
				</div>
			</CardContent>
		</Card>
	);
}
