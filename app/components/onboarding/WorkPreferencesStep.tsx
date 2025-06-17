import { WorkPreferences } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import { Briefcase } from "lucide-react";

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
		{ value: "creative", label: "Creative Work", icon: "🎨" },
		{ value: "analytical", label: "Analytical/Technical", icon: "📊" },
		{ value: "communication", label: "Communication/Meetings", icon: "💬" },
		{ value: "mixed", label: "Mixed/Varied", icon: "🔄" },
	];

	const timeBlocks = [
		{ value: "early-morning", label: "Early Morning (6-9 AM)", icon: "🌅" },
		{ value: "morning", label: "Morning (9 AM-12 PM)", icon: "☀️" },
		{ value: "afternoon", label: "Afternoon (12-4 PM)", icon: "🏙️" },
		{
			value: "late-afternoon",
			label: "Late Afternoon (4-6 PM)",
			icon: "🌆",
		},
		{ value: "evening", label: "Evening (6-9 PM)", icon: "🌙" },
	];

	const breakPreferences = [
		{
			value: "short-frequent",
			label: "Short & Frequent (5-10 min every hour)",
		},
		{ value: "medium", label: "Medium Breaks (15-20 min every 2 hours)" },
		{
			value: "long-rare",
			label: "Longer Breaks (30-45 min, less frequent)",
		},
		{ value: "flexible", label: "Flexible based on task" },
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
		<div className="space-y-6">
			<div className="text-center">
				<Briefcase className="h-12 w-12 mx-auto text-primary mb-4" />
				<h2 className="text-2xl font-bold mb-2">
					Work Style & Preferences
				</h2>
				<p className="text-muted-foreground">
					Help us understand how you work best so we can optimize your
					schedule.
				</p>
			</div>

			<div className="space-y-6">
				{/* Work Type */}
				<div>
					<h3 className="font-semibold mb-3">
						What type of work do you primarily do?
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{workTypes.map((type) => (
							<button
								key={type.value}
								onClick={() =>
									updatePreferences("workType", type.value)
								}
								className={`p-4 rounded-lg border-2 text-left transition-all ${
									workPreferences.workType === type.value
										? "border-primary bg-primary/5 text-primary"
										: "border-border hover:border-primary/50 hover:bg-secondary/50"
								}`}
							>
								<div className="flex items-center gap-3">
									<span className="text-2xl">
										{type.icon}
									</span>
									<span className="font-medium">
										{type.label}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Peak Hours */}
				<div>
					<h3 className="font-semibold mb-3">
						When are you most productive? (Select all that apply)
					</h3>
					<div className="space-y-2">
						{timeBlocks.map((block) => (
							<button
								key={block.value}
								onClick={() => togglePeakHour(block.value)}
								className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
									workPreferences.peakHours.includes(
										block.value
									)
										? "border-primary bg-primary/5 text-primary"
										: "border-border hover:border-primary/50 hover:bg-secondary/50"
								}`}
							>
								<div className="flex items-center gap-3">
									<span className="text-xl">
										{block.icon}
									</span>
									<span className="font-medium">
										{block.label}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Break Preferences */}
				<div>
					<h3 className="font-semibold mb-3">
						How do you prefer to take breaks?
					</h3>
					<div className="space-y-2">
						{breakPreferences.map((pref) => (
							<button
								key={pref.value}
								onClick={() =>
									updatePreferences(
										"breakPreference",
										pref.value
									)
								}
								className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
									workPreferences.breakPreference ===
									pref.value
										? "border-primary bg-primary/5 text-primary"
										: "border-border hover:border-primary/50 hover:bg-secondary/50"
								}`}
							>
								<span className="font-medium">
									{pref.label}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* Focus Blocks */}
				<div>
					<h3 className="font-semibold mb-3">
						How many deep focus blocks do you prefer per day?
					</h3>
					<div className="flex gap-3">
						{[1, 2, 3, 4].map((num) => (
							<button
								key={num}
								onClick={() =>
									updatePreferences("focusBlocks", num)
								}
								className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
									workPreferences.focusBlocks === num
										? "border-primary bg-primary/5 text-primary"
										: "border-border hover:border-primary/50 hover:bg-secondary/50"
								}`}
							>
								<div className="text-2xl font-bold">{num}</div>
								<div className="text-sm text-muted-foreground">
									{num === 1 ? "block" : "blocks"}
								</div>
							</button>
						))}
					</div>
					<p className="text-sm text-muted-foreground mt-2">
						Deep focus blocks are 90-120 minute periods for your
						most important work.
					</p>
				</div>
			</div>

			{workPreferences.peakHours.length > 0 && (
				<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
					<h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
						Your Peak Hours ({workPreferences.peakHours.length}{" "}
						selected):
					</h4>
					<div className="flex flex-wrap gap-2">
						{workPreferences.peakHours.map((hour) => {
							const block = timeBlocks.find(
								(b) => b.value === hour
							);
							return (
								<span
									key={hour}
									className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full"
								>
									{block?.label}
								</span>
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
