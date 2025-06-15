"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { AuthService } from "../../lib/auth";
import { ArrowLeft, Mail, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ForgotPasswordProps {
	onBackToSignIn: () => void;
}

export function ForgotPassword({ onBackToSignIn }: ForgotPasswordProps) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await AuthService.resetPassword(email);
			setSuccess(true);
		} catch (error: any) {
			setError(error.message || "Failed to send reset email");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
							<Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
						</div>
					</div>
					<CardTitle className="text-2xl text-green-600 dark:text-green-400">
						Reset Link Sent!
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
						<p className="text-sm text-green-800 dark:text-green-200">
							We've sent a password reset link to{" "}
							<strong>{email}</strong>. Please check your email
							and follow the instructions to reset your password.
						</p>
					</div>

					<div className="text-sm text-muted-foreground">
						<p>Didn't receive the email? Check your spam folder.</p>
					</div>

					<div className="space-y-2">
						<Button
							variant="outline"
							onClick={() => {
								setSuccess(false);
								setEmail("");
							}}
							className="w-full"
						>
							Send another reset link
						</Button>

						<button
							onClick={onBackToSignIn}
							className="w-full text-sm text-primary hover:underline font-medium"
						>
							Back to sign in
						</button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<div className="flex items-center space-x-2 mb-2">
					<button
						onClick={onBackToSignIn}
						className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
					</button>
					<CardTitle className="text-2xl">Reset Password</CardTitle>
				</div>
				<p className="text-muted-foreground">
					Enter your email address and we'll send you a link to reset
					your password.
				</p>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="resetEmail">Email Address</Label>
						<Input
							id="resetEmail"
							type="email"
							placeholder="Enter your email address"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								if (error) setError(null);
							}}
							required
						/>
					</div>

					{error && (
						<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
							<div className="flex items-start space-x-2">
								<XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
								<p className="text-sm text-red-800 dark:text-red-200">
									{error}
								</p>
							</div>
						</div>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Send Reset Link
					</Button>

					<div className="text-center">
						<button
							type="button"
							onClick={onBackToSignIn}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Remember your password? Sign in
						</button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
``;
