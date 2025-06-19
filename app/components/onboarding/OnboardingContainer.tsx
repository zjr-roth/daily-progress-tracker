// app/components/onboarding/OnboardingContainer.tsx - Updated with adjustment support
import { UserPreferences, Schedule } from "@/app/lib/types";
import { useCallback, useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { WelcomeStep } from "./WelcomeStep";
import { CommitmentsStep } from "./CommitmentsStep";
import { GoalsStep } from "./GoalsStep";
import { SleepPreferencesStep } from "./SleepPreferencesStep";
import { WorkPreferencesStep } from "./WorkPreferencesStep";
import { ProcessingStep } from "./ProcessingStep";
import { ScheduleReviewStep } from "./ScheduleReviewStep";

interface OnboardingContainerProps {
	onScheduleGenerated: (schedule: Schedule) => void;
}

const OnboardingContainer = ({
	onScheduleGenerated,
}: OnboardingContainerProps) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [userData, setUserData] = useState<UserPreferences>({
		commitments: [], // Keep this for backward compatibility
		naturalLanguageCommitments: "", // Add this new field
		goals: [],
		customGoals: "",
		sleepSchedule: {
			wakeUpTime: "",
			bedTime: "",
			sleepDuration: 8,
		},
		workPreferences: {
			workType: "",
			peakHours: [],
			breakPreference: "",
			focusBlocks: 2,
		},
		mealTimes: {
			breakfast: "",
			lunch: "",
			dinner: "",
		},
	});
	const [generatedSchedule, setGeneratedSchedule] = useState<Schedule | null>(
		null
	);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);

	const steps = [
		"Welcome",
		"Commitments",
		"Goals",
		"Sleep",
		"Work Style",
		"Processing",
		"Review",
	];

	const updateUserData = useCallback((update: Partial<UserPreferences>) => {
		setUserData((prev) => ({ ...prev, ...update }));
	}, []);

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const generateScheduleWithAPI = async (
		adjustments?: string
	): Promise<Schedule> => {
		try {
			console.log("Sending user data to API:", userData);

			// Create the API payload with optional adjustments
			const apiPayload = {
				...userData,
				...(adjustments &&
					generatedSchedule && {
						adjustmentRequest: adjustments,
						previousSchedule: generatedSchedule,
					}),
			};

			const response = await fetch("/api/onboarding/generate-schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(apiPayload),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error ||
						`HTTP ${response.status}: Failed to generate schedule`
				);
			}

			const schedule: Schedule = await response.json();

			if (!schedule || !schedule.timeSlots) {
				throw new Error("No schedule data received from API");
			}

			return schedule;
		} catch (error: any) {
			console.error("Error calling schedule generation API:", error);
			throw new Error(
				error.message ||
					"Failed to generate schedule. Please try again."
			);
		}
	};

	const handleScheduleGenerated = async () => {
		setIsGenerating(true);
		setGenerationError(null);

		try {
			const schedule = await generateScheduleWithAPI();
			setGeneratedSchedule(schedule);
			// Automatically advance to review step
			setTimeout(() => {
				nextStep();
				setIsGenerating(false);
			}, 2000);
		} catch (error: any) {
			console.error("Schedule generation failed:", error);
			setGenerationError(error.message);
			setIsGenerating(false);
		}
	};

	const handleAcceptSchedule = () => {
		if (generatedSchedule) {
			onScheduleGenerated(generatedSchedule);
		}
	};

	// Updated to handle adjustments
	const handleRegenerateSchedule = async (adjustments?: string) => {
		setIsGenerating(true);
		setGenerationError(null);

		try {
			const schedule = await generateScheduleWithAPI(adjustments);
			setGeneratedSchedule(schedule);
			setIsGenerating(false);
		} catch (error: any) {
			console.error("Schedule regeneration failed:", error);
			setGenerationError(error.message);
			setIsGenerating(false);
		}
	};

	const handleRetryGeneration = () => {
		setGenerationError(null);
		handleScheduleGenerated();
	};

	const renderStep = () => {
		switch (currentStep) {
			case 0:
				return <WelcomeStep onNext={nextStep} />;
			case 1:
				return (
					<CommitmentsStep
						naturalLanguageCommitments={
							userData.naturalLanguageCommitments || ""
						}
						onCommitmentsChange={(commitments) =>
							updateUserData({
								naturalLanguageCommitments: commitments,
							})
						}
						onNext={nextStep}
						onPrevious={prevStep}
					/>
				);
			case 2:
				return (
					<GoalsStep
						goals={userData.goals}
						customGoals={userData.customGoals}
						onGoalsChange={(goals) => updateUserData({ goals })}
						onCustomGoalsChange={(customGoals) =>
							updateUserData({ customGoals })
						}
						onNext={nextStep}
						onPrevious={prevStep}
					/>
				);
			case 3:
				return (
					<SleepPreferencesStep
						sleepSchedule={userData.sleepSchedule}
						onSleepScheduleChange={(sleepSchedule) =>
							updateUserData({ sleepSchedule })
						}
						onNext={nextStep}
						onPrevious={prevStep}
					/>
				);
			case 4:
				return (
					<WorkPreferencesStep
						workPreferences={userData.workPreferences}
						onWorkPreferencesChange={(workPreferences) =>
							updateUserData({ workPreferences })
						}
						onNext={nextStep}
						onPrevious={prevStep}
					/>
				);
			case 5:
				return (
					<ProcessingStep
						userData={userData}
						onScheduleGenerated={handleScheduleGenerated}
						onNext={nextStep}
						onPrevious={prevStep}
					/>
				);
			case 6:
				return generatedSchedule ? (
					<ScheduleReviewStep
						schedule={generatedSchedule}
						onAccept={handleAcceptSchedule}
						onRegenerate={handleRegenerateSchedule}
						onPrevious={prevStep}
					/>
				) : (
					<div className="text-center py-16">
						<div className="flex flex-col items-center space-y-6">
							{/* Show error state if there was an error */}
							{generationError ? (
								<div className="text-red-600 dark:text-red-400">
									<p className="mb-4">{generationError}</p>
									<button
										onClick={handleRetryGeneration}
										className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
									>
										Try Again
									</button>
								</div>
							) : (
								<>
									{/* Animated Donut Loader */}
									<div className="relative">
										<div className="w-16 h-16 border-4 border-muted rounded-full"></div>
										<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
									</div>
									<div className="text-sm text-muted-foreground/70">
										{isGenerating
											? "Applying adjustments..."
											: "Generating your personalized schedule"}
									</div>
								</>
							)}
						</div>
					</div>
				);
			default:
				return <div>Unknown step</div>;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				{currentStep > 0 && currentStep < 5 && (
					<ProgressBar
						currentStep={currentStep}
						totalSteps={steps.length - 2}
					/>
				)}

				<div className="min-h-[600px]">{renderStep()}</div>
			</div>
		</div>
	);
};

export default OnboardingContainer;
