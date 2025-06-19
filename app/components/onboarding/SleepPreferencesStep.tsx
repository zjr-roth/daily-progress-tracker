import { SleepPreferences } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import { Moon, Sun, Clock, Bed, Sunrise } from "lucide-react";
import { useEffect } from "react";

export const SleepPreferencesStep = ({
	sleepSchedule,
	onSleepScheduleChange,
	onNext,
	onPrevious,
}: {
	sleepSchedule: SleepPreferences;
	onSleepScheduleChange: (schedule: SleepPreferences) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const updateSchedule = (
		field: keyof SleepPreferences,
		value: string | number
	) => {
		onSleepScheduleChange({ ...sleepSchedule, [field]: value });
	};

	const calculateSleepDuration = () => {
		if (!sleepSchedule.wakeUpTime || !sleepSchedule.bedTime) return 8;

		// Create date objects for calculation
		const wakeTime = new Date(`1970-01-01T${sleepSchedule.wakeUpTime}:00`);
		const bedTime = new Date(`1970-01-01T${sleepSchedule.bedTime}:00`);

		// Calculate the difference in milliseconds
		let diff = wakeTime.getTime() - bedTime.getTime();

		// If the difference is negative, it means the sleep period crosses midnight
		if (diff < 0) {
			diff += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
		}

		// Convert milliseconds to hours and round to the nearest half hour
		const hours = diff / (1000 * 60 * 60);
		return Math.round(hours * 2) / 2;
	};

	useEffect(() => {
		if (sleepSchedule.wakeUpTime && sleepSchedule.bedTime) {
			const duration = calculateSleepDuration();
			// Ensure duration is always positive before updating
			if (duration > 0) {
				updateSchedule("sleepDuration", duration);
			}
		}
	}, [sleepSchedule.wakeUpTime, sleepSchedule.bedTime]);

	const getSleepQuality = (duration: number) => {
		if (duration < 6)
			return {
				label: "Too little",
				color: "text-red-600 dark:text-red-400",
				bgColor: "bg-red-50 dark:bg-red-900/20",
				borderColor: "border-red-200 dark:border-red-800",
				icon: "😴",
			};
		if (duration < 7)
			return {
				label: "Below optimal",
				color: "text-yellow-600 dark:text-yellow-400",
				bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
				borderColor: "border-yellow-200 dark:border-yellow-800",
				icon: "😪",
			};
		if (duration <= 9)
			return {
				label: "Optimal",
				color: "text-green-600 dark:text-green-400",
				bgColor: "bg-green-50 dark:bg-green-900/20",
				borderColor: "border-green-200 dark:border-green-800",
				icon: "😊",
			};
		return {
			label: "Too much",
			color: "text-yellow-600 dark:text-yellow-400",
			bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
			borderColor: "border-yellow-200 dark:border-yellow-800",
			icon: "😴",
		};
	};

	const quality = getSleepQuality(sleepSchedule.sleepDuration);

	const quickPresets = [
		{ label: "Early Bird", bedTime: "22:00", wakeTime: "06:00" },
		{ label: "Standard", bedTime: "23:00", wakeTime: "07:00" },
		{ label: "Night Owl", bedTime: "24:00", wakeTime: "08:00" },
		{ label: "Flexible", bedTime: "23:30", wakeTime: "07:30" },
	];

	const setPreset = (preset: (typeof quickPresets)[0]) => {
		updateSchedule("bedTime", preset.bedTime);
		updateSchedule("wakeUpTime", preset.wakeTime);
	};

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
					<Moon className="h-8 w-8 text-white" />
				</div>
				<div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Sleep Schedule
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Quality sleep is the foundation of productivity. Let's
						optimize your rest.
					</p>
				</div>
			</div>

			{/* Quick Presets */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
					<Clock className="h-5 w-5 text-indigo-500" />
					Quick Setup
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{quickPresets.map((preset) => (
						<button
							key={preset.label}
							onClick={() => setPreset(preset)}
							className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 text-center"
						>
							<div className="font-medium text-gray-900 dark:text-white mb-1">
								{preset.label}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								{preset.bedTime} - {preset.wakeTime}
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Time Input */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
							<Bed className="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
								Bedtime
							</h3>
							<p className="text-gray-600 dark:text-gray-400">
								When do you usually go to bed?
							</p>
						</div>
					</div>
					<input
						type="time"
						value={sleepSchedule.bedTime}
						onChange={(e) =>
							updateSchedule("bedTime", e.target.value)
						}
						className="w-full px-6 py-4 text-2xl font-mono border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-center transition-all duration-200"
					/>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
							<Sunrise className="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
								Wake up time
							</h3>
							<p className="text-gray-600 dark:text-gray-400">
								When do you usually wake up?
							</p>
						</div>
					</div>
					<input
						type="time"
						value={sleepSchedule.wakeUpTime}
						onChange={(e) =>
							updateSchedule("wakeUpTime", e.target.value)
						}
						className="w-full px-6 py-4 text-2xl font-mono border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:bg-gray-700 dark:text-white text-center transition-all duration-200"
					/>
				</div>
			</div>

			{/* Sleep Analysis */}
			{sleepSchedule.wakeUpTime && sleepSchedule.bedTime && (
				<div
					className={`${quality.bgColor} border ${quality.borderColor} rounded-3xl p-8 transition-all duration-300`}
				>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-4">
							<div className="text-4xl">{quality.icon}</div>
							<div>
								<h4
									className={`text-2xl font-bold ${quality.color}`}
								>
									{sleepSchedule.sleepDuration} hours
								</h4>
								<p
									className={`text-lg font-medium ${quality.color}`}
								>
									{quality.label}
								</p>
							</div>
						</div>
						<Clock
							className={`h-12 w-12 ${quality.color
								.replace("text-", "text-")
								.replace(" dark:text-", " dark:text-")}`}
						/>
					</div>

					{quality.label !== "Optimal" && (
						<div
							className={`p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 ${quality.color}`}
						>
							<div className="flex items-start gap-3">
								<div className="text-2xl">💡</div>
								<div>
									<p className="font-medium mb-2">
										Sleep Optimization Tip:
									</p>
									{quality.label === "Too little" && (
										<p>
											Most adults need 7-9 hours of sleep
											for optimal performance. Consider
											going to bed earlier or waking up
											later.
										</p>
									)}
									{quality.label === "Below optimal" && (
										<p>
											You're close! Try adding 30-60
											minutes to your sleep schedule for
											better energy and focus.
										</p>
									)}
									{quality.label === "Too much" && (
										<p>
											While sleep is important, too much
											can make you groggy. Consider a more
											consistent 7-8 hour schedule.
										</p>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Sleep Tips */}
			<div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-800">
				<h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-6 flex items-center gap-2">
					<Sun className="h-5 w-5" />
					Sleep Tips for Better Productivity
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{[
						{
							icon: "🔄",
							title: "Consistency is key",
							tip: "Stick to the same sleep schedule every day, even on weekends",
						},
						{
							icon: "📱",
							title: "Digital sunset",
							tip: "Avoid screens 1 hour before bedtime for better sleep quality",
						},
						{
							icon: "⚡",
							title: "Peak performance",
							tip: "Your most productive hours are typically 2-4 hours after waking",
						},
						{
							icon: "💤",
							title: "Power naps",
							tip: "A 10-20 minute nap can boost afternoon energy if needed",
						},
					].map((item, index) => (
						<div
							key={index}
							className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl"
						>
							<div className="text-2xl">{item.icon}</div>
							<div>
								<p className="font-medium text-gray-900 dark:text-white mb-1">
									{item.title}
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{item.tip}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<StepNavigation
				onPrevious={onPrevious}
				onNext={onNext}
				canGoNext={
					!!sleepSchedule.wakeUpTime && !!sleepSchedule.bedTime
				}
				isLastStep={false}
				isLoading={false}
			/>
		</div>
	);
};
