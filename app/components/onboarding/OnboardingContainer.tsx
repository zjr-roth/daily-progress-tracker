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

const OnboardingContainer = () => {
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

	const handleScheduleGenerated = (schedule: Schedule) => {
		setGeneratedSchedule(schedule);
	};

	const handleAcceptSchedule = () => {
		// In a real app, this would save to database and redirect
		alert(
			"Schedule accepted! Welcome to Atomic - your personalized daily planner awaits!"
		);
	};

	const handleRegenerateSchedule = () => {
		setCurrentStep(5); // Go back to processing step
		setGeneratedSchedule(null);
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
					<div>Loading schedule...</div>
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
