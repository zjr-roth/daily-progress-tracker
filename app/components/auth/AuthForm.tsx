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
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface AuthFormProps {
	mode: "signin" | "signup";
	onToggleMode: () => void;
	onForgotPassword?: () => void;
}

interface FormErrors {
	email?: string;
	password?: string;
	fullName?: string;
	confirmPassword?: string;
}

export function AuthForm({
	mode,
	onToggleMode,
	onForgotPassword,
}: AuthFormProps) {
	const { signIn, signUp, loading } = useAuth();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		fullName: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [emailVerificationSent, setEmailVerificationSent] = useState(false);

	const clearErrors = () => {
		setErrors({});
	};

	const setFieldError = (field: keyof FormErrors, message: string) => {
		setErrors((prev) => ({
			...prev,
			[field]: message,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearErrors();

		// Basic validation
		if (mode === "signup") {
			if (formData.password.length < 6) {
				setFieldError(
					"password",
					"Password must be at least 6 characters"
				);
				return;
			}
			if (formData.password !== formData.confirmPassword) {
				setFieldError("confirmPassword", "Passwords do not match");
				return;
			}
			if (!formData.fullName.trim()) {
				setFieldError("fullName", "Full name is required");
				return;
			}
		}

		try {
			if (mode === "signin") {
				await signIn(formData.email, formData.password);
			} else {
				await signUp(
					formData.email,
					formData.password,
					formData.fullName
				);
				setEmailVerificationSent(true);
			}
		} catch (error: any) {
			const errorMessage =
				error?.message || "An unexpected error occurred";

			// Determine which field the error relates to
			if (
				errorMessage.includes("password you entered is incorrect") ||
				errorMessage.includes("password") ||
				errorMessage.includes("Invalid login credentials")
			) {
				setFieldError(
					"password",
					"The password you entered is incorrect. Please try again."
				);
			} else if (
				errorMessage.includes("email address was not found") ||
				errorMessage.includes("email") ||
				errorMessage.includes("not found")
			) {
				setFieldError(
					"email",
					"An account with this email address was not found. Please check your email or sign up for a new account."
				);
			} else if (
				errorMessage.includes("email not confirmed") ||
				errorMessage.includes("verification")
			) {
				setFieldError(
					"email",
					"Please check your email and click the verification link to activate your account before signing in."
				);
			} else if (errorMessage.includes("too many")) {
				setFieldError(
					"email",
					"Too many sign-in attempts. Please wait a few minutes before trying again."
				);
			} else {
				// Default to email field for general errors
				setFieldError("email", errorMessage);
			}
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear field-specific error when user starts typing
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({
				...prev,
				[field]: undefined,
			}));
		}
	};

	// Show email verification alert if signup was successful
	if (emailVerificationSent) {
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
					<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
						<div className="flex items-start space-x-3">
							<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
							<div className="text-left">
								<p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
									Verification Required
								</p>
								<p className="text-sm text-blue-700 dark:text-blue-300">
									A verification link has been sent to your
									email. Please check your email and click the
									verification link to activate your account.
									You will then be redirected back to the
									application.
								</p>
							</div>
						</div>
					</div>

					<div className="text-sm text-muted-foreground">
						<p>
							Didn't receive the email? Check your spam folder or
						</p>
						<button
							onClick={() => setEmailVerificationSent(false)}
							className="text-primary hover:underline font-medium"
						>
							try signing up again
						</button>
					</div>

					<div className="pt-4 border-t">
						<button
							onClick={onToggleMode}
							className="text-sm text-primary hover:underline font-medium"
						>
							Already verified? Sign in here
						</button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">
					{mode === "signin" ? "Welcome Back" : "Create Account"}
				</CardTitle>
				<p className="text-muted-foreground">
					{mode === "signin"
						? "Sign in to access your productivity dashboard"
						: "Sign up to start tracking your daily progress"}
				</p>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{mode === "signup" && (
						<div className="space-y-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								type="text"
								placeholder="Enter your full name"
								value={formData.fullName}
								onChange={(e) =>
									handleInputChange(
										"fullName",
										e.target.value
									)
								}
								className={
									errors.fullName
										? "border-red-500 focus:border-red-500"
										: ""
								}
								required
							/>
							{errors.fullName && (
								<p className="text-sm text-red-600 dark:text-red-400">
									{errors.fullName}
								</p>
							)}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							value={formData.email}
							onChange={(e) =>
								handleInputChange("email", e.target.value)
							}
							className={
								errors.email
									? "border-red-500 focus:border-red-500"
									: ""
							}
							required
						/>
						{errors.email && (
							<p className="text-sm text-red-600 dark:text-red-400">
								{errors.email}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter your password"
								value={formData.password}
								onChange={(e) =>
									handleInputChange(
										"password",
										e.target.value
									)
								}
								className={
									errors.password
										? "border-red-500 focus:border-red-500"
										: ""
								}
								required
							/>
							<button
								type="button"
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff size={16} />
								) : (
									<Eye size={16} />
								)}
							</button>
						</div>
						{errors.password && (
							<p className="text-sm text-red-600 dark:text-red-400">
								{errors.password}
							</p>
						)}
					</div>

					{mode === "signup" && (
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="Confirm your password"
								value={formData.confirmPassword}
								onChange={(e) =>
									handleInputChange(
										"confirmPassword",
										e.target.value
									)
								}
								className={
									errors.confirmPassword
										? "border-red-500 focus:border-red-500"
										: ""
								}
								required
							/>
							{errors.confirmPassword && (
								<p className="text-sm text-red-600 dark:text-red-400">
									{errors.confirmPassword}
								</p>
							)}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{mode === "signin" ? "Sign In" : "Create Account"}
					</Button>

					{/* Forgot Password Link */}
					{mode === "signin" && onForgotPassword && (
						<div className="text-center">
							<button
								type="button"
								onClick={onForgotPassword}
								className="text-sm text-muted-foreground hover:text-primary transition-colors"
							>
								Forgot your password?
							</button>
						</div>
					)}

					<div className="text-center text-sm">
						<span className="text-muted-foreground">
							{mode === "signin"
								? "Don't have an account? "
								: "Already have an account? "}
						</span>
						<button
							type="button"
							onClick={onToggleMode}
							className="text-primary hover:underline font-medium"
						>
							{mode === "signin" ? "Sign up" : "Sign in"}
						</button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
