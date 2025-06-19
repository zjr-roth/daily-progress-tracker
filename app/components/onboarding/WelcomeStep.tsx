import { Sparkles } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
	const [userName, setUserName] = useState("");

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
			<div className="text-center space-y-8 max-w-2xl mx-auto px-6">
				{/* Logo with enhanced styling */}
				<div className="relative">
					<div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
						<Sparkles className="h-12 w-12 text-white" />
					</div>
					<div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-3xl opacity-20 blur-xl"></div>
				</div>

				{/* Welcome text with better typography */}
				<div className="space-y-4">
					<h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
						Welcome to Atomic
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
						Let's create your personalized daily schedule using AI.
						<br />
						<span className="text-lg text-gray-500 dark:text-gray-400">
							This will only take a few minutes.
						</span>
					</p>
				</div>

				{/* Enhanced name input */}
				<div className="space-y-6">
					<div className="max-w-md mx-auto">
						<label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
							What should we call you?
						</label>
						<input
							type="text"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							placeholder="Enter your name"
							className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
						/>
					</div>
				</div>

				{/* Enhanced feature preview */}
				<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-lg mx-auto">
					<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-2">
						<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
						What we'll do together
					</h3>
					<div className="space-y-3 text-left">
						{[
							"Understand your daily commitments and goals",
							"Learn about your work style and preferences",
							"Create an optimized schedule tailored just for you",
							"Set you up for productive, balanced days",
						].map((item, index) => (
							<div
								key={index}
								className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
							>
								<div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
									<span className="text-white text-sm font-bold">
										{index + 1}
									</span>
								</div>
								<span>{item}</span>
							</div>
						))}
					</div>
				</div>

				{/* Enhanced CTA button */}
				<button
					onClick={onNext}
					disabled={!userName.trim()}
					className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-2xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
				>
					<div className="flex items-center gap-3">
						Let's get started!
						<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
					</div>
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
				</button>

				{/* Progress indicator */}
				<div className="flex items-center justify-center gap-2 mt-8">
					<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
					<div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
					<div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
					<div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
					<div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
				</div>
			</div>
		</div>
	);
};
