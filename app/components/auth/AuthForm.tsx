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
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthFormProps {
	mode: "signin" | "signup";
	onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
	const { signIn, signUp, loading } = useAuth();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		fullName: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (mode === "signup") {
			if (formData.password !== formData.confirmPassword) {
				setError("Passwords do not match");
				return;
			}
			if (formData.password.length < 6) {
				setError("Password must be at least 6 characters");
				return;
			}
			if (!formData.fullName.trim()) {
				setError("Full name is required");
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
			}
		} catch (error: any) {
			setError(error.message || "An error occurred");
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (error) setError(null);
	};

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
								required
							/>
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
							required
						/>
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
								required
							/>
						</div>
					)}

					{error && (
						<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
							{error}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{mode === "signin" ? "Sign In" : "Create Account"}
					</Button>

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
