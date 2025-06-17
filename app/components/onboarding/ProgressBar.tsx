export const ProgressBar = ({
	currentStep,
	totalSteps,
}: {
	currentStep: number;
	totalSteps: number;
}) => (
	<div className="w-full bg-secondary rounded-full h-2 mb-8">
		<div
			className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
			style={{ width: `${(currentStep / totalSteps) * 100}%` }}
		/>
	</div>
);
