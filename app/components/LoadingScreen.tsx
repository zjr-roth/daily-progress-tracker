// app/components/LoadingScreen.tsx - Loading component for schedule generation
"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { Loader2, Sparkles, Brain, Clock, Target } from "lucide-react";

interface LoadingScreenProps {
	message?: string;
	submessage?: string;
}

export function LoadingScreen({
	message = "Generating your personalized schedule...",
	submessage = "This may take a few moments while our AI analyzes your preferences",
}: LoadingScreenProps) {
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-lg">
				<CardContent className="p-8 text-center">
					<div className="space-y-6">
						{/* Animated Logo/Icon */}
						<div className="relative">
							<div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
								<Sparkles className="h-10 w-10 text-white" />
							</div>
							<div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
						</div>

						{/* Main Loading Message */}
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{message}</h2>
							<p className="text-sm text-muted-foreground">
								{submessage}
							</p>
						</div>

						{/* Loading Animation */}
						<div className="flex items-center justify-center space-x-2">
							<Loader2 className="h-6 w-6 animate-spin text-blue-500" />
							<div className="flex space-x-1">
								<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
								<div
									className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
									style={{ animationDelay: "0.1s" }}
								></div>
								<div
									className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
									style={{ animationDelay: "0.2s" }}
								></div>
							</div>
						</div>

						{/* Processing Steps */}
						<div className="space-y-3 text-left">
							<div className="flex items-center space-x-3 text-sm">
								<Brain className="h-4 w-4 text-green-500" />
								<span>
									Analyzing your goals and preferences
								</span>
							</div>
							<div className="flex items-center space-x-3 text-sm">
								<Target className="h-4 w-4 text-blue-500" />
								<span>
									Researching optimal productivity practices
								</span>
							</div>
							<div className="flex items-center space-x-3 text-sm">
								<Clock className="h-4 w-4 text-purple-500" />
								<span>Optimizing your daily time blocks</span>
							</div>
						</div>

						{/* Progress Bar */}
						<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
								style={{ width: "75%" }}
							></div>
						</div>

						{/* Tip */}
						<div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
							💡 <strong>Tip:</strong> Your personalized schedule
							will be based on the latest productivity research
							and tailored to your specific goals and constraints.
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
