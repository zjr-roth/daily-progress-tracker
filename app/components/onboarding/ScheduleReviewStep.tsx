import { Schedule } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import {
	Star,
	CheckCircle,
	ArrowLeft,
	Check,
	RefreshCw,
	Wand2,
} from "lucide-react";
import { useState } from "react";

export const ScheduleReviewStep = ({
	schedule,
	onAccept,
	onRegenerate,
	onPrevious,
}: {
	schedule: Schedule;
	onAccept: () => void;
	onRegenerate: (adjustments?: string) => void; // Updated to accept optional adjustments
	onPrevious: () => void;
}) => {
	const [feedback, setFeedback] = useState("");
	const [isRegenerating, setIsRegenerating] = useState(false);

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			Work: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
			Commitment:
				"bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
			Goals: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
			"Personal Care":
				"bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
			Meals: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
		};
		return (
			colors[category] ||
			"bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
		);
	};

	const handleRegenerate = async () => {
		setIsRegenerating(true);
		try {
			await onRegenerate(); // No adjustments - complete regeneration
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleApplyAdjustments = async () => {
		if (!feedback.trim()) return;

		setIsRegenerating(true);
		try {
			await onRegenerate(feedback.trim()); // Pass adjustments to regenerate function
			setFeedback(""); // Clear feedback after applying
		} finally {
			setIsRegenerating(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
					<Star className="h-8 w-8 text-white" />
				</div>
				<h2 className="text-2xl font-bold mb-2">
					Your Personalized Schedule
				</h2>
				<p className="text-muted-foreground">
					Here's your AI-optimized daily routine. You can accept it or
					request changes.
				</p>
			</div>

			{/* Schedule confidence and summary */}
			<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
				<div className="flex items-center gap-2 mb-2">
					<CheckCircle className="h-5 w-5 text-green-600" />
					<span className="font-medium text-green-800 dark:text-green-200">
						{Math.round(schedule.confidence * 100)}% Optimized
					</span>
				</div>
				<p className="text-sm text-green-700 dark:text-green-300">
					{schedule.summary}
				</p>
			</div>

			{/* Time slots */}
			<div className="space-y-3">
				<h3 className="font-semibold">Your Daily Schedule:</h3>
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{schedule.timeSlots.map((slot) => (
						<div
							key={slot.id}
							className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
						>
							<div className="text-sm font-mono w-20 text-muted-foreground">
								{formatTime(slot.time)}
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium">
										{slot.activity}
									</span>
									<span
										className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(
											slot.category
										)}`}
									>
										{slot.category}
									</span>
									{slot.isCommitment && (
										<span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full">
											Fixed
										</span>
									)}
								</div>
								<div className="text-sm text-muted-foreground">
									{slot.description} • {slot.duration} minutes
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Optimization reasoning */}
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
				<h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
					Why this schedule works for you:
				</h4>
				<p className="text-sm text-blue-700 dark:text-blue-300">
					{schedule.optimizationReasoning}
				</p>
			</div>

			{/* Feedback section */}
			<div className="bg-secondary/30 rounded-lg p-4">
				<h4 className="font-medium mb-3 flex items-center gap-2">
					<Wand2 className="h-4 w-4" />
					Request Adjustments
				</h4>
				<textarea
					value={feedback}
					onChange={(e) => setFeedback(e.target.value)}
					placeholder="Tell us what you'd like to change... (e.g., 'Change dinner from 8:45PM to 8:00PM', 'Move exercise to evening', 'Add more break time')"
					rows={3}
					className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
					disabled={isRegenerating}
				/>
				{feedback.trim() && (
					<button
						onClick={handleApplyAdjustments}
						disabled={isRegenerating}
						className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					>
						{isRegenerating ? (
							<RefreshCw className="h-4 w-4 animate-spin" />
						) : (
							<Wand2 className="h-4 w-4" />
						)}
						{isRegenerating
							? "Applying Changes..."
							: "Apply Adjustments"}
					</button>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex justify-between items-center">
				<button
					onClick={onPrevious}
					disabled={isRegenerating}
					className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to edit preferences
				</button>

				<div className="flex gap-3">
					<button
						onClick={handleRegenerate}
						disabled={isRegenerating}
						className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isRegenerating ? (
							<RefreshCw className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
						{isRegenerating ? "Regenerating..." : "Regenerate"}
					</button>

					<button
						onClick={onAccept}
						disabled={isRegenerating}
						className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Check className="h-4 w-4" />
						Accept Schedule
					</button>
				</div>
			</div>
		</div>
	);
};
