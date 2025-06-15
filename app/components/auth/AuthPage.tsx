"use client";

import React, { useState } from "react";
import { AuthForm } from "./AuthForm";
import { ForgotPassword } from "./ForgotPassword";
import Image from "next/image";

type AuthView = "signin" | "signup" | "forgot-password";

export function AuthPage() {
	const [currentView, setCurrentView] = useState<AuthView>("signin");

	const handleViewChange = (view: AuthView) => {
		setCurrentView(view);
	};

	const toggleSignInSignUp = () => {
		setCurrentView(currentView === "signin" ? "signup" : "signin");
	};

	const renderCurrentView = () => {
		switch (currentView) {
			case "forgot-password":
				return (
					<ForgotPassword
						onBackToSignIn={() => setCurrentView("signin")}
					/>
				);
			default:
				return (
					<AuthForm
						mode={currentView}
						onToggleMode={toggleSignInSignUp}
						onForgotPassword={() =>
							setCurrentView("forgot-password")
						}
					/>
				);
		}
	};

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
					<p className="text-muted-foreground">
						Daily Productivity & Schedule Management
					</p>
				</div>

				{/* Auth Components */}
				{renderCurrentView()}
			</div>
		</div>
	);
}
