"use client";

import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";

interface EmailVerificationAlertProps {
	onBackToSignIn: () => void;
	onResendEmail?: () => void;
	isResending?: boolean;
}

export function EmailVerificationAlert({
	onBackToSignIn,
	onResendEmail,
	isResending = false,
}: EmailVerificationAlertProps) {
	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<div className="flex justify-center mb-4">
					<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
						<CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
					</div>
				</div>
				<CardTitle className="text-2xl text-green-600 dark:text-green-400">
					Check Your Email!
				</CardTitle>
			</CardHeader>
			<CardContent className="text-center space-y-4">
				{/* Main verification message */}
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<div className="flex items-start space-x-3">
						<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
						<div className="text-left">
							<p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
								Verification Required
							</p>
							<p className="text-sm text-blue-700 dark:text-blue-300">
								A verification link has been sent to your email.
								Please check your email and click the
								verification link to activate your account. You
								will then be redirected back to the application.
							</p>
						</div>
					</div>
				</div>

				{/* Help text */}
				<div className="text-sm text-muted-foreground space-y-2">
					<p>Didn't receive the email?</p>
					<ul className="text-xs space-y-1">
						<li>• Check your spam or junk folder</li>
						<li>
							• Make sure you entered the correct email address
						</li>
						<li>• Wait a few minutes for the email to arrive</li>
					</ul>
				</div>

				{/* Action buttons */}
				<div className="space-y-3 pt-2">
					{onResendEmail && (
						<button
							onClick={onResendEmail}
							disabled={isResending}
							className="w-full px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isResending
								? "Sending..."
								: "Resend verification email"}
						</button>
					)}

					<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
						<button
							onClick={onBackToSignIn}
							className="text-sm text-primary hover:underline font-medium"
						>
							Already verified? Sign in here
						</button>
					</div>
				</div>

				{/* Additional help */}
				<div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border">
					<p className="font-medium mb-1">Need help?</p>
					<p>
						If you continue to have issues, please contact support
						or try signing up again with a different email address.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
