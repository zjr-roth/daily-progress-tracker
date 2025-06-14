"use client";

import React, { useEffect, useRef } from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ProgressData } from "../lib/types";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

interface ProgressChartProps {
	progressData: ProgressData;
	onDateClick?: (date: string) => void;
}

export function ProgressChart({
	progressData,
	onDateClick,
}: ProgressChartProps) {
	const chartRef = useRef<ChartJS<"line", number[], string>>(null);

	const sortedDates = Object.keys(progressData).sort();
	const labels = sortedDates.map((date) => {
		const d = new Date(date + "T00:00:00");
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	});
	const data = sortedDates.map(
		(date) => progressData[date].completionPercentage
	);

	const chartData = {
		labels,
		datasets: [
			{
				label: "Daily Completion %",
				data,
				borderColor: "hsl(var(--primary))",
				backgroundColor: "hsla(var(--primary), 0.1)",
				borderWidth: 3,
				fill: true,
				tension: 0.2,
				pointBackgroundColor: data.map((value) => {
					if (value >= 80) return "hsl(var(--primary))";
					if (value >= 60) return "hsl(var(--warning))";
					return "hsl(var(--destructive))";
				}),
				pointBorderColor: "#fff",
				pointBorderWidth: 2,
				pointRadius: 6,
				pointHoverRadius: 8,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
				text: "Daily Progress Over Time",
				font: {
					size: 16,
					weight: "bold" as const,
				},
			},
			tooltip: {
				callbacks: {
					title: function (context: any) {
						const dataIndex = context[0].dataIndex;
						const date = sortedDates[dataIndex];
						const d = new Date(date + "T00:00:00");
						return d.toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						});
					},
					label: function (context: any) {
						return `Completion: ${context.parsed.y}%`;
					},
				},
			},
		},
		scales: {
			x: {
				title: {
					display: true,
					text: "Date",
				},
			},
			y: {
				beginAtZero: true,
				max: 100,
				title: {
					display: true,
					text: "Completion Percentage",
				},
			},
		},
		onClick: function (event: any, elements: any[]) {
			if (elements.length > 0 && onDateClick) {
				const dataIndex = elements[0].index;
				const clickedDate = sortedDates[dataIndex];
				onDateClick(clickedDate);
			}
		},
	};

	if (sortedDates.length === 0) {
		return (
			<div className="h-96 flex items-center justify-center text-muted-foreground">
				No progress data available
			</div>
		);
	}

	return (
		<div className="h-96">
			<Line ref={chartRef} data={chartData} options={options} />
		</div>
	);
}
