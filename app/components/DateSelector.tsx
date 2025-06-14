"use client";

import React from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface DateSelectorProps {
	currentDate: string;
	onDateChange: (date: string) => void;
	onGoToToday: () => void;
}

export function DateSelector({
	currentDate,
	onDateChange,
	onGoToToday,
}: DateSelectorProps) {
	return (
		<div className="flex items-end gap-4">
			<div className="flex-1 min-w-[200px]">
				<Label
					htmlFor="date-selector"
					className="text-sm font-medium mb-2 block"
				>
					Select Date
				</Label>
				<Input
					id="date-selector"
					type="date"
					value={currentDate}
					onChange={(e) => onDateChange(e.target.value)}
					className="w-full"
				/>
			</div>
			<Button variant="secondary" size="sm" onClick={onGoToToday}>
				Today
			</Button>
		</div>
	);
}
