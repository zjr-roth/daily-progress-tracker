"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { AuthService } from "../lib/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		// Check if we have the required hash parameters for password reset
		const hashParams = new URLSearchParams(
			window.location.hash.substring(1)
		);
		const accessToken = hashParams.get("access_token");
		const refreshToken = hashParams.get("refresh_token");

		if (!accessToken || !refreshToken) {
			setError(
				"Invalid reset link. Please request a new password reset."
			);
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);

		try {
			await AuthService.updatePassword(password);
			setSuccess(true);

			// Redirect to dashboard after successful password update
			setTimeout(() => {
				router.push("/");
			}, 2000);
		} catch (error: any) {
			setError(error.message || "Failed to update password");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<Card className="w-full max-w-md mx-auto">
					<CardContent className="p-6 text-center">
						<div className="text-green-600 mb-4">
							<svg
								className="w-16 h-16 mx-auto"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Password Updated!
						</h2>
						<p className="text-muted-foreground mb-4">
							Your password has been successfully updated. You
							will be redirected to the dashboard.
						</p>
						<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Redirecting...
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Logo */}
				<div className="text-center">
					<div className="flex items-center justify-center mb-4">
						<Image
							src="/atomic-logo.png"
							alt="Atomic"
							width={80}
							height={80}
							className="mr-3"
						/>
						<h1 className="text-3xl font-light text-orange-400">
							Atomic
						</h1>
					</div>
				</div>

				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">
							Reset Password
						</CardTitle>
						<p className="text-muted-foreground">
							Enter your new password below
						</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="password">New Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={
											showPassword ? "text" : "password"
										}
										placeholder="Enter your new password"
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										required
									/>
									<button
										type="button"
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={() =>
											setShowPassword(!showPassword)
										}
									>
										{showPassword ? (
											<EyeOff size={16} />
										) : (
											<Eye size={16} />
										)}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">
									Confirm New Password
								</Label>
								<Input
									id="confirmPassword"
									type="password"
									placeholder="Confirm your new password"
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									required
								/>
							</div>

							{error && (
								<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
									{error}
								</div>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
							>
								{loading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Update Password
							</Button>

							<div className="text-center">
								<button
									type="button"
									onClick={() => router.push("/")}
									className="text-sm text-muted-foreground hover:text-foreground"
								>
									Back to sign in
								</button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
