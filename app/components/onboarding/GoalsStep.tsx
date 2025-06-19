import { Goal } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import {
	Target,
	CheckCircle,
	MessageCircle,
	Lightbulb,
	X,
	Plus,
} from "lucide-react";
import { useState } from "react";

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
	const [showPredefined, setShowPredefined] = useState(false);

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

	const groupedGoals = predefinedGoals.reduce((acc, goal) => {
		if (!acc[goal.category]) {
			acc[goal.category] = [];
		}
		acc[goal.category].push(goal);
		return acc;
	}, {} as Record<string, typeof predefinedGoals>);

	const exampleGoals = [
		"Write a book about my experiences",
		"Start a small business",
		"Travel to Japan",
		"Learn photography",
		"Volunteer at local shelter",
	];

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#E05C04] to-[#841436] rounded-2xl flex items-center justify-center shadow-lg">
					<Target className="h-8 w-8 text-white" />
				</div>
				<div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Your Goals & Aspirations
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						What would you like to achieve? Share your dreams and
						ambitions.
					</p>
				</div>
			</div>

			{/* Natural Language Goals Input - Front and Center */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-start gap-4 mb-6">
					<div className="w-10 h-10 bg-gradient-to-r from-[#E05C04] to-[#841436] rounded-full flex items-center justify-center flex-shrink-0">
						<MessageCircle className="h-5 w-5 text-white" />
					</div>
					<div className="flex-1">
						<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
							Tell me about your goals
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							Share what you want to achieve - be as specific or
							general as you'd like!
						</p>
					</div>
				</div>

				<textarea
					value={customGoals}
					onChange={(e) => onCustomGoalsChange(e.target.value)}
					placeholder="e.g., I want to learn Spanish, get better at cooking, read 12 books this year, start exercising regularly, spend more time with family..."
					rows={4}
					className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#E05C04]/20 focus:border-[#E05C04] dark:bg-gray-700 dark:text-white resize-none transition-all duration-200"
				/>

				{/* Examples */}
				<div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
					<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						💡 Example goals:
					</p>
					<div className="flex flex-wrap gap-2">
						{exampleGoals.map((example, index) => (
							<button
								key={index}
								onClick={() => {
									const newGoals = customGoals
										? `${customGoals}, ${example}`
										: example;
									onCustomGoalsChange(newGoals);
								}}
								className="px-3 py-1 text-sm bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-[#C13729] dark:hover:text-[#FF7308] border border-gray-200 dark:border-gray-500 rounded-lg hover:border-[#FF7308] dark:hover:border-[#FF7308] transition-colors duration-200"
							>
								{example}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Predefined Goals Section */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<Lightbulb className="h-6 w-6 text-[#FF7308]" />
						<div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
								Need inspiration?
							</h3>
							<p className="text-gray-600 dark:text-gray-400">
								Browse our curated list of popular goals to get
								started quickly
							</p>
						</div>
					</div>
					<button
						onClick={() => setShowPredefined(!showPredefined)}
						className="flex items-center gap-2 px-4 py-2 text-[#C13729] dark:text-[#FF7308] hover:bg-[#FF7308]/10 dark:hover:bg-[#FF7308]/20 rounded-xl transition-colors duration-200"
					>
						{showPredefined ? (
							<>
								<X className="h-4 w-4" />
								Hide goals
							</>
						) : (
							<>
								<Plus className="h-4 w-4" />
								Browse goals
							</>
						)}
					</button>
				</div>

				{showPredefined && (
					<div className="space-y-6 animate-in slide-in-from-top-5 duration-300">
						{Object.entries(groupedGoals).map(
							([category, categoryGoals]) => (
								<div key={category} className="space-y-3">
									<h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-l-4 border-[#FF7308] pl-3">
										{category}
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{categoryGoals.map((goal, index) => (
											<button
												key={index}
												onClick={() =>
													toggleGoal(
														goal.name,
														goal.category
													)
												}
												className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
													isGoalSelected(goal.name)
														? "border-[#C13729] bg-[#FF7308]/10 dark:bg-[#C13729]/20 shadow-md"
														: "border-gray-200 dark:border-gray-600 hover:border-[#FF7308] dark:hover:border-[#FF7308] hover:bg-gray-50 dark:hover:bg-gray-700/50"
												}`}
											>
												<div className="flex items-center gap-3">
													{isGoalSelected(
														goal.name
													) ? (
														<CheckCircle className="h-5 w-5 text-[#C13729]" />
													) : (
														<div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-500" />
													)}
													<div>
														<div
															className={`font-medium ${
																isGoalSelected(
																	goal.name
																)
																	? "text-[#C13729] dark:text-[#FF7308]"
																	: "text-gray-900 dark:text-white"
															}`}
														>
															{goal.name}
														</div>
													</div>
												</div>
											</button>
										))}
									</div>
								</div>
							)
						)}
					</div>
				)}
			</div>

			{/* Selected Goals Summary */}
			{goals.length > 0 && (
				<div className="bg-gradient-to-r from-[#FF7308]/10 to-[#C13729]/10 dark:from-[#FF7308]/20 dark:to-[#C13729]/20 border border-[#FF7308]/30 dark:border-[#C13729]/30 rounded-2xl p-6">
					<h4 className="text-lg font-semibold text-[#C13729] dark:text-[#FF7308] mb-4 flex items-center gap-2">
						<Target className="h-5 w-5" />
						Selected Goals ({goals.length})
					</h4>
					<div className="flex flex-wrap gap-2">
						{goals.map((goal) => (
							<span
								key={goal.id}
								className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF7308]/10 dark:bg-[#C13729]/20 text-[#C13729] dark:text-[#FF7308] text-sm rounded-full"
							>
								{goal.name}
								<button
									onClick={() =>
										onGoalsChange(
											goals.filter(
												(g) => g.id !== goal.id
											)
										)
									}
									className="hover:bg-[#C13729]/20 dark:hover:bg-[#FF7308]/20 rounded-full p-0.5 transition-colors duration-200"
								>
									<X className="h-3 w-3" />
								</button>
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
