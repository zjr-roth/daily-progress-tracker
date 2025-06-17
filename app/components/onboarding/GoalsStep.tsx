import { Goal } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import { Target, CheckCircle } from "lucide-react";

export const GoalsStep = ({
	goals,
	customGoals,
	onGoalsChange,
	onCustomGoalsChange,
	onNext,
	onPrevious,
}: {
	goals: Goal[];
	customGoals: string;
	onGoalsChange: (goals: Goal[]) => void;
	onCustomGoalsChange: (customGoals: string) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const predefinedGoals = [
		{ name: "Learn a new skill", category: "Personal Development" },
		{ name: "Exercise regularly", category: "Health & Fitness" },
		{ name: "Read more books", category: "Learning" },
		{ name: "Improve work productivity", category: "Career" },
		{ name: "Spend quality time with family", category: "Relationships" },
		{ name: "Practice meditation", category: "Mindfulness" },
		{ name: "Cook healthy meals", category: "Health & Fitness" },
		{ name: "Build a side project", category: "Career" },
		{ name: "Learn a new language", category: "Learning" },
		{ name: "Improve sleep quality", category: "Health & Fitness" },
		{ name: "Network professionally", category: "Career" },
		{ name: "Practice a hobby", category: "Personal Development" },
	];

	const toggleGoal = (goalName: string, category: string) => {
		const existingGoal = goals.find((g) => g.name === goalName);
		if (existingGoal) {
			onGoalsChange(goals.filter((g) => g.id !== existingGoal.id));
		} else {
			const newGoal: Goal = {
				id: Date.now().toString(),
				name: goalName,
				category,
				priority: goals.length + 1,
			};
			onGoalsChange([...goals, newGoal]);
		}
	};

	const isGoalSelected = (goalName: string) => {
		return goals.some((g) => g.name === goalName);
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<Target className="h-12 w-12 mx-auto text-primary mb-4" />
				<h2 className="text-2xl font-bold mb-2">
					Your Goals & Aspirations
				</h2>
				<p className="text-muted-foreground">
					What would you like to achieve? Select all that resonate
					with you.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{predefinedGoals.map((goal, index) => (
					<button
						key={index}
						onClick={() => toggleGoal(goal.name, goal.category)}
						className={`p-4 rounded-lg border-2 text-left transition-all ${
							isGoalSelected(goal.name)
								? "border-primary bg-primary/5 text-primary"
								: "border-border hover:border-primary/50 hover:bg-secondary/50"
						}`}
					>
						<div className="flex items-center gap-3">
							{isGoalSelected(goal.name) ? (
								<CheckCircle className="h-5 w-5 text-primary" />
							) : (
								<div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
							)}
							<div>
								<div className="font-medium">{goal.name}</div>
								<div className="text-xs text-muted-foreground">
									{goal.category}
								</div>
							</div>
						</div>
					</button>
				))}
			</div>

			<div className="bg-secondary/30 rounded-lg p-6">
				<h3 className="font-semibold mb-3">Custom Goals</h3>
				<p className="text-sm text-muted-foreground mb-3">
					Tell us about any other goals or priorities that matter to
					you:
				</p>
				<textarea
					value={customGoals}
					onChange={(e) => onCustomGoalsChange(e.target.value)}
					placeholder="e.g., Write a book, start a business, travel more, volunteer..."
					rows={3}
					className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
				/>
			</div>

			{goals.length > 0 && (
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
						Selected Goals ({goals.length}):
					</h4>
					<div className="flex flex-wrap gap-2">
						{goals.map((goal) => (
							<span
								key={goal.id}
								className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
							>
								{goal.name}
							</span>
						))}
					</div>
				</div>
			)}

			<StepNavigation
				onPrevious={onPrevious}
				onNext={onNext}
				canGoNext={goals.length > 0 || customGoals.trim().length > 0}
				isLastStep={false}
				isLoading={false}
				showSkip={goals.length === 0 && !customGoals.trim()}
				onSkip={onNext}
			/>
		</div>
	);
};
