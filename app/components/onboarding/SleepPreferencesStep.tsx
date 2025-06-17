import { SleepPreferences } from "@/app/lib/types";
import { StepNavigation } from "./StepNavigation";
import { Moon, Sun, Clock } from "lucide-react";
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

		const wake = new Date(`2000-01-01 ${sleepSchedule.wakeUpTime}`);
		let bed = new Date(`2000-01-01 ${sleepSchedule.bedTime}`);

		// If bedtime is later than wake time, it's the next day
		if (bed >= wake) {
			bed = new Date(`2000-01-02 ${sleepSchedule.bedTime}`);
		}

		const diff = wake.getTime() - bed.getTime();
		return Math.round(diff / (1000 * 60 * 60));
	};

	useEffect(() => {
		if (sleepSchedule.wakeUpTime && sleepSchedule.bedTime) {
			const duration = calculateSleepDuration();
			updateSchedule("sleepDuration", duration);
		}
	}, [sleepSchedule.wakeUpTime, sleepSchedule.bedTime]);

	const getSleepQuality = (duration: number) => {
		if (duration < 6) return { label: "Too little", color: "text-red-600" };
		if (duration < 7)
			return { label: "Below optimal", color: "text-yellow-600" };
		if (duration <= 9) return { label: "Optimal", color: "text-green-600" };
		return { label: "Too much", color: "text-yellow-600" };
	};

	const quality = getSleepQuality(sleepSchedule.sleepDuration);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<Moon className="h-12 w-12 mx-auto text-primary mb-4" />
				<h2 className="text-2xl font-bold mb-2">Sleep Schedule</h2>
				<p className="text-muted-foreground">
					Quality sleep is the foundation of productivity. Let's
					optimize your rest.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-secondary/30 rounded-lg p-6">
					<h3 className="font-semibold mb-4 flex items-center gap-2">
						<Moon className="h-5 w-5" />
						Bedtime
					</h3>
					<input
						type="time"
						value={sleepSchedule.bedTime}
						onChange={(e) =>
							updateSchedule("bedTime", e.target.value)
						}
						className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<p className="text-sm text-muted-foreground mt-2">
						When do you usually go to bed?
					</p>
				</div>

				<div className="bg-secondary/30 rounded-lg p-6">
					<h3 className="font-semibold mb-4 flex items-center gap-2">
						<Sun className="h-5 w-5" />
						Wake up time
					</h3>
					<input
						type="time"
						value={sleepSchedule.wakeUpTime}
						onChange={(e) =>
							updateSchedule("wakeUpTime", e.target.value)
						}
						className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<p className="text-sm text-muted-foreground mt-2">
						When do you usually wake up?
					</p>
				</div>
			</div>

			{sleepSchedule.wakeUpTime && sleepSchedule.bedTime && (
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-blue-800 dark:text-blue-200">
								Sleep Duration: {sleepSchedule.sleepDuration}{" "}
								hours
							</h4>
							<p
								className={`text-sm font-medium ${quality.color}`}
							>
								{quality.label}
							</p>
						</div>
						<Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
					</div>

					{quality.label !== "Optimal" && (
						<div className="mt-3 text-sm text-blue-700 dark:text-blue-300">
							💡 <strong>Tip:</strong> Most adults need 7-9 hours
							of sleep for optimal performance.
						</div>
					)}
				</div>
			)}

			<div className="bg-secondary/30 rounded-lg p-6">
				<h3 className="font-semibold mb-3">
					Sleep Tips for Better Productivity
				</h3>
				<ul className="text-sm text-muted-foreground space-y-2">
					<li>
						• Consistent sleep schedule improves energy and focus
					</li>
					<li>• Avoid screens 1 hour before bedtime</li>
					<li>
						• Your most productive hours are typically 2-4 hours
						after waking
					</li>
					<li>
						• Consider a power nap (10-20 min) if you feel sluggish
						afternoon
					</li>
				</ul>
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
