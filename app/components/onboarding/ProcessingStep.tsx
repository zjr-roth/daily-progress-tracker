import { UserPreferences, Schedule } from "@/app/lib/types";
import { Brain, Calendar, CheckCircle, Clock, Target, Zap } from "lucide-react";
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
	const [currentStep, setCurrentStep] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	const processingSteps = [
		"Analyzing your commitments and preferences...",
		"Identifying optimal time blocks...",
		"Balancing work and personal goals...",
		"Optimizing for your peak energy hours...",
		"Generating your personalized schedule...",
		"Adding finishing touches...",
	];

	// Mock AI schedule generation
	const generateSchedule = useCallback(async () => {
		setIsGenerating(true);

		for (let i = 0; i < processingSteps.length; i++) {
			setCurrentStep(processingSteps[i]);
			setProgress(((i + 1) / processingSteps.length) * 100);
			await new Promise((resolve) => setTimeout(resolve, 1500));
		}

		// Generate mock schedule based on user preferences
		const mockSchedule: Schedule = {
			timeSlots: [
				{
					id: "1",
					time: userData.sleepSchedule.wakeUpTime || "7:00",
					activity: "Morning Routine",
					description: "Wake up, hydration, light stretching",
					category: "Personal Care",
					duration: 30,
					isCommitment: false,
				},
				{
					id: "2",
					time: "7:30",
					activity: "Breakfast",
					description: "Healthy breakfast to fuel your day",
					category: "Meals",
					duration: 30,
					isCommitment: false,
				},
				{
					id: "3",
					time: "8:00",
					activity: "Deep Focus Block 1",
					description:
						"Your most important work when energy is highest",
					category: "Work",
					duration: 120,
					isCommitment: false,
				},
				...userData.commitments.map((commitment, index) => ({
					id: `commitment-${index}`,
					time: commitment.preferredTime || "10:00",
					activity: commitment.taskName,
					description: `Fixed commitment - ${commitment.duration} minutes`,
					category: "Commitment",
					duration: commitment.duration,
					isCommitment: true,
					commitmentId: commitment.id,
				})),
				{
					id: "4",
					time: "12:00",
					activity: "Lunch Break",
					description: "Nutritious meal and mental break",
					category: "Meals",
					duration: 60,
					isCommitment: false,
				},
				{
					id: "5",
					time: "13:00",
					activity: userData.goals[0]?.name || "Goal Work",
					description: `Dedicated time for: ${
						userData.goals[0]?.name || "personal development"
					}`,
					category: "Goals",
					duration: 60,
					isCommitment: false,
				},
			],
			summary: `Optimized schedule balancing ${userData.commitments.length} commitments with ${userData.goals.length} personal goals. Peak productivity hours aligned with your ${userData.workPreferences.workType} work style.`,
			optimizationReasoning: `Based on your preference for ${userData.workPreferences.peakHours.join(
				" and "
			)} productivity, I've scheduled your most important work during these times. Your ${
				userData.commitments.length
			} fixed commitments are preserved, while
			deep focus blocks are strategically placed for maximum effectiveness.`,
			confidence: 0.87,
		};

		onScheduleGenerated(mockSchedule);
		setIsGenerating(false);

		// Auto-advance after showing completion
		setTimeout(() => {
			onNext();
		}, 2000);
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

			{progress < 100 && (
				<div className="text-center">
					<button
						onClick={onPrevious}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						← Go back to make changes
					</button>
				</div>
			)}

			{progress === 100 && (
				<div className="text-center space-y-3">
					<div className="flex items-center justify-center gap-2 text-green-600">
						<CheckCircle className="h-5 w-5" />
						<span className="font-medium">
							Schedule generated successfully!
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						Taking you to review your personalized schedule...
					</p>
				</div>
			)}
		</div>
	);
};
