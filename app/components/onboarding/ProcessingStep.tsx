import { UserPreferences, Schedule } from "@/app/lib/types";
import {
	Brain,
	Calendar,
	CheckCircle,
	Clock,
	Target,
	Zap,
	AlertCircle,
	Sparkles,
	Bot,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const ProcessingStep = ({
	userData,
	onScheduleGenerated,
	onNext,
	onPrevious,
}: {
	userData: UserPreferences;
	onScheduleGenerated: (schedule: Schedule) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState("Initializing...");
	const [error, setError] = useState<string | null>(null);

	const processingSteps = [
		{ text: "Analyzing your preferences...", duration: 1000, icon: "🔍" },
		{
			text: "Connecting to Atomic AI assistant...",
			duration: 1500,
			icon: "🤖",
		},
		{
			text: "Generating your personalized schedule...",
			duration: 3000,
			icon: "✨",
		},
		{ text: "Adding finishing touches...", duration: 1000, icon: "🎨" },
	];

	const generateSchedule = useCallback(async () => {
		setError(null);

		// Simulate initial steps before the actual API call
		for (let i = 0; i < processingSteps.length; i++) {
			setCurrentStep(processingSteps[i].text);
			setProgress(((i + 1) / (processingSteps.length + 1)) * 100);
			await new Promise((resolve) =>
				setTimeout(resolve, processingSteps[i].duration)
			);
		}

		try {
			// Actual API call to our new backend route
			const response = await fetch("/api/onboarding/generate-schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to generate schedule."
				);
			}

			const schedule: Schedule = await response.json();

			// Finalize UI
			setCurrentStep("Schedule generated successfully!");
			setProgress(100);
			onScheduleGenerated(schedule);

			// Auto-advance after showing completion
			setTimeout(() => {
				onNext();
			}, 2000);
		} catch (err: any) {
			console.error("Failed to generate schedule:", err);
			setError(
				err.message ||
					"An error occurred while creating your schedule. Please try again."
			);
			setProgress(0); // Reset progress on error
		}
	}, [userData, onScheduleGenerated, onNext]);

	useEffect(() => {
		generateSchedule();
	}, [generateSchedule]);

	const currentStepData = processingSteps.find(
		(step) => step.text === currentStep
	);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
			<div className="space-y-8 max-w-2xl mx-auto px-6 text-center">
				{/* Main Icon with Animation */}
				<div className="relative">
					<div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
						{progress === 100 ? (
							<CheckCircle className="h-12 w-12 text-white" />
						) : (
							<Brain className="h-12 w-12 text-white animate-pulse" />
						)}
					</div>
					{/* Animated glow */}
					<div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl opacity-20 blur-xl animate-pulse"></div>

					{/* Success sparkles */}
					{progress === 100 && (
						<div className="absolute -top-2 -right-2">
							<Sparkles className="h-8 w-8 text-yellow-500 animate-bounce" />
						</div>
					)}
				</div>

				{/* Header */}
				<div className="space-y-4">
					<h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
						{progress === 100
							? "Your Schedule is Ready!"
							: "Creating Your Personalized Schedule"}
					</h2>
					<p className="text-xl text-gray-600 dark:text-gray-300">
						{progress === 100
							? "Our AI has crafted the perfect daily routine just for you"
							: "Our AI is analyzing your preferences to create the perfect daily routine"}
					</p>
				</div>

				{/* Progress Bar */}
				<div className="max-w-md mx-auto space-y-6">
					<div className="relative">
						<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
							<div
								className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
								style={{ width: `${progress}%` }}
							>
								<div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
							</div>
						</div>
						<div className="absolute -top-8 left-0 right-0 text-center">
							<span className="inline-block bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-lg">
								{Math.round(progress)}% Complete
							</span>
						</div>
					</div>

					{/* Current Step */}
					<div className="flex items-center justify-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
						{currentStepData && (
							<span className="text-2xl animate-bounce">
								{currentStepData.icon}
							</span>
						)}
						<span className="text-lg font-medium text-gray-700 dark:text-gray-300">
							{currentStep}
						</span>
					</div>
				</div>

				{/* Error State */}
				{error && (
					<div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
						<div className="flex items-start gap-4">
							<AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
							<div className="text-left">
								<h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
									Generation Failed
								</h3>
								<p className="text-sm text-red-700 dark:text-red-300 mb-4">
									{error}
								</p>
								<button
									onClick={generateSchedule}
									className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
								>
									Try Again
								</button>
							</div>
						</div>
					</div>
				)}

				{/* What we're considering */}
				<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-8">
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center justify-center gap-2">
						<Bot className="h-5 w-5 text-blue-500" />
						What our AI is considering
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{[
							{
								icon: Calendar,
								label: `${userData.commitments.length} fixed commitments`,
								color: "text-blue-500",
							},
							{
								icon: Target,
								label: `${userData.goals.length} personal goals`,
								color: "text-green-500",
							},
							{
								icon: Clock,
								label: `Sleep: ${userData.sleepSchedule.wakeUpTime} - ${userData.sleepSchedule.bedTime}`,
								color: "text-purple-500",
							},
							{
								icon: Zap,
								label: `${userData.workPreferences.peakHours.length} peak productivity hours`,
								color: "text-yellow-500",
							},
						].map((item, index) => (
							<div
								key={index}
								className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl"
							>
								<item.icon
									className={`h-5 w-5 ${item.color}`}
								/>
								<span className="text-gray-700 dark:text-gray-300 font-medium">
									{item.label}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Back button for changes */}
				{progress < 100 && !error && (
					<button
						onClick={onPrevious}
						className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 flex items-center gap-2 mx-auto"
					>
						← Go back to make changes
					</button>
				)}
			</div>
		</div>
	);
};
