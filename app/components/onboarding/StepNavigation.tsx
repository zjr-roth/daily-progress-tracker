import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export const StepNavigation = ({
	onPrevious,
	onNext,
	onSkip,
	canGoNext,
	isLastStep,
	isLoading,
	showSkip = false,
}: {
	onPrevious: () => void;
	onNext: () => void;
	onSkip?: () => void;
	canGoNext: boolean;
	isLastStep: boolean;
	isLoading: boolean;
	showSkip?: boolean;
}) => (
	<div className="flex justify-between items-center mt-8">
		<button
			onClick={onPrevious}
			className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft className="h-4 w-4" />
			Back
		</button>

		<div className="flex gap-3">
			{showSkip && onSkip && (
				<button
					onClick={onSkip}
					className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
				>
					Skip for now
				</button>
			)}

			<button
				onClick={onNext}
				disabled={!canGoNext || isLoading}
				className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<>
						{isLastStep ? "Generate Schedule" : "Continue"}
						<ArrowRight className="h-4 w-4" />
					</>
				)}
			</button>
		</div>
	</div>
);
