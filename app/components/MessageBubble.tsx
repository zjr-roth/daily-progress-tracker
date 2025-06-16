// app/components/MessageBubble.tsx
"use client";

import React from "react";
import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export interface Message {
	id: string;
	type: "user" | "ai" | "system";
	content: string;
	timestamp: Date;
	suggestions?: string[];
}

interface MessageBubbleProps {
	message: Message;
}

// Enhanced MessageBubble with additional features
interface EnhancedMessageBubbleProps extends MessageBubbleProps {
	isTyping?: boolean;
	showAvatar?: boolean;
	userName?: string;
	aiName?: string;
}

export function MessageBubble({
	message,
	isTyping = false,
	showAvatar = true,
	userName = "You",
	aiName = "AI Assistant",
}: EnhancedMessageBubbleProps) {
	const isUser = message.type === "user";
	const isSystem = message.type === "system";

	// System message with enhanced styling
	if (isSystem) {
		return (
			<div className="flex items-center justify-center my-4">
				<div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 px-6 py-3 rounded-full text-sm flex items-center gap-3 shadow-sm border border-blue-200 dark:border-blue-800">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="font-medium">{message.content}</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex gap-3 group animate-in fade-in slide-in-from-bottom-3 duration-500",
				isUser ? "justify-end" : "justify-start"
			)}
		>
			{/* AI Avatar with enhanced styling */}
			{!isUser && showAvatar && (
				<div className="flex flex-col items-center gap-1">
					<div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-in zoom-in duration-500 group-hover:scale-105 transition-transform">
						<Bot className="h-5 w-5 text-white" />
					</div>
					<span className="text-xs text-muted-foreground font-medium">
						{aiName}
					</span>
				</div>
			)}

			{/* Message Content with enhanced styling */}
			<div className="flex flex-col gap-1 max-w-[75%] md:max-w-[70%]">
				{/* Message Bubble */}
				<div
					className={cn(
						"p-4 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md relative",
						isUser
							? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
							: "bg-white dark:bg-gray-800 text-foreground rounded-bl-md border border-gray-200 dark:border-gray-700"
					)}
				>
					{/* Typing indicator */}
					{isTyping && !isUser && (
						<div className="flex items-center gap-1 mb-2">
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
							<span className="text-xs text-muted-foreground ml-2">
								{aiName} is typing...
							</span>
						</div>
					)}

					{/* Message Text */}
					<div className="space-y-2">
						<div className="prose prose-sm max-w-none">
							<p className="text-sm leading-relaxed whitespace-pre-wrap mb-0">
								{message.content}
							</p>
						</div>
					</div>

					{/* Message tail/pointer */}
					<div
						className={cn(
							"absolute top-4 w-0 h-0",
							isUser
								? "right-[-8px] border-l-[8px] border-l-blue-500 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
								: "left-[-8px] border-r-[8px] border-r-white dark:border-r-gray-800 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
						)}
					/>
				</div>

				{/* Timestamp and status */}
				<div
					className={cn(
						"flex items-center gap-2 px-2",
						isUser ? "justify-end" : "justify-start"
					)}
				>
					<span className="text-xs text-muted-foreground">
						{message.timestamp.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
					{isUser && (
						<div className="flex gap-1">
							<div
								className="w-3 h-3 rounded-full bg-green-500 opacity-60"
								title="Sent"
							/>
						</div>
					)}
				</div>
			</div>

			{/* User Avatar with enhanced styling */}
			{isUser && showAvatar && (
				<div className="flex flex-col items-center gap-1">
					<div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
						<User className="h-5 w-5 text-gray-700" />
					</div>
					<span className="text-xs text-muted-foreground font-medium">
						{userName}
					</span>
				</div>
			)}
		</div>
	);
}

// Typing indicator component
interface TypingIndicatorProps {
	aiName?: string;
	className?: string;
}

export function TypingIndicator({
	aiName = "AI Assistant",
	className,
}: TypingIndicatorProps) {
	return (
		<div className={cn("flex items-center gap-3", className)}>
			<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
				<Bot className="h-4 w-4 text-white" />
			</div>
			<div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2">
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
					<span className="text-xs text-muted-foreground">
						{aiName} is thinking...
					</span>
				</div>
			</div>
		</div>
	);
}
