// app/components/AIOnboardingFlow.tsx - FIXED VERSION
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Task, TaskCategory, TimeBlock } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { MessageBubble, TypingIndicator, type Message } from "./MessageBubble";
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
	Search,
	Brain,
} from "lucide-react";
import { cn } from "../lib/utils";

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
	mode?: "onboarding" | "assistant";
	currentTasks?: Task[];
}

export function AIOnboardingFlow({
	onScheduleGenerated,
	onClose,
	userName,
	mode = "onboarding",
	currentTasks = [],
}: AIOnboardingProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentInput, setCurrentInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [userProfile, setUserProfile] = useState({
		constraints: "",
		goals: "",
		productivity: "",
		wakeTime: "",
		workStyle: "",
	});
	const [generatedSchedule, setGeneratedSchedule] =
		useState<GeneratedSchedule | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [researchResults, setResearchResults] = useState<{
		practices: string[];
		timeAllocations: Record<string, number>;
		scientificBacking: string[];
	} | null>(null);
	const [isResearching, setIsResearching] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const onboardingSteps: OnboardingStep[] = [
		{
			id: "intro",
			title: "Welcome",
			description: "Getting to know you",
			completed: false,
		},
		{
			id: "constraints",
			title: "Constraints",
			description: "Your fixed commitments",
			completed: false,
		},
		{
			id: "goals",
			title: "Goals",
			description: "What you're optimizing for",
			completed: false,
		},
		{
			id: "research",
			title: "Research",
			description: "AI analyzing best practices",
			completed: false,
		},
		{
			id: "preferences",
			title: "Preferences",
			description: "Your work style",
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
		constraints: [
			"I work 9-5 on weekdays",
			"I'm a student with flexible hours",
			"I work part-time in the evenings",
			"I work from home with flexible schedule",
		],
		goals: [
			"Career development and learning",
			"Health and fitness improvement",
			"Academic excellence",
			"Work-life balance",
		],
		preferences: [
			"I'm most productive in the morning",
			"I prefer afternoon focused work",
			"I like short, frequent breaks",
			"I need longer deep work sessions",
		],
	};

	// FIXED: Prevent duplicate initialization and messages
	useEffect(() => {
		if (!hasInitialized) {
			setHasInitialized(true);
			initializeConversation();
		}
	}, [hasInitialized, userName, mode]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// FIXED: Separate initialization function to prevent duplicate messages
	const initializeConversation = () => {
		if (mode === "onboarding") {
			addMessage({
				type: "ai",
				content: `Hey welcome to Atomic, I'm here to help you level up and stay on top of your tasks! Let's get started!\n\nWhat are your current fixed-time constraints? (work hours, commitments, classes, etc.)`,
				suggestions: quickResponses.constraints,
			});
		} else {
			addMessage({
				type: "ai",
				content: `Hi ${userName}! I'm your AI assistant. I can help you optimize your current schedule, suggest improvements, or create new task arrangements. What would you like to work on today?`,
				suggestions: [
					"Optimize my current schedule",
					"Suggest better time slots",
					"Help me add a new routine",
					"Analyze my productivity patterns",
				],
			});
		}
	};

	const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
		const newMessage: Message = {
			...message,
			id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

		if (mode === "onboarding") {
			await processOnboardingInput(userMessage);
		} else {
			await processAssistantInput(userMessage);
		}
		setIsTyping(false);
	};

	const processOnboardingInput = async (input: string) => {
		switch (currentStep) {
			case 0: // Constraints
				setUserProfile((prev) => ({ ...prev, constraints: input }));
				addMessage({
					type: "ai",
					content: `Perfect! I understand your constraints. Now, what are your goals in life, what are you trying to optimize for? (health, knowledge, relationships, career, etc.)`,
					suggestions: quickResponses.goals,
				});
				updateStep(1);
				break;

			case 1: // Goals
				setUserProfile((prev) => ({ ...prev, goals: input }));
				addMessage({
					type: "system",
					content: "Researching optimal practices for your goals...",
				});
				await performGoalResearch(input);
				updateStep(2);
				break;

			case 2: // This step is handled by research completion
				break;

			case 3: // Preferences
				setUserProfile((prev) => ({ ...prev, productivity: input }));
				addMessage({
					type: "ai",
					content: `Great! Last question: When do you feel most productive? What is your preferred wake up time? Do you prefer long work pushes with longer breaks, or short work pushes with shorter breaks?`,
				});
				updateStep(4);
				break;

			case 4: // Work style
				const wakeTimeMatch = input.match(
					/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i
				);
				const wakeTime = wakeTimeMatch ? wakeTimeMatch[1] : "7:00 AM";

				setUserProfile((prev) => ({
					...prev,
					workStyle: input,
					wakeTime: wakeTime,
				}));

				addMessage({
					type: "ai",
					content: `Perfect! I now have everything I need to create your personalized schedule. Let me analyze your preferences and generate a daily routine that maximizes your productivity and well-being.`,
				});
				await generateAISchedule();
				updateStep(5);
				break;

			default:
				addMessage({
					type: "ai",
					content: `I understand. Feel free to ask me any questions about your schedule or request modifications!`,
				});
		}
	};

	const processAssistantInput = async (input: string) => {
		const lowerInput = input.toLowerCase();

		if (lowerInput.includes("optimize") || lowerInput.includes("improve")) {
			await optimizeCurrentSchedule(input);
		} else if (
			lowerInput.includes("research") ||
			lowerInput.includes("best practices")
		) {
			await performGoalResearch(input);
		} else {
			addMessage({
				type: "ai",
				content: `I can help you with schedule optimization, research best practices for your goals, or provide specific recommendations. What would you like to focus on?`,
				suggestions: [
					"Optimize my current schedule",
					"Research best practices for my goals",
					"Suggest time slots for a new task",
					"Analyze my schedule efficiency",
				],
			});
		}
	};

	// FIXED: Accept goals as string and handle API failures gracefully
	const performGoalResearch = async (goals: string) => {
		setIsResearching(true);
		try {
			const response = await fetch("/api/ai/research", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					goals: goals, // FIXED: Send as string, not array
				}),
			});

			if (!response.ok) {
				throw new Error("Research request failed");
			}

			const result = await response.json();

			// FIXED: Handle both success and error responses properly
			if (!result.success) {
				throw new Error(result.error || "Research request failed");
			}

			const data = result.data;
			setResearchResults(data);

			// Create insights message
			const insights = [
				"🧠 **Research-Based Insights:**",
				...data.practices.slice(0, 3),
				"",
				"📊 **Optimal Time Allocations:**",
				...Object.entries(data.timeAllocations)
					.slice(0, 3)
					.map(
						([activity, minutes]) =>
							`• ${activity}: ${minutes} minutes daily`
					),
				"",
				"🔬 **Scientific Backing:**",
				...data.scientificBacking.slice(0, 2),
			].join("\n");

			addMessage({
				type: "ai",
				content: insights,
			});

			if (mode === "onboarding") {
				addMessage({
					type: "ai",
					content: `Based on this research, when do you feel most productive? What is your preferred wake up time? Do you prefer long work pushes with longer breaks, or short work pushes with shorter breaks?`,
					suggestions: quickResponses.preferences,
				});
				updateStep(3);
			}
		} catch (error) {
			console.error("Research failed:", error);

			// FIXED: Provide helpful fallback message instead of error
			addMessage({
				type: "ai",
				content: `I'll continue with general best practices for your goals. Based on productivity research, here are some key principles:\n\n🧠 **Core Strategies:**\n• Schedule demanding tasks during your peak energy hours\n• Use time-blocking to create structure and reduce decision fatigue\n• Include regular breaks to maintain cognitive performance\n\n📊 **Recommended Allocations:**\n• Deep work: 2-3 hour blocks\n• Learning: 60-90 minute sessions\n• Breaks: 15-20 minutes every 90 minutes`,
			});

			if (mode === "onboarding") {
				addMessage({
					type: "ai",
					content: `When do you feel most productive? What is your preferred wake up time? Do you prefer long work pushes with longer breaks, or short work pushes with shorter breaks?`,
					suggestions: quickResponses.preferences,
				});
				updateStep(3);
			}
		} finally {
			setIsResearching(false);
		}
	};

	const optimizeCurrentSchedule = async (optimizationGoal: string) => {
		setIsGenerating(true);
		addMessage({
			type: "system",
			content:
				"Analyzing your current schedule and generating optimization suggestions...",
		});

		try {
			const response = await fetch("/api/ai/optimize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					currentTasks,
					optimizationGoal,
				}),
			});

			if (!response.ok) {
				throw new Error("Optimization request failed");
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Optimization failed");
			}

			const data = result.data;

			const optimizationContent = [
				"🎯 **Schedule Optimization Results:**",
				"",
				"**Suggested Changes:**",
				...data.suggestions.map(
					(suggestion: any) =>
						`• ${suggestion.type.toUpperCase()}: ${
							suggestion.task
						}${
							suggestion.newTime ? ` → ${suggestion.newTime}` : ""
						}\n  Reason: ${suggestion.reasoning}`
				),
				"",
				"**Key Insights:**",
				...data.insights,
			].join("\n");

			addMessage({
				type: "ai",
				content: optimizationContent,
			});
		} catch (error) {
			console.error("Optimization failed:", error);
			addMessage({
				type: "ai",
				content: `Here are some general optimization recommendations for your schedule:\n\n• Consider moving demanding tasks to your peak energy hours\n• Ensure adequate breaks between intensive activities\n• Group similar tasks together to minimize context switching\n• Review your current task distribution across morning, afternoon, and evening blocks`,
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const generateAISchedule = async () => {
		setIsGenerating(true);

		addMessage({
			type: "system",
			content:
				"Analyzing your preferences and generating your personalized schedule...",
		});

		try {
			const response = await fetch("/api/ai/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userInputs: userProfile,
				}),
			});

			if (!response.ok) {
				throw new Error("Schedule generation failed");
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Schedule generation failed");
			}

			const data = result.data;

			// Transform the AI response to match our Task interface
			const transformedTasks: Task[] = data.tasks.map(
				(task: any, index: number) => ({
					id: `ai-generated-task-${index}-${Date.now()}`,
					name: task.name,
					time: task.time,
					category: task.category,
					duration: task.duration,
					block: task.block,
				})
			);

			const schedule: GeneratedSchedule = {
				tasks: transformedTasks,
				insights: data.insights,
				recommendations: data.recommendations,
			};

			setGeneratedSchedule(schedule);

			addMessage({
				type: "ai",
				content: `🎉 Your personalized schedule is ready! I've created a balanced daily routine based on your preferences and productivity research:\n\n✅ Optimized for your productive hours and constraints\n✅ Incorporates research-backed practices for your goals\n✅ Includes your preferred work style and timing\n✅ Balances work, personal time, and breaks\n\nYou can review the full schedule below. Would you like to use this schedule?`,
			});
		} catch (error) {
			console.error("Schedule generation failed:", error);
			// Fallback to a basic schedule
			const fallbackSchedule = await createFallbackSchedule();
			setGeneratedSchedule(fallbackSchedule);

			addMessage({
				type: "ai",
				content: `I created a personalized schedule based on your preferences using proven productivity principles. While I couldn't access the latest research due to a connectivity issue, this schedule follows established best practices and can be customized further.`,
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const createFallbackSchedule = async (): Promise<GeneratedSchedule> => {
		const profile = userProfile;
		const baseTasks: Omit<Task, "id">[] = [];

		// Parse wake time or default to 7 AM
		const wakeTimeMatch = profile.wakeTime.match(/(\d{1,2})/);
		const wakeHour = wakeTimeMatch ? parseInt(wakeTimeMatch[1]) : 7;
		const adjustedWakeHour = Math.max(6, Math.min(10, wakeHour));

		// Morning routine (always included)
		baseTasks.push({
			name: "Morning Routine & Planning",
			time: `${adjustedWakeHour}:00-${adjustedWakeHour}:30 AM`,
			category: "Personal",
			duration: 30,
			block: "morning",
		});

		// Analyze constraints for work pattern
		const constraints = profile.constraints.toLowerCase();
		const goals = profile.goals.toLowerCase();

		// Work/Study blocks based on constraints
		if (constraints.includes("9") && constraints.includes("5")) {
			baseTasks.push(
				{
					name: "Deep Work Session 1",
					time: "9:00-11:00 AM",
					category: "Work",
					duration: 120,
					block: "morning",
				},
				{
					name: "Administrative Tasks & Email",
					time: "11:00-11:30 AM",
					category: "Work",
					duration: 30,
					block: "morning",
				},
				{
					name: "Project Work & Collaboration",
					time: "1:00-3:00 PM",
					category: "Work",
					duration: 120,
					block: "afternoon",
				}
			);
		} else if (constraints.includes("student")) {
			baseTasks.push(
				{
					name: "Primary Study Session",
					time: `${adjustedWakeHour + 1}:00-${
						adjustedWakeHour + 3
					}:00 AM`,
					category: "Study",
					duration: 120,
					block: "morning",
				},
				{
					name: "Practice & Review",
					time: "2:00-3:30 PM",
					category: "Study",
					duration: 90,
					block: "afternoon",
				}
			);
		} else {
			baseTasks.push(
				{
					name: "Focused Work Session",
					time: "9:00-11:00 AM",
					category: "Study",
					duration: 120,
					block: "morning",
				},
				{
					name: "Creative Work",
					time: "2:00-4:00 PM",
					category: "Work",
					duration: 120,
					block: "afternoon",
				}
			);
		}

		// Add goal-based tasks
		if (goals.includes("health") || goals.includes("fitness")) {
			baseTasks.push({
				name: "Exercise & Fitness",
				time: "6:00-7:00 PM",
				category: "Personal",
				duration: 60,
				block: "evening",
			});
		}

		if (
			goals.includes("learning") ||
			goals.includes("development") ||
			goals.includes("skill")
		) {
			baseTasks.push({
				name: "Skill Development",
				time: "7:30-8:30 PM",
				category: "Study",
				duration: 60,
				block: "evening",
			});
		}

		if (
			goals.includes("fintech") ||
			goals.includes("entrepreneur") ||
			goals.includes("business")
		) {
			baseTasks.push({
				name: "Industry Research & Networking",
				time: "4:00-5:30 PM",
				category: "Research",
				duration: 90,
				block: "afternoon",
			});
		}

		// Add break times based on work style
		if (
			profile.workStyle.toLowerCase().includes("break") ||
			profile.workStyle.toLowerCase().includes("short")
		) {
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
					time: "3:30-3:45 PM",
					category: "Personal",
					duration: 15,
					block: "afternoon",
				}
			);
		}

		// Essential tasks
		baseTasks.push(
			{
				name: "Lunch & Recharge",
				time: "12:00-1:00 PM",
				category: "Personal",
				duration: 60,
				block: "afternoon",
			},
			{
				name: "Evening Planning & Reflection",
				time: "9:00-9:30 PM",
				category: "Personal",
				duration: 30,
				block: "evening",
			}
		);

		// Convert to full tasks with IDs
		const tasks: Task[] = baseTasks.map((task, index) => ({
			...task,
			id: `fallback-task-${index}-${Date.now()}`,
		}));

		const insights = [
			`Optimized for your ${profile.wakeTime} wake time and work schedule`,
			`Focused on your key goals: ${profile.goals}`,
			`Adapted to your work constraints: ${profile.constraints}`,
			`Designed around your productivity preferences: ${profile.productivity}`,
			`Includes strategic breaks to maintain energy throughout the day`,
		];

		const recommendations = [
			"Try this schedule for a week and track how you feel",
			"Adjust task timing based on your energy levels throughout the day",
			"Use the customization tools to fine-tune specific tasks",
			"Pay attention to which time blocks work best for different types of work",
			"Remember that consistency is more important than perfection",
		];

		return { tasks, insights, recommendations };
	};

	const updateStep = (stepIndex: number) => {
		setCurrentStep(stepIndex);
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

		// Add slight variation to user profile for different results
		const variedProfile = {
			...userProfile,
			workStyle: userProfile.workStyle + " with more flexibility",
		};

		try {
			const response = await fetch("/api/ai/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userInputs: variedProfile,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					const data = result.data;
					const transformedTasks: Task[] = data.tasks.map(
						(task: any, index: number) => ({
							id: `ai-regenerated-task-${index}-${Date.now()}`,
							name: task.name,
							time: task.time,
							category: task.category,
							duration: task.duration,
							block: task.block,
						})
					);

					setGeneratedSchedule({
						tasks: transformedTasks,
						insights: data.insights,
						recommendations: data.recommendations,
					});
				} else {
					throw new Error(result.error);
				}
			} else {
				throw new Error("Regeneration failed");
			}
		} catch (error) {
			console.error("Regeneration failed:", error);
			const newSchedule = await createFallbackSchedule();
			setGeneratedSchedule(newSchedule);
		}

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
									{mode === "onboarding"
										? "AI Schedule Assistant"
										: "AI Productivity Assistant"}
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									{mode === "onboarding"
										? "Creating your personalized daily routine"
										: "Optimizing your schedule with AI insights"}
								</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Progress Steps - Only show for onboarding */}
					{mode === "onboarding" && (
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
					)}
				</CardHeader>

				<CardContent className="p-0 h-[calc(90vh-180px)] flex flex-col">
					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.map((message) => (
							<MessageBubble key={message.id} message={message} />
						))}

						{/* Typing Indicator */}
						{isTyping && <TypingIndicator aiName="AI Assistant" />}

						{/* Research Indicator */}
						{isResearching && (
							<div className="flex items-center justify-center p-8">
								<div className="text-center space-y-3">
									<div className="flex items-center gap-2 justify-center">
										<Search className="h-6 w-6 animate-pulse text-blue-500" />
										<Brain className="h-6 w-6 animate-pulse text-purple-500" />
									</div>
									<p className="text-sm text-muted-foreground">
										Researching latest best practices for
										your goals...
									</p>
									<div className="flex justify-center gap-1">
										<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
										<div
											className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
											style={{ animationDelay: "0.1s" }}
										/>
										<div
											className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
											style={{ animationDelay: "0.2s" }}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Generation Indicator */}
						{isGenerating && (
							<div className="flex items-center justify-center p-8">
								<div className="text-center space-y-3">
									<Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
									<p className="text-sm text-muted-foreground">
										{mode === "onboarding"
											? "Generating your personalized schedule..."
											: "Analyzing and optimizing your schedule..."}
									</p>
									<div className="flex justify-center gap-1">
										<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
										<div
											className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
											style={{ animationDelay: "0.2s" }}
										/>
										<div
											className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
											style={{ animationDelay: "0.4s" }}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Generated Schedule Preview */}
						{generatedSchedule && (
							<SchedulePreview
								schedule={generatedSchedule}
								onAccept={handleAcceptSchedule}
								onRegenerate={handleRegenerateSchedule}
								isRegenerating={isGenerating}
								mode={mode}
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
											className="text-xs hover:bg-primary/10 transition-colors"
										>
											{suggestion}
										</Button>
									))}
								</div>
							</div>
						)}

					{/* Input Area */}
					{!generatedSchedule && (
						<div className="border-t p-4 bg-white dark:bg-gray-950">
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
									disabled={
										isTyping ||
										isGenerating ||
										isResearching
									}
									className="flex-1"
								/>
								<Button
									onClick={handleSendMessage}
									disabled={
										!currentInput.trim() ||
										isTyping ||
										isGenerating ||
										isResearching
									}
									className="px-6"
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
							<div className="text-xs text-muted-foreground mt-2 text-center">
								Press Enter to send • Shift+Enter for new line
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// Enhanced Schedule Preview Component
interface SchedulePreviewProps {
	schedule: GeneratedSchedule;
	onAccept: () => void;
	onRegenerate: () => void;
	isRegenerating: boolean;
	mode: "onboarding" | "assistant";
}

function SchedulePreview({
	schedule,
	onAccept,
	onRegenerate,
	isRegenerating,
	mode,
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
		<Card className="border-2 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-blue-500" />
						<CardTitle className="text-lg">
							{mode === "onboarding"
								? "Your Personalized Schedule"
								: "Optimized Schedule"}
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
							<div className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 transition-all hover:shadow-md">
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
									{groupedTasks.morning.length === 0 && (
										<div className="text-xs text-muted-foreground italic">
											No morning tasks
										</div>
									)}
								</div>
							</div>

							{/* Afternoon Block */}
							<div className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950 rounded-lg p-3 transition-all hover:shadow-md">
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
									{groupedTasks.afternoon.length === 0 && (
										<div className="text-xs text-muted-foreground italic">
											No afternoon tasks
										</div>
									)}
								</div>
							</div>

							{/* Evening Block */}
							<div className="border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950 rounded-lg p-3 transition-all hover:shadow-md">
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
									{groupedTasks.evening.length === 0 && (
										<div className="text-xs text-muted-foreground italic">
											No evening tasks
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Schedule Stats */}
						<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
								<div className="transition-all hover:scale-105">
									<div className="text-lg font-bold text-blue-600">
										{schedule.tasks.length}
									</div>
									<div className="text-xs text-muted-foreground">
										Total Tasks
									</div>
								</div>
								<div className="transition-all hover:scale-105">
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
								<div className="transition-all hover:scale-105">
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
								<div className="transition-all hover:scale-105">
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
								AI-Generated Insights
							</h4>
							<div className="space-y-2">
								{schedule.insights.map((insight, index) => (
									<div
										key={`insight-${index}`}
										className="flex items-start gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded-md transition-all hover:bg-blue-100 dark:hover:bg-blue-900"
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
								AI Recommendations
							</h4>
							<div className="space-y-2">
								{schedule.recommendations.map((rec, index) => (
									<div
										key={`recommendation-${index}`}
										className="flex items-start gap-2 text-sm p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900"
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
						className="flex-1 transition-all hover:scale-105"
						disabled={isRegenerating}
					>
						<CheckCircle className="h-4 w-4 mr-2" />
						{mode === "onboarding"
							? "Use This Schedule"
							: "Apply Changes"}
					</Button>
					<Button
						variant="outline"
						onClick={onRegenerate}
						disabled={isRegenerating}
						className="transition-all hover:scale-105"
					>
						{isRegenerating ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* Help Text */}
				<div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
					💡 <strong>Tip:</strong> You can further customize this
					schedule after accepting it using the schedule customization
					tools.
				</div>
			</CardContent>
		</Card>
	);
}
