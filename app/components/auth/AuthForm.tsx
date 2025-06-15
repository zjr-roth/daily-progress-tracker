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

export function AuthForm({
	mode,
	onToggleMode,
	onForgotPassword,
}: AuthFormProps) {
	const { signIn, signUp, loading, errors, clearErrors } = useAuth();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		fullName: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [emailVerificationSent, setEmailVerificationSent] = useState(false);
	const [localErrors, setLocalErrors] = useState<{
		confirmPassword?: string;
		password?: string;
	}>({});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("AuthForm: Form submitted, current mode:", mode);

		// Clear both context and local errors
		clearErrors();
		setLocalErrors({});

		if (mode === "signup") {
			// Client-side validation for signup
			let hasValidationErrors = false;

			if (formData.password.length < 6) {
				setLocalErrors((prev) => ({
					...prev,
					password: "Password must be at least 6 characters.",
				}));
				hasValidationErrors = true;
			}
			if (formData.password !== formData.confirmPassword) {
				setLocalErrors((prev) => ({
					...prev,
					confirmPassword: "Passwords do not match.",
				}));
				hasValidationErrors = true;
			}

			if (hasValidationErrors) {
				return;
			}
		}

		try {
			if (mode === "signin") {
				console.log("AuthForm: Attempting signin...");
				await signIn(formData.email, formData.password);
				console.log("AuthForm: Signin completed");
			} else {
				console.log("AuthForm: Attempting signup...");
				await signUp(
					formData.email,
					formData.password,
					formData.fullName
				);
				// If signup succeeds without errors, show verification message
				if (Object.keys(errors).length === 0) {
					setEmailVerificationSent(true);
				}
			}
		} catch (error: any) {
			// Errors are now handled in the AuthContext
			console.log("AuthForm: Error occurred, but handled in context");
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear context errors for the field being edited
		if (errors[field as keyof typeof errors]) {
			clearErrors();
		}

		// Clear local errors for the field being edited
		if (localErrors[field as keyof typeof localErrors]) {
			setLocalErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	// Combine context errors with local validation errors
	const getFieldError = (field: string) => {
		return (
			errors[field as keyof typeof errors] ||
			localErrors[field as keyof typeof localErrors]
		);
	};

	if (emailVerificationSent) {
		return (
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<CheckCircle className="w-16 h-16 text-green-500" />
					</div>
					<CardTitle className="text-2xl">
						Check Your Email!
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						A verification link has been sent to your email. Please
						click the link to activate your account.
					</p>
					<div className="mt-4">
						<button
							onClick={onToggleMode}
							className="text-sm text-primary hover:underline font-medium"
						>
							Back to Sign In
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
								aria-invalid={!!getFieldError("fullName")}
								required
							/>
							{getFieldError("fullName") && (
								<div className="text-sm text-red-600 font-medium flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
									<AlertCircle className="w-4 h-4 text-red-500" />
									<span>{getFieldError("fullName")}</span>
								</div>
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
							aria-invalid={!!getFieldError("email")}
							className={
								getFieldError("email") ? "border-red-500" : ""
							}
							required
						/>
						{getFieldError("email") && (
							<div className="text-sm text-red-600 font-medium flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
								<AlertCircle className="w-4 h-4 text-red-500" />
								<span>{getFieldError("email")}</span>
							</div>
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
								aria-invalid={!!getFieldError("password")}
								className={
									getFieldError("password")
										? "border-red-500"
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
						{getFieldError("password") && (
							<div className="text-sm text-red-600 font-medium flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
								<AlertCircle className="w-4 h-4 text-red-500" />
								<span>{getFieldError("password")}</span>
							</div>
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
								aria-invalid={
									!!getFieldError("confirmPassword")
								}
								required
							/>
							{getFieldError("confirmPassword") && (
								<div className="text-sm text-red-600 font-medium flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
									<AlertCircle className="w-4 h-4 text-red-500" />
									<span>
										{getFieldError("confirmPassword")}
									</span>
								</div>
							)}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{mode === "signin" ? "Sign In" : "Create Account"}
					</Button>

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
