import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { StepNavigation } from "./StepNavigation";
import { Commitment } from "@/app/lib/types";

export const CommitmentsStep = ({
	commitments,
	onCommitmentsChange,
	onNext,
	onPrevious,
}: {
	commitments: Commitment[];
	onCommitmentsChange: (commitments: Commitment[]) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const [newCommitment, setNewCommitment] = useState({
		taskName: "",
		duration: 60,
		preferredTime: "",
		days: [] as string[],
		priority: "medium" as const,
	});

	const daysOfWeek = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	const priorities = [
		{ value: "high", label: "High Priority", color: "text-red-600" },
		{ value: "medium", label: "Medium Priority", color: "text-yellow-600" },
		{ value: "low", label: "Low Priority", color: "text-green-600" },
	];

	const addCommitment = () => {
		if (!newCommitment.taskName.trim()) return;

		const commitment: Commitment = {
			id: Date.now().toString(),
			...newCommitment,
		};

		onCommitmentsChange([...commitments, commitment]);
		setNewCommitment({
			taskName: "",
			duration: 60,
			preferredTime: "",
			days: [],
			priority: "medium",
		});
	};

	const removeCommitment = (id: string) => {
		onCommitmentsChange(commitments.filter((c) => c.id !== id));
	};

	const toggleDay = (day: string) => {
		const days = newCommitment.days.includes(day)
			? newCommitment.days.filter((d) => d !== day)
			: [...newCommitment.days, day];
		setNewCommitment({ ...newCommitment, days });
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
				<h2 className="text-2xl font-bold mb-2">
					Your Fixed Commitments
				</h2>
				<p className="text-muted-foreground">
					Let's start with the non-negotiable items in your schedule
				</p>
			</div>

			{/* Add new commitment form */}
			<div className="bg-secondary/30 rounded-lg p-6 space-y-4">
				<h3 className="font-semibold flex items-center gap-2">
					<Plus className="h-4 w-4" />
					Add a commitment
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-2">
							What is it?
						</label>
						<input
							type="text"
							value={newCommitment.taskName}
							onChange={(e) =>
								setNewCommitment({
									...newCommitment,
									taskName: e.target.value,
								})
							}
							placeholder="e.g., Team standup, Gym workout, Doctor appointment"
							className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Duration (minutes)
						</label>
						<input
							type="number"
							value={newCommitment.duration}
							onChange={(e) =>
								setNewCommitment({
									...newCommitment,
									duration: parseInt(e.target.value) || 0,
								})
							}
							min="5"
							max="480"
							className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Preferred time (optional)
						</label>
						<input
							type="text"
							value={newCommitment.preferredTime}
							onChange={(e) =>
								setNewCommitment({
									...newCommitment,
									preferredTime: e.target.value,
								})
							}
							placeholder="e.g., 9:00 AM, Morning, After lunch"
							className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Priority
						</label>
						<select
							value={newCommitment.priority}
							onChange={(e) =>
								setNewCommitment({
									...newCommitment,
									priority: e.target.value as any,
								})
							}
							className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{priorities.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						Which days?
					</label>
					<div className="flex flex-wrap gap-2">
						{daysOfWeek.map((day) => (
							<button
								key={day}
								onClick={() => toggleDay(day)}
								className={`px-3 py-1 rounded-full text-sm transition-colors ${
									newCommitment.days.includes(day)
										? "bg-primary text-primary-foreground"
										: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
								}`}
							>
								{day.slice(0, 3)}
							</button>
						))}
					</div>
				</div>

				<button
					onClick={addCommitment}
					disabled={
						!newCommitment.taskName.trim() ||
						newCommitment.days.length === 0
					}
					className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Plus className="h-4 w-4" />
					Add commitment
				</button>
			</div>

			{/* Existing commitments */}
			{commitments.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-semibold">Your commitments:</h3>
					{commitments.map((commitment) => (
						<div
							key={commitment.id}
							className="flex items-center justify-between p-4 border border-border rounded-lg"
						>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<h4 className="font-medium">
										{commitment.taskName}
									</h4>
									<span
										className={`text-xs px-2 py-1 rounded-full ${
											commitment.priority === "high"
												? "bg-red-100 text-red-700"
												: commitment.priority ===
												  "medium"
												? "bg-yellow-100 text-yellow-700"
												: "bg-green-100 text-green-700"
										}`}
									>
										{commitment.priority}
									</span>
								</div>
								<div className="text-sm text-muted-foreground mt-1">
									{commitment.duration} minutes •{" "}
									{commitment.days.join(", ")}
									{commitment.preferredTime &&
										` • ${commitment.preferredTime}`}
								</div>
							</div>
							<button
								onClick={() => removeCommitment(commitment.id)}
								className="p-2 text-muted-foreground hover:text-destructive transition-colors"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}

			<StepNavigation
				onPrevious={onPrevious}
				onNext={onNext}
				canGoNext={true}
				isLastStep={false}
				isLoading={false}
				showSkip={commitments.length === 0}
				onSkip={onNext}
			/>
		</div>
	);
};
