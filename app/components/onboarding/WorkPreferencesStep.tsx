import { WorkPreferences } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import { Briefcase, Brain, Coffee, Zap, Clock } from "lucide-react";

export const WorkPreferencesStep = ({
	workPreferences,
	onWorkPreferencesChange,
	onNext,
	onPrevious,
}: {
	workPreferences: WorkPreferences;
	onWorkPreferencesChange: (prefs: WorkPreferences) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const workTypes = [
		{
			value: "creative",
			label: "Creative Work",
			icon: "🎨",
			description: "Design, writing, brainstorming, artistic projects",
		},
		{
			value: "analytical",
			label: "Analytical/Technical",
			icon: "📊",
			description: "Data analysis, coding, research, problem-solving",
		},
		{
			value: "communication",
			label: "Communication/Meetings",
			icon: "💬",
			description: "Meetings, calls, presentations, collaboration",
		},
		{
			value: "mixed",
			label: "Mixed/Varied",
			icon: "🔄",
			description: "A combination of different types of work",
		},
	];

	const timeBlocks = [
		{
			value: "early-morning",
			label: "Early Morning",
			time: "6-9 AM",
			icon: "🌅",
			description: "Perfect for deep focus before the world wakes up",
		},
		{
			value: "morning",
			label: "Morning",
			time: "9 AM-12 PM",
			icon: "☀️",
			description: "High energy and focus for important tasks",
		},
		{
			value: "afternoon",
			label: "Afternoon",
			time: "12-4 PM",
			icon: "🏙️",
			description: "Good for meetings and collaborative work",
		},
		{
			value: "late-afternoon",
			label: "Late Afternoon",
			time: "4-6 PM",
			icon: "🌆",
			description: "Final push before evening wind-down",
		},
		{
			value: "evening",
			label: "Evening",
			time: "6-9 PM",
			icon: "🌙",
			description: "Quiet time for creative or personal projects",
		},
	];

	const breakPreferences = [
		{
			value: "short-frequent",
			label: "Short & Frequent",
			description: "5-10 min every hour",
			icon: "⚡",
			benefit: "Maintains high energy throughout the day",
		},
		{
			value: "medium",
			label: "Medium Breaks",
			description: "15-20 min every 2 hours",
			icon: "☕",
			benefit: "Balanced approach for most work types",
		},
		{
			value: "long-rare",
			label: "Longer Breaks",
			description: "30-45 min, less frequent",
			icon: "🧘",
			benefit: "Deep rest for intensive work sessions",
		},
		{
			value: "flexible",
			label: "Flexible",
			description: "Based on task and energy",
			icon: "🎯",
			benefit: "Adapts to your natural rhythm",
		},
	];

	const updatePreferences = (field: keyof WorkPreferences, value: any) => {
		onWorkPreferencesChange({ ...workPreferences, [field]: value });
	};

	const togglePeakHour = (hour: string) => {
		const peakHours = workPreferences.peakHours.includes(hour)
			? workPreferences.peakHours.filter((h) => h !== hour)
			: [...workPreferences.peakHours, hour];
		updatePreferences("peakHours", peakHours);
	};

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7308] to-[#A32530] rounded-2xl flex items-center justify-center shadow-lg">
					<Briefcase className="h-8 w-8 text-white" />
				</div>
				<div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Work Style & Preferences
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Help us understand how you work best so we can optimize
						your schedule.
					</p>
				</div>
			</div>

			{/* Work Type */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-3 mb-6">
					<Brain className="h-6 w-6 text-[#FF7308]" />
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
						What type of work do you primarily do?
					</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{workTypes.map((type) => (
						<button
							key={type.value}
							onClick={() =>
								updatePreferences("workType", type.value)
							}
							className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
								workPreferences.workType === type.value
									? "border-[#C13729] bg-[#FF7308]/10 dark:bg-[#C13729]/20 shadow-lg transform scale-[1.02]"
									: "border-gray-200 dark:border-gray-600 hover:border-[#FF7308] dark:hover:border-[#FF7308] hover:bg-gray-50 dark:hover:bg-gray-700/50"
							}`}
						>
							<div className="flex items-start gap-4">
								<div className="text-3xl">{type.icon}</div>
								<div>
									<div
										className={`font-semibold text-lg mb-1 ${
											workPreferences.workType ===
											type.value
												? "text-[#C13729] dark:text-[#FF7308]"
												: "text-gray-900 dark:text-white"
										}`}
									>
										{type.label}
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{type.description}
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Peak Hours */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-3 mb-6">
					<Zap className="h-6 w-6 text-[#E05C04]" />
					<div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
							When are you most productive?
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							Select all time blocks when you feel most energized
							and focused
						</p>
					</div>
				</div>
				<div className="space-y-3">
					{timeBlocks.map((block) => (
						<button
							key={block.value}
							onClick={() => togglePeakHour(block.value)}
							className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
								workPreferences.peakHours.includes(block.value)
									? "border-[#E05C04] bg-[#FF7308]/10 dark:bg-[#E05C04]/20 shadow-lg"
									: "border-gray-200 dark:border-gray-600 hover:border-[#FF7308] dark:hover:border-[#FF7308] hover:bg-gray-50 dark:hover:bg-gray-700/50"
							}`}
						>
							<div className="flex items-center gap-4">
								<div className="text-2xl">{block.icon}</div>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-1">
										<span
											className={`font-semibold text-lg ${
												workPreferences.peakHours.includes(
													block.value
												)
													? "text-[#E05C04] dark:text-[#FF7308]"
													: "text-gray-900 dark:text-white"
											}`}
										>
											{block.label}
										</span>
										<span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
											{block.time}
										</span>
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{block.description}
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Break Preferences */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-3 mb-6">
					<Coffee className="h-6 w-6 text-[#A32530]" />
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
						How do you prefer to take breaks?
					</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{breakPreferences.map((pref) => (
						<button
							key={pref.value}
							onClick={() =>
								updatePreferences("breakPreference", pref.value)
							}
							className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
								workPreferences.breakPreference === pref.value
									? "border-[#A32530] bg-[#A32530]/10 dark:bg-[#A32530]/20 shadow-lg transform scale-[1.02]"
									: "border-gray-200 dark:border-gray-600 hover:border-[#A32530] dark:hover:border-[#A32530] hover:bg-gray-50 dark:hover:bg-gray-700/50"
							}`}
						>
							<div className="flex items-start gap-4">
								<div className="text-2xl">{pref.icon}</div>
								<div>
									<div
										className={`font-semibold mb-1 ${
											workPreferences.breakPreference ===
											pref.value
												? "text-[#A32530] dark:text-[#C13729]"
												: "text-gray-900 dark:text-white"
										}`}
									>
										{pref.label}
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
										{pref.description}
									</div>
									<div className="text-xs text-[#C13729] dark:text-[#FF7308]">
										{pref.benefit}
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Focus Blocks */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-3 mb-6">
					<Clock className="h-6 w-6 text-[#841436]" />
					<div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
							Deep focus blocks per day
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							90-120 minute periods for your most important work
						</p>
					</div>
				</div>
				<div className="grid grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((num) => (
						<button
							key={num}
							onClick={() =>
								updatePreferences("focusBlocks", num)
							}
							className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${
								workPreferences.focusBlocks === num
									? "border-[#841436] bg-[#841436]/10 dark:bg-[#841436]/20 shadow-lg transform scale-[1.05]"
									: "border-gray-200 dark:border-gray-600 hover:border-[#841436] dark:hover:border-[#841436] hover:bg-gray-50 dark:hover:bg-gray-700/50"
							}`}
						>
							<div
								className={`text-3xl font-bold mb-2 ${
									workPreferences.focusBlocks === num
										? "text-[#841436] dark:text-[#C13729]"
										: "text-gray-900 dark:text-white"
								}`}
							>
								{num}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								{num === 1 ? "block" : "blocks"}
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Summary */}
			{workPreferences.peakHours.length > 0 && (
				<div className="bg-gradient-to-r from-[#FF7308]/10 to-[#841436]/10 dark:from-[#FF7308]/20 dark:to-[#841436]/20 border border-[#FF7308]/30 dark:border-[#841436]/30 rounded-3xl p-8">
					<h4 className="text-xl font-semibold text-[#841436] dark:text-[#FF7308] mb-4 flex items-center gap-2">
						<Zap className="h-5 w-5" />
						Your Peak Hours ({workPreferences.peakHours.length}{" "}
						selected)
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{workPreferences.peakHours.map((hour) => {
							const block = timeBlocks.find(
								(b) => b.value === hour
							);
							return (
								<div
									key={hour}
									className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl"
								>
									<div className="text-xl">{block?.icon}</div>
									<div>
										<div className="font-medium text-[#841436] dark:text-[#FF7308]">
											{block?.label}
										</div>
										<div className="text-sm text-[#C13729] dark:text-[#E05C04]">
											{block?.time}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<StepNavigation
				onPrevious={onPrevious}
				onNext={onNext}
				canGoNext={
					!!workPreferences.workType &&
					workPreferences.peakHours.length > 0
				}
				isLastStep={false}
				isLoading={false}
			/>
		</div>
	);
};
