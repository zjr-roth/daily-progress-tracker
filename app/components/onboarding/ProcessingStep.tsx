import { UserPreferences, Schedule } from "@/app/lib/types";
import {
	Brain,
	Calendar,
	CheckCircle,
	Clock,
	Target,
	Zap,
	AlertCircle,
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
		{ text: "Analyzing your preferences...", duration: 1000 },
		{ text: "Connecting to Atomic AI assistant...", duration: 1500 },
		{ text: "Generating your personalized schedule...", duration: 3000 },
		{ text: "Adding finishing touches...", duration: 1000 },
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

	return (
		<div className="space-y-8">
			<div className="text-center">
				<div className="relative">
					<Brain className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
					{progress === 100 && (
						<div className="absolute -top-2 -right-2">
							<CheckCircle className="h-6 w-6 text-green-500" />
						</div>
					)}
				</div>
				<h2 className="text-2xl font-bold mb-2">
					Creating Your Personalized Schedule
				</h2>
				<p className="text-muted-foreground">
					Our AI is analyzing your preferences to create the perfect
					daily routine
				</p>
			</div>

			<div className="max-w-md mx-auto">
				<div className="w-full bg-secondary rounded-full h-3 mb-4">
					<div
						className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<div className="text-center">
					<div className="text-lg font-medium mb-2">
						{Math.round(progress)}% Complete
					</div>
					<div className="text-sm text-muted-foreground">
						{currentStep}
					</div>
				</div>
			</div>

			{error && (
				<div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
						<div>
							<h3 className="font-medium text-destructive mb-1">
								Generation Failed
							</h3>
							<p className="text-sm text-red-800 dark:text-red-200 mb-4">
								{error}
							</p>
							<button
								onClick={generateSchedule}
								className="px-4 py-2 border border-border rounded-md hover:bg-secondary text-sm"
							>
								Retry Generation
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="bg-secondary/30 rounded-lg p-6 space-y-4">
				<h3 className="font-semibold">What we're considering:</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-primary" />
						<span>
							{userData.commitments.length} fixed commitments
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Target className="h-4 w-4 text-primary" />
						<span>{userData.goals.length} personal goals</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-primary" />
						<span>
							Sleep: {userData.sleepSchedule.wakeUpTime} -{" "}
							{userData.sleepSchedule.bedTime}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Zap className="h-4 w-4 text-primary" />
						<span>
							{userData.workPreferences.peakHours.length} peak
							hours
						</span>
					</div>
				</div>
			</div>

			{progress < 100 && !error && (
				<div className="text-center">
					<button
						onClick={onPrevious}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						← Go back to make changes
					</button>
				</div>
			)}
		</div>
	);
};
