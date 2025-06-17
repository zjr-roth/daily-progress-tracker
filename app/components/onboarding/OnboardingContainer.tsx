// app/components/onboarding/OnboardingContainer.tsx - Updated with API integration
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
		commitments: [],
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

	const generateScheduleWithAPI = async (): Promise<Schedule> => {
		try {
			console.log("Sending user data to API:", userData);

			// FIX #1: Send the userData object directly, not nested.
			const response = await fetch("/api/onboarding/generate-schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData), // Changed from { userData }
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error ||
						`HTTP ${response.status}: Failed to generate schedule`
				);
			}

			const schedule: Schedule = await response.json();

			// FIX #2: Check the received data directly, not a .schedule property.
			if (!schedule || !schedule.timeSlots) {
				throw new Error("No schedule data received from API");
			}

			// FIX #3: Return the schedule object itself.
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

	const handleRegenerateSchedule = () => {
		setCurrentStep(5); // Go back to processing step
		setGeneratedSchedule(null);
		setGenerationError(null);
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
						commitments={userData.commitments}
						onCommitmentsChange={(commitments) =>
							updateUserData({ commitments })
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
					<div className="text-center py-8">
						<div className="text-lg text-muted-foreground">
							Loading schedule review...
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
