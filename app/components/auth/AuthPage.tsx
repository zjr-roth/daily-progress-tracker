"use client";

import React, { useState } from "react";
import { AuthForm } from "./AuthForm";
import Image from "next/image";

export function AuthPage() {
	const [mode, setMode] = useState<"signin" | "signup">("signin");

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

				{/* Auth Form */}
				<AuthForm
					mode={mode}
					onToggleMode={() =>
						setMode(mode === "signin" ? "signup" : "signin")
					}
				/>
			</div>
		</div>
	);
}
