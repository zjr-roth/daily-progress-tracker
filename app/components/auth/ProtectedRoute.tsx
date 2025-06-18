"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AuthPage } from "./AuthPage";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading } = useAuth();

	console.log("ProtectedRoute Check:", {
		user: user ? { id: user.id, email: user.email } : null,
		loading,
		hasUser: !!user,
	});

	// Show loading while checking auth state
	if (loading) {
		console.log("ProtectedRoute: Still loading, showing loader");
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
					<p className="text-muted-foreground">
						Checking authentication...
					</p>
				</div>
			</div>
		);
	}

	// If no user after loading is complete, show auth page
	if (!user) {
		console.log("ProtectedRoute: No user found, showing AuthPage");
		return <AuthPage />;
	}

	// User is authenticated, show protected content
	console.log("ProtectedRoute: User authenticated, showing children");
	return <>{children}</>;
}
