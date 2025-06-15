"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AuthService } from "../lib/auth";

interface FormErrors {
	email?: string;
	password?: string;
	fullName?: string;
	confirmPassword?: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	errors: FormErrors;
	clearErrors: () => void;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (
		email: string,
		password: string,
		fullName: string
	) => Promise<void>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [errors, setErrors] = useState<FormErrors>({});

	const clearErrors = () => {
		console.log("AuthContext: Clearing errors");
		setErrors({});
	};

	const setFieldError = (field: keyof FormErrors, message: string) => {
		console.log(`AuthContext: Setting error for ${field}:`, message);
		setErrors((prev) => {
			const newErrors = { ...prev, [field]: message };
			console.log("AuthContext: New errors state:", newErrors);
			return newErrors;
		});
	};

	useEffect(() => {
		// Get initial session
		const getInitialSession = async () => {
			try {
				const session = await AuthService.getCurrentSession();
				setUser(session?.user || null);
			} catch (error) {
				console.error("Error getting initial session:", error);
			} finally {
				setLoading(false);
			}
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = AuthService.onAuthStateChange((user) => {
			console.log(
				"Auth state changed:",
				user ? "User logged in" : "User logged out"
			);
			setUser(user);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = async (email: string, password: string) => {
		console.log("AuthContext: Starting signIn process");
		setLoading(true);
		clearErrors(); // Clear previous errors

		try {
			console.log("AuthContext: Calling AuthService.signIn");
			const result = await AuthService.signIn({ email, password });
			console.log("AuthContext: signIn completed successfully", result);

			// Don't set loading to false here - let the auth state change handle it
		} catch (error: any) {
			console.error("AuthContext: signIn failed with error:", error);
			console.error("AuthContext: Error type:", typeof error);
			console.error(
				"AuthContext: Error constructor:",
				error?.constructor?.name
			);
			console.error("AuthContext: Error message:", error?.message);

			// Make sure loading is set to false on error
			setLoading(false);

			const errorMessage =
				error?.message || "An unexpected error occurred.";
			console.log("AuthContext: Error message extracted:", errorMessage);

			// Map error messages to specific fields
			if (errorMessage.includes("Invalid credentials")) {
				console.log("AuthContext: Setting invalid credentials error");
				setFieldError(
					"email",
					"Invalid email or password. Please check your credentials."
				);
			} else if (
				errorMessage.includes("verify your email") ||
				errorMessage.includes("Email not confirmed")
			) {
				console.log("AuthContext: Setting email verification error");
				setFieldError(
					"email",
					"Please verify your email before signing in."
				);
			} else if (errorMessage.includes("Sign in failed")) {
				console.log("AuthContext: Setting sign in failed error");
				setFieldError("password", "Sign in failed. Please try again.");
			} else {
				console.log("AuthContext: Setting default error");
				setFieldError(
					"email",
					errorMessage ||
						"An unexpected error occurred. Please try again."
				);
			}

			// Don't re-throw the error since we're handling it with state
		}
	};

	const signUp = async (
		email: string,
		password: string,
		fullName: string
	) => {
		console.log("AuthContext: Starting signUp process");
		setLoading(true);
		clearErrors(); // Clear previous errors

		try {
			console.log("AuthContext: Calling AuthService.signUp");
			const result = await AuthService.signUp({
				email,
				password,
				fullName,
			});
			console.log("AuthContext: signUp completed successfully", result);

			// For signup, we might not get an immediate auth state change
			// if email verification is required, so set loading to false
			setLoading(false);
		} catch (error: any) {
			console.error("AuthContext: signUp failed with error:", error);
			console.error("AuthContext: Error message:", error.message);

			setLoading(false);

			const errorMessage =
				error?.message || "An unexpected error occurred.";

			// Map signup-specific error messages
			if (
				errorMessage.includes("already registered") ||
				errorMessage.includes("already exists")
			) {
				console.log("AuthContext: Setting already registered error");
				setFieldError(
					"email",
					"An account with this email already exists. Please sign in instead."
				);
			} else if (errorMessage.includes("weak password")) {
				console.log("AuthContext: Setting weak password error");
				setFieldError(
					"password",
					"Password is too weak. Please choose a stronger password."
				);
			} else {
				console.log("AuthContext: Setting default signup error");
				setFieldError(
					"email",
					errorMessage ||
						"An unexpected error occurred. Please try again."
				);
			}

			// Don't re-throw the error since we're handling it with state
		}
	};

	const signOut = async () => {
		setLoading(true);
		clearErrors();
		try {
			await AuthService.signOut();
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	const resetPassword = async (email: string) => {
		clearErrors();
		try {
			await AuthService.resetPassword(email);
		} catch (error) {
			const errorMessage =
				(error as any)?.message || "Password reset failed.";
			setFieldError("email", errorMessage);
			throw error;
		}
	};

	const value = {
		user,
		loading,
		errors,
		clearErrors,
		signIn,
		signUp,
		signOut,
		resetPassword,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
