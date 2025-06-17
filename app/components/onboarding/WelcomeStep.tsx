import { Sparkles } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
	const [userName, setUserName] = useState("");

	return (
		<div className="text-center space-y-6">
			<div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
				<Sparkles className="h-10 w-10 text-white" />
			</div>

			<div>
				<h1 className="text-3xl font-bold mb-2">Welcome to Atomic!</h1>
				<p className="text-lg text-muted-foreground mb-6">
					Let's create your personalized daily schedule using AI
				</p>
			</div>

			<div className="max-w-md mx-auto space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						What should we call you?
					</label>
					<input
						type="text"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						placeholder="Enter your name"
						className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>

			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-lg mx-auto">
				<h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
					What we'll do together:
				</h3>
				<ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
					<li>• Understand your daily commitments and goals</li>
					<li>• Learn about your work style and preferences</li>
					<li>
						• Create an optimized schedule tailored just for you
					</li>
					<li>• Set you up for productive, balanced days</li>
				</ul>
			</div>

			<button
				onClick={onNext}
				disabled={!userName.trim()}
				className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
			>
				Let's get started! <ArrowRight className="h-4 w-4" />
			</button>
		</div>
	);
};
