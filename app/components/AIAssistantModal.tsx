// app/components/AIAssistantModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
	X,
	Send,
	Bot,
	User,
	Loader2,
	Sparkles,
	Calendar,
	Clock,
	CheckCircle,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import { Task, Schedule, TimeSlot } from "../lib/types";
import { cn } from "../lib/utils";

interface Message {
	id: string;
	type: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	schedulePreview?: Schedule;
	isThinking?: boolean;
}

interface AIAssistantModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentTasks: Task[];
	onApplyChanges: (newSchedule: Schedule) => Promise<void>;
	userName?: string;
}

export function AIAssistantModal({
	isOpen,
	onClose,
	currentTasks,
	onApplyChanges,
	userName = "there",
}: AIAssistantModalProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [currentPreview, setCurrentPreview] = useState<Schedule | null>(null);
	const [isApplying, setIsApplying] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Initialize with welcome message
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			const welcomeMessage: Message = {
				id: Date.now().toString(),
				type: "assistant",
				content: `Hi ${userName}! 👋 I'm your AI scheduling assistant. I can help you modify your current schedule. I can:\n\n• Adjust timing of existing tasks\n• Add new commitments or goals\n• Reorganize your daily routine\n• Optimize your schedule for better productivity\n\nWhat would you like to change about your schedule today?`,
				timestamp: new Date(),
			};
			setMessages([welcomeMessage]);
		}
	}, [isOpen, userName, messages.length]);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const generateScheduleModification = async (
		userRequest: string
	): Promise<Schedule | null> => {
		try {
			// Convert current tasks to a schedule format for context
			const currentSchedule: Schedule = {
				timeSlots: currentTasks.map((task) => ({
					id: task.id,
					time: task.time.split("-")[0].trim(), // Extract start time
					activity: task.name,
					description: `Current task: ${task.name}`,
					category: task.category,
					duration: task.duration,
					isCommitment: task.category === "Commitment",
				})),
				summary: `Current schedule with ${currentTasks.length} tasks`,
				optimizationReasoning: "User requested modifications",
				confidence: 0.9,
			};

			const response = await fetch("/api/onboarding/generate-schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					adjustmentRequest: userRequest,
					previousSchedule: currentSchedule,
					// Include basic preferences (you might want to fetch these from user preferences)
					goals: [],
					customGoals: userRequest,
					sleepSchedule: {
						wakeUpTime: "07:00",
						bedTime: "23:00",
						sleepDuration: 8,
					},
					workPreferences: {
						workType: "mixed",
						peakHours: ["morning"],
						breakPreference: "medium",
						focusBlocks: 2,
					},
					mealTimes: {
						breakfast: "08:00",
						lunch: "12:30",
						dinner: "18:30",
					},
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate schedule modification");
			}

			const newSchedule: Schedule = await response.json();
			return newSchedule;
		} catch (error) {
			console.error("Error generating schedule modification:", error);
			return null;
		}
	};

	const handleSendMessage = async () => {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			type: "user",
			content: inputMessage.trim(),
			timestamp: new Date(),
		};

		const thinkingMessage: Message = {
			id: (Date.now() + 1).toString(),
			type: "assistant",
			content: "Let me work on that for you...",
			timestamp: new Date(),
			isThinking: true,
		};

		setMessages((prev) => [...prev, userMessage, thinkingMessage]);
		setInputMessage("");
		setIsLoading(true);

		try {
			// Generate new schedule based on user request
			const newSchedule = await generateScheduleModification(
				userMessage.content
			);

			// Remove thinking message
			setMessages((prev) =>
				prev.filter((m) => m.id !== thinkingMessage.id)
			);

			if (newSchedule) {
				const assistantMessage: Message = {
					id: (Date.now() + 2).toString(),
					type: "assistant",
					content: `I've created a modified schedule based on your request! Here's what I've done:\n\n${newSchedule.summary}\n\n**Optimization:** ${newSchedule.optimizationReasoning}\n\nWould you like to preview the changes or apply them to your schedule?`,
					timestamp: new Date(),
					schedulePreview: newSchedule,
				};

				setMessages((prev) => [...prev, assistantMessage]);
				setCurrentPreview(newSchedule);
			} else {
				const errorMessage: Message = {
					id: (Date.now() + 2).toString(),
					type: "assistant",
					content:
						"I apologize, but I had trouble generating a modified schedule based on your request. Could you try rephrasing your request or being more specific about what you'd like to change?",
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, errorMessage]);
			}
		} catch (error) {
			// Remove thinking message
			setMessages((prev) =>
				prev.filter((m) => m.id !== thinkingMessage.id)
			);

			const errorMessage: Message = {
				id: (Date.now() + 2).toString(),
				type: "assistant",
				content:
					"I encountered an error while processing your request. Please try again or contact support if the issue persists.",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleApplySchedule = async (schedule: Schedule) => {
		setIsApplying(true);
		try {
			await onApplyChanges(schedule);

			const successMessage: Message = {
				id: Date.now().toString(),
				type: "system",
				content:
					"✅ Schedule updated successfully! Your changes have been applied.",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, successMessage]);
			setCurrentPreview(null);

			// Close modal after a short delay
			setTimeout(() => {
				onClose();
			}, 2000);
		} catch (error) {
			const errorMessage: Message = {
				id: Date.now().toString(),
				type: "system",
				content:
					"❌ Failed to apply schedule changes. Please try again.",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsApplying(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			Work: "bg-blue-100 text-blue-800 border-blue-200",
			Goals: "bg-green-100 text-green-800 border-green-200",
			"Personal Care": "bg-purple-100 text-purple-800 border-purple-200",
			Meals: "bg-orange-100 text-orange-800 border-orange-200",
			Commitment: "bg-red-100 text-red-800 border-red-200",
			Break: "bg-gray-100 text-gray-800 border-gray-200",
		};
		return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
				<CardHeader className="border-b flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
								<Bot className="h-6 w-6 text-white" />
							</div>
							<div>
								<CardTitle className="text-xl">
									AI Schedule Assistant
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									Modify your schedule with natural language
								</p>
							</div>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>

				<CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-6 space-y-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={cn(
									"flex gap-3",
									message.type === "user"
										? "justify-end"
										: "justify-start"
								)}
							>
								{message.type !== "user" && (
									<div
										className={cn(
											"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
											message.type === "assistant"
												? "bg-blue-500 text-white"
												: "bg-green-500 text-white"
										)}
									>
										{message.type === "assistant" ? (
											<Bot className="h-4 w-4" />
										) : (
											<CheckCircle className="h-4 w-4" />
										)}
									</div>
								)}

								<div
									className={cn(
										"max-w-[70%] rounded-lg p-3",
										message.type === "user"
											? "bg-blue-500 text-white"
											: message.type === "system"
											? "bg-green-100 text-green-800 border border-green-200"
											: "bg-gray-100 text-gray-900"
									)}
								>
									<div className="whitespace-pre-wrap text-sm">
										{message.isThinking ? (
											<div className="flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" />
												{message.content}
											</div>
										) : (
											message.content
										)}
									</div>

									{message.schedulePreview && (
										<div className="mt-4 space-y-3">
											<div className="bg-white rounded-lg border p-3">
												<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													Schedule Preview
												</h4>
												<div className="space-y-2 max-h-60 overflow-y-auto">
													{message.schedulePreview.timeSlots.map(
														(slot) => (
															<div
																key={slot.id}
																className="flex items-center gap-3 p-2 border rounded text-xs"
															>
																<div className="font-mono w-16 text-muted-foreground">
																	{formatTime(
																		slot.time
																	)}
																</div>
																<div className="flex-1">
																	<div className="font-medium">
																		{
																			slot.activity
																		}
																	</div>
																</div>
																<span
																	className={cn(
																		"px-2 py-1 rounded-full text-xs border",
																		getCategoryColor(
																			slot.category
																		)
																	)}
																>
																	{
																		slot.category
																	}
																</span>
																<div className="text-muted-foreground">
																	{
																		slot.duration
																	}
																	m
																</div>
															</div>
														)
													)}
												</div>
											</div>

											<div className="flex gap-2">
												<Button
													size="sm"
													onClick={() =>
														handleApplySchedule(
															message.schedulePreview!
														)
													}
													disabled={isApplying}
													className="flex-1"
												>
													{isApplying ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<CheckCircle className="h-4 w-4 mr-2" />
													)}
													Apply Changes
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														setCurrentPreview(null)
													}
												>
													Dismiss
												</Button>
											</div>
										</div>
									)}
								</div>

								{message.type === "user" && (
									<div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
										<User className="h-4 w-4" />
									</div>
								)}
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>

					{/* Input */}
					<div className="border-t p-4 flex-shrink-0">
						<div className="flex gap-2">
							<Input
								ref={inputRef}
								value={inputMessage}
								onChange={(e) =>
									setInputMessage(e.target.value)
								}
								onKeyPress={handleKeyPress}
								placeholder="Tell me what you'd like to change about your schedule..."
								disabled={isLoading}
								className="flex-1"
							/>
							<Button
								onClick={handleSendMessage}
								disabled={!inputMessage.trim() || isLoading}
								size="sm"
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
							</Button>
						</div>

						{/* Quick suggestions */}
						<div className="mt-2 flex flex-wrap gap-2">
							{[
								"Move my workout to the morning",
								"Add a 30-minute lunch break",
								"Schedule time for reading",
								"Adjust dinner time to 7 PM",
							].map((suggestion, index) => (
								<button
									key={index}
									onClick={() => setInputMessage(suggestion)}
									className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
									disabled={isLoading}
								>
									{suggestion}
								</button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
