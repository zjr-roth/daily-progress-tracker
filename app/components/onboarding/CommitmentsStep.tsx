import { useState } from "react";
import { Calendar, MessageSquare } from "lucide-react";
import { StepNavigation } from "./StepNavigation";

export const CommitmentsStep = ({
	naturalLanguageCommitments,
	onCommitmentsChange,
	onNext,
	onPrevious,
}: {
	naturalLanguageCommitments: string;
	onCommitmentsChange: (commitments: string) => void;
	onNext: () => void;
	onPrevious: () => void;
}) => {
	const [commitmentText, setCommitmentText] = useState(
		naturalLanguageCommitments
	);

	const handleTextChange = (value: string) => {
		setCommitmentText(value);
		onCommitmentsChange(value);
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
				<h2 className="text-2xl font-bold mb-2">
					Your Fixed Commitments
				</h2>
				<p className="text-muted-foreground">
					Tell us about your non-negotiable daily activities in your
					own words
				</p>
			</div>

			{/* Natural language input */}
			<div className="bg-secondary/30 rounded-lg p-6 space-y-4">
				<h3 className="font-semibold flex items-center gap-2">
					<MessageSquare className="h-4 w-4" />
					Describe your fixed commitments
				</h3>

				<div className="space-y-3">
					<label className="block text-sm font-medium">
						What are your daily non-negotiable activities?
					</label>
					<textarea
						value={commitmentText}
						onChange={(e) => handleTextChange(e.target.value)}
						placeholder="E.g, I go to the dog park daily for 1 hour at 5:30 PM
• I like to have my morning coffee and workout when I wake up so I need at least 2 hours for that
• Team standup every weekday at 9 AM for 30 minutes"
						rows={8}
						className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
					/>
					<p className="text-xs text-muted-foreground">
						Just describe your commitments naturally - our AI will
						understand the timing, duration, and frequency
						automatically.
					</p>
				</div>

				{/* Example section */}
				<div className="bg-muted/50 rounded-md p-4 space-y-2">
					<h4 className="text-sm font-medium text-muted-foreground">
						💡 Tips for better results:
					</h4>
					<ul className="text-xs text-muted-foreground space-y-1 ml-4">
						<li>
							• Include specific times when possible (e.g., "at 9
							AM", "around 6 PM")
						</li>
						<li>
							• Mention duration (e.g., "for 1 hour", "30
							minutes", "at least 2 hours")
						</li>
						<li>
							• Specify frequency (e.g., "daily", "every weekday",
							"Monday and Wednesday")
						</li>
						<li>
							• Be as specific or general as you'd like - both
							work great!
						</li>
					</ul>
				</div>
			</div>

			<StepNavigation
				onPrevious={onPrevious}
				onNext={onNext}
				canGoNext={true}
				isLastStep={false}
				isLoading={false}
				showSkip={!commitmentText.trim()}
				onSkip={onNext}
			/>
		</div>
	);
};
