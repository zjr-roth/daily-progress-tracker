"use client";

import React from "react";
import { CategoryStats as CategoryStatsType } from "@/app/lib/types";

interface CategoryStatsProps {
	stats: CategoryStatsType;
}

export function CategoryStats({ stats }: CategoryStatsProps) {
	const categories = Object.keys(stats);

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{categories.map((category) => (
				<div
					key={category}
					className="text-center p-3 bg-secondary rounded-lg"
				>
					<div className="text-xl font-bold text-primary mb-1">
						{stats[category].percentage}%
					</div>
					<div className="text-xs text-muted-foreground">
						{category}
					</div>
					<div className="text-xs text-muted-foreground mt-1">
						{stats[category].completed}/{stats[category].total}
					</div>
				</div>
			))}
		</div>
	);
}
