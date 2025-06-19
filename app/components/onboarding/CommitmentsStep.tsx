import { useState } from "react";
import { Calendar, MessageCircle, Sparkles, Clock, X } from "lucide-react";
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
	const [naturalInput, setNaturalInput] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	// Parse natural language input into commitments
	const parseNaturalInput = (input: string): Commitment[] => {
		const parsed: Commitment[] = [];

		// Simple regex patterns to extract commitments
		const patterns = [
			/(\d+)\s*(?:hours?|hrs?|h)\s*(?:of\s*)?([^,\n\.]+)/gi,
			/(\d+)\s*(?:minutes?|mins?|m)\s*(?:of\s*)?([^,\n\.]+)/gi,
			/([^,\n\.]+?)\s*(?:for\s*)?(\d+)\s*(?:hours?|hrs?|h)/gi,
			/([^,\n\.]+?)\s*(?:for\s*)?(\d+)\s*(?:minutes?|mins?|m)/gi,
		];

		let idCounter = Date.now();

		patterns.forEach((pattern) => {
			let match;
			while ((match = pattern.exec(input)) !== null) {
				const [full, timeOrActivity, activityOrTime] = match;

				let duration: number;
				let activity: string;

				// Determine which capture group is time vs activity
				if (/\d+/.test(timeOrActivity)) {
					duration =
						parseInt(timeOrActivity) *
						(full.includes("minute") || full.includes("min")
							? 1
							: 60);
					activity = activityOrTime.trim();
				} else {
					duration =
						parseInt(activityOrTime) *
						(full.includes("minute") || full.includes("min")
							? 1
							: 60);
					activity = timeOrActivity.trim();
				}

				if (
					activity &&
					duration > 0 &&
					!parsed.some(
						(p) =>
							p.taskName.toLowerCase() === activity.toLowerCase()
					)
				) {
					parsed.push({
						id: (idCounter++).toString(),
						taskName: activity,
						duration: Math.max(15, Math.min(480, duration)), // 15 min to 8 hours
						preferredTime: "",
						days: [
							"Monday",
							"Tuesday",
							"Wednesday",
							"Thursday",
							"Friday",
							"Saturday",
							"Sunday",
						],
						priority: "medium" as const,
					});
				}
			}
		});

		// If no specific patterns found, try to extract general activities
		if (parsed.length === 0) {
			const sentences = input.split(/[,\n\.]+/).filter((s) => s.trim());
			sentences.forEach((sentence) => {
				const cleaned = sentence.trim();
				if (cleaned.length > 3 && !cleaned.match(/^\d+/)) {
					parsed.push({
						id: (idCounter++).toString(),
						taskName: cleaned,
						duration: 60, // Default 1 hour
						preferredTime: "",
						days: [
							"Monday",
							"Tuesday",
							"Wednesday",
							"Thursday",
							"Friday",
							"Saturday",
							"Sunday",
						],
						priority: "medium" as const,
					});
				}
			});
		}

		return parsed;
	};

	const handleProcessInput = () => {
		if (!naturalInput.trim()) return;

		setIsProcessing(true);

		// Simulate processing delay for better UX
		setTimeout(() => {
			const newCommitments = parseNaturalInput(naturalInput);
			onCommitmentsChange([...commitments, ...newCommitments]);
			setNaturalInput("");
			setIsProcessing(false);
		}, 800);
	};

	const removeCommitment = (id: string) => {
		onCommitmentsChange(commitments.filter((c) => c.id !== id));
	};

	const examples = [
		"2 hours of Math study, 1 hour CPA study, 30 minutes dog walk",
		"Gym workout for 90 minutes, team meeting for 1 hour",
		"Doctor appointment 45 minutes, grocery shopping 30 minutes",
		"Piano practice 1 hour, cooking dinner 45 minutes",
	];

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
					<Calendar className="h-8 w-8 text-white" />
				</div>
				<div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Your Fixed Commitments
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						Tell me about the non-negotiable items in your daily
						schedule
					</p>
				</div>
			</div>

			{/* Natural Language Input */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
				<div className="flex items-start gap-4 mb-6">
					<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
						<MessageCircle className="h-5 w-5 text-white" />
					</div>
					<div className="flex-1">
						<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
							What are your daily commitments?
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Just tell me naturally - I'll understand the
							details!
						</p>
					</div>
				</div>

				<div className="space-y-4">
					<textarea
						value={naturalInput}
						onChange={(e) => setNaturalInput(e.target.value)}
						placeholder="e.g., I have 2 hours of Math study, 2 hours of CPA study, 1 hour of taking my dog to the dog park, 45 minutes for gym workout..."
						rows={4}
						className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-200"
					/>

					<button
						onClick={handleProcessInput}
						disabled={!naturalInput.trim() || isProcessing}
						className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
					>
						<div className="flex items-center gap-2">
							{isProcessing ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									Processing...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Add commitments
								</>
							)}
						</div>
					</button>
				</div>

				{/* Examples */}
				<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
					<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
						💡 Examples to get you started:
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{examples.map((example, index) => (
							<button
								key={index}
								onClick={() => setNaturalInput(example)}
								className="text-left p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
							>
								"{example}"
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Current Commitments */}
			{commitments.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
						<Clock className="h-5 w-5 text-blue-500" />
						Your commitments ({commitments.length})
					</h3>
					<div className="grid gap-3">
						{commitments.map((commitment) => (
							<div
								key={commitment.id}
								className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
							>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-1">
										<h4 className="font-medium text-gray-900 dark:text-white">
											{commitment.taskName}
										</h4>
										<span
											className={`text-xs px-2 py-1 rounded-full ${
												commitment.priority === "high"
													? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
													: commitment.priority ===
													  "medium"
													? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
													: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
											}`}
										>
											{commitment.priority}
										</span>
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{commitment.duration} minutes
										{commitment.preferredTime &&
											` • ${commitment.preferredTime}`}
									</div>
								</div>
								<button
									onClick={() =>
										removeCommitment(commitment.id)
									}
									className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
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
