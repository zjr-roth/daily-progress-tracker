"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Mail, Clock, RefreshCw } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface EmailVerificationAlertProps {
	email: string;
	onBackToSignIn: () => void;
	onResendEmail?: () => Promise<void>;
}

export function EmailVerificationAlert({
	email,
	onBackToSignIn,
	onResendEmail,
}: EmailVerificationAlertProps) {
	const [isResending, setIsResending] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [showDeliveryTips, setShowDeliveryTips] = useState(false);

	// Start cooldown timer for resend functionality
	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => {
				setResendCooldown(resendCooldown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [resendCooldown]);

	const handleResendEmail = async () => {
		if (!onResendEmail || resendCooldown > 0) return;

		setIsResending(true);
		try {
			await onResendEmail();
			setResendCooldown(60); // 60 second cooldown
			// Show success feedback
			const toast = createToast("Verification email sent!", "success");
			document.body.appendChild(toast);
			setTimeout(() => document.body.removeChild(toast), 3000);
		} catch (error) {
			console.error("Failed to resend email:", error);
			const toast = createToast(
				"Failed to resend email. Please try again.",
				"error"
			);
			document.body.appendChild(toast);
			setTimeout(() => document.body.removeChild(toast), 3000);
		} finally {
			setIsResending(false);
		}
	};

	const createToast = (message: string, type: "success" | "error") => {
		const toast = document.createElement("div");
		const bgColor =
			type === "success"
				? "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
				: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";

		toast.className = `fixed top-4 right-4 ${bgColor} border px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
		toast.textContent = message;
		return toast;
	};

	return (
		<Card className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<CardHeader className="text-center pb-4">
				<div className="flex justify-center mb-4">
					<div className="relative">
						<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
							<Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
							<CheckCircle className="w-4 h-4 text-white" />
						</div>
					</div>
				</div>
				<CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
					Check Your Email!
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					Account created successfully
				</p>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Main verification message */}
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<div className="flex items-start space-x-3">
						<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
						<div className="text-left">
							<p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
								Please check your email for a verification link
								to complete your account setup
							</p>
							<p className="text-sm text-blue-700 dark:text-blue-300">
								We've sent a verification email to{" "}
								<span className="font-semibold">{email}</span>.
								Click the verification link in the email to
								activate your account.
							</p>
						</div>
					</div>
				</div>

				{/* Delivery delay notice */}
				<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
					<div className="flex items-center space-x-2">
						<Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
						<p className="text-sm text-yellow-800 dark:text-yellow-200">
							<strong>
								Email delivery may take 1-5 minutes.
							</strong>{" "}
							Please be patient.
						</p>
					</div>
				</div>

				{/* Troubleshooting section */}
				<div className="space-y-3">
					<button
						onClick={() => setShowDeliveryTips(!showDeliveryTips)}
						className="w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					>
						{showDeliveryTips ? "Hide" : "Show"} email delivery tips
						↓
					</button>

					{showDeliveryTips && (
						<div className="text-sm text-muted-foreground space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
							<p className="font-medium">Can't find the email?</p>
							<ul className="text-xs space-y-1 ml-4">
								<li>
									• Check your spam, junk, or promotions
									folder
								</li>
								<li>
									• Make sure you entered the correct email
									address
								</li>
								<li>• Wait up to 5 minutes for delivery</li>
								<li>
									• Check if your email provider blocks
									automated emails
								</li>
							</ul>
						</div>
					)}
				</div>

				{/* Action buttons */}
				<div className="space-y-3 pt-2">
					{onResendEmail && (
						<Button
							onClick={handleResendEmail}
							disabled={isResending || resendCooldown > 0}
							variant="outline"
							className="w-full"
						>
							{isResending ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Sending...
								</>
							) : resendCooldown > 0 ? (
								<>
									<Clock className="w-4 h-4 mr-2" />
									Resend in {resendCooldown}s
								</>
							) : (
								<>
									<Mail className="w-4 h-4 mr-2" />
									Resend verification email
								</>
							)}
						</Button>
					)}

					<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
						<Button
							variant="ghost"
							onClick={onBackToSignIn}
							className="w-full text-sm"
						>
							Already verified? Sign in here
						</Button>
					</div>
				</div>

				{/* Additional help section */}
				<div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border">
					<p className="font-medium mb-1">Still having trouble?</p>
					<p>
						If you continue to experience issues, please contact our
						support team or try creating a new account with a
						different email address.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
