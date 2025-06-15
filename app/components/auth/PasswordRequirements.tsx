"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export interface PasswordRequirement {
	id: string;
	text: string;
	validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
	{
		id: "minLength",
		text: "At least 8 characters",
		validator: (password) => password.length >= 8,
	},
	{
		id: "uppercase",
		text: "At least one uppercase letter (A-Z)",
		validator: (password) => /[A-Z]/.test(password),
	},
	{
		id: "lowercase",
		text: "At least one lowercase letter (a-z)",
		validator: (password) => /[a-z]/.test(password),
	},
	{
		id: "number",
		text: "At least one number (0-9)",
		validator: (password) => /\d/.test(password),
	},
	{
		id: "special",
		text: "At least one special character (!@#$%^&*)",
		validator: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
	},
];

interface PasswordRequirementsProps {
	password: string;
	className?: string;
}

export function PasswordRequirements({
	password,
	className = "",
}: PasswordRequirementsProps) {
	const validation = passwordRequirements.map((req) => ({
		...req,
		isValid: req.validator(password),
	}));

	const validCount = validation.filter((req) => req.isValid).length;
	const isAllValid = validation.every((req) => req.isValid);

	const getStrengthColor = () => {
		if (validCount <= 2) return "bg-red-500";
		if (validCount <= 3) return "bg-yellow-500";
		if (validCount <= 4) return "bg-blue-500";
		return "bg-green-500";
	};

	const getStrengthText = () => {
		if (validCount <= 2) return "Weak";
		if (validCount <= 3) return "Fair";
		if (validCount <= 4) return "Good";
		return "Strong";
	};

	return (
		<div
			className={`p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border ${className}`}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
					Password Requirements
				</span>
				{password.length > 0 && (
					<span className="text-xs font-medium">
						<span
							className={`${
								validCount <= 2
									? "text-red-600"
									: validCount <= 3
									? "text-yellow-600"
									: validCount <= 4
									? "text-blue-600"
									: "text-green-600"
							}`}
						>
							{getStrengthText()}
						</span>
					</span>
				)}
			</div>

			{/* Strength bar */}
			{password.length > 0 && (
				<div className="mb-3">
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
						<div
							className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
							style={{
								width: `${
									(validCount / passwordRequirements.length) *
									100
								}%`,
							}}
						/>
					</div>
				</div>
			)}

			<div className="space-y-1">
				{validation.map((req) => (
					<div
						key={req.id}
						className="flex items-center space-x-2 text-xs"
					>
						{password.length === 0 ? (
							<div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" />
						) : req.isValid ? (
							<CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
						) : (
							<XCircle className="w-3 h-3 text-red-500" />
						)}
						<span
							className={
								password.length === 0
									? "text-gray-600 dark:text-gray-400"
									: req.isValid
									? "text-green-700 dark:text-green-300"
									: "text-red-600 dark:text-red-400"
							}
						>
							{req.text}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function validatePassword(password: string): boolean {
	return passwordRequirements.every((req) => req.validator(password));
}
