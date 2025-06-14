"use client";

import React, { useState, useEffect } from "react";

interface ProgressCircleProps {
	percentage: number;
	size?: number;
}

export function ProgressCircle({ percentage, size = 80 }: ProgressCircleProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const radius = (size - 8) / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDasharray = circumference;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	// Render a simple version on server-side to match initial client render
	if (!mounted) {
		return (
			<div className="relative flex items-center justify-center">
				<svg
					width={size}
					height={size}
					className="transform -rotate-90"
				>
					{/* Background circle */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="hsl(var(--secondary))"
						strokeWidth="4"
						fill="transparent"
					/>
					{/* Progress circle - start at 0 */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="hsl(var(--primary))"
						strokeWidth="4"
						fill="transparent"
						strokeDasharray={circumference}
						strokeDashoffset={circumference}
						strokeLinecap="round"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-lg font-bold text-primary">
						{percentage}%
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex items-center justify-center">
			<svg width={size} height={size} className="transform -rotate-90">
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="hsl(var(--secondary))"
					strokeWidth="4"
					fill="transparent"
				/>
				{/* Progress circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="hsl(var(--primary))"
					strokeWidth="4"
					fill="transparent"
					strokeDasharray={strokeDasharray}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="transition-all duration-300 ease-in-out"
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span className="text-lg font-bold text-primary">
					{percentage}%
				</span>
			</div>
		</div>
	);
}
