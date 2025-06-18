"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AuthService } from "../lib/auth";
import { OnboardingService } from "../lib/services/onboardingService";
import { supabase } from "../lib/supabase";

interface FormErrors {
	email?: string;
	password?: string;
	fullName?: string;
	confirmPassword?: string;
}

interface OnboardingState {
	hasCompletedOnboarding: boolean;
	isCheckingOnboardingStatus: boolean;
	onboardingError: string | null;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	errors: FormErrors;
	onboardingState: OnboardingState;
	clearErrors: () => void;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (
		email: string,
		password: string,
		fullName: string
	) => Promise<void>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	checkOnboardingStatus: () => Promise<void>;
	markOnboardingComplete: () => Promise<void>;
	resetOnboarding: () => Promise<void>;
	clearSession: () => Promise<void>; // New method for manual session clearing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [errors, setErrors] = useState<FormErrors>({});
	const [onboardingState, setOnboardingState] = useState<OnboardingState>({
		hasCompletedOnboarding: false,
		isCheckingOnboardingStatus: false,
		onboardingError: null,
	});

	// Session validation helper
	const validateSession = async (userToValidate: User): Promise<boolean> => {
		try {
			console.log(
				"AuthProvider: Validating session for user:",
				userToValidate.email
			);

			// Try to get fresh user data from Supabase
			const { data, error } = await supabase.auth.getUser();

			if (error) {
				console.log(
					"AuthProvider: Session validation failed with error:",
					error.message
				);
				return false;
			}

			if (!data.user) {
				console.log(
					"AuthProvider: Session validation failed - no user returned"
				);
				return false;
			}

			// Check if the user ID matches
			if (data.user.id !== userToValidate.id) {
				console.log(
					"AuthProvider: Session validation failed - user ID mismatch"
				);
				return false;
			}

			// Additional check: try to verify the user exists in our database
			try {
				await OnboardingService.hasCompletedOnboarding(data.user.id);
				console.log("AuthProvider: Session validation successful");
				return true;
			} catch (dbError) {
				// If user doesn't exist in our database, session is invalid
				console.log(
					"AuthProvider: Session validation failed - user not found in database:",
					dbError
				);
				return false;
			}
		} catch (error) {
			console.error("AuthProvider: Session validation error:", error);
			return false;
		}
	};

	// Clear session helper
	const clearSession = async (): Promise<void> => {
		console.log("AuthProvider: Manually clearing session");
		try {
			await supabase.auth.signOut();
			setUser(null);
			setOnboardingState({
				hasCompletedOnboarding: false,
				isCheckingOnboardingStatus: false,
				onboardingError: null,
			});
			clearErrors();
		} catch (error) {
			console.error("AuthProvider: Error clearing session:", error);
		}
	};

	// Main auth effect
	useEffect(() => {
		console.log("AuthProvider: Setting up auth state listener");

		// Get initial session with validation
		const getInitialSession = async () => {
			try {
				console.log("AuthProvider: Getting initial session");
				const session = await AuthService.getCurrentSession();

				if (session?.user) {
					console.log(
						"AuthProvider: Found cached session for:",
						session.user.email
					);

					// Validate the session is still good
					const isValid = await validateSession(session.user);

					if (isValid) {
						console.log(
							"AuthProvider: Session is valid, setting user"
						);
						setUser(session.user);
					} else {
						console.log(
							"AuthProvider: Session is invalid, clearing and signing out"
						);
						await clearSession();
					}
				} else {
					console.log("AuthProvider: No cached session found");
					setUser(null);
				}
			} catch (error) {
				console.error(
					"AuthProvider: Error getting initial session:",
					error
				);
				setUser(null);
				// Clear potentially corrupted session
				await clearSession();
			} finally {
				setLoading(false);
				console.log("AuthProvider: Initial auth check complete");
			}
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = AuthService.onAuthStateChange(async (user) => {
			console.log(
				"AuthProvider: Auth state changed:",
				user ? `User: ${user.email}` : "No user"
			);

			if (user) {
				// Validate new auth state
				const isValid = await validateSession(user);
				if (isValid) {
					setUser(user);
				} else {
					console.log(
						"AuthProvider: New auth state is invalid, clearing"
					);
					await clearSession();
				}
			} else {
				setUser(null);
				// Reset onboarding state when user logs out
				setOnboardingState({
					hasCompletedOnboarding: false,
					isCheckingOnboardingStatus: false,
					onboardingError: null,
				});
			}

			setLoading(false);
		});

		return () => {
			console.log("AuthProvider: Cleaning up auth listener");
			subscription.unsubscribe();
		};
	}, []);

	// Check onboarding status when user changes
	useEffect(() => {
		if (user?.id) {
			console.log(
				"AuthProvider: User exists, checking onboarding status for:",
				user.email
			);
			checkOnboardingStatus();
		} else {
			console.log("AuthProvider: No user, resetting onboarding state");
			setOnboardingState({
				hasCompletedOnboarding: false,
				isCheckingOnboardingStatus: false,
				onboardingError: null,
			});
		}
	}, [user?.id]);

	const clearErrors = () => {
		setErrors({});
	};

	const setFieldError = (field: keyof FormErrors, message: string) => {
		setErrors((prev) => ({ ...prev, [field]: message }));
	};

	const checkOnboardingStatus = async () => {
		if (!user?.id) {
			console.log("checkOnboardingStatus: No user ID");
			return;
		}

		console.log("checkOnboardingStatus: Checking for user:", user.email);
		setOnboardingState((prev) => ({
			...prev,
			isCheckingOnboardingStatus: true,
			onboardingError: null,
		}));

		try {
			const hasCompleted = await OnboardingService.hasCompletedOnboarding(
				user.id
			);
			console.log(
				"checkOnboardingStatus: Onboarding completed?",
				hasCompleted
			);

			setOnboardingState({
				hasCompletedOnboarding: hasCompleted,
				isCheckingOnboardingStatus: false,
				onboardingError: null,
			});
		} catch (error: any) {
			console.error("checkOnboardingStatus: Error:", error);

			// If we can't check onboarding status, the user might not exist in our database
			// This could indicate an invalid session
			if (
				error.message?.includes("not found") ||
				error.message?.includes("does not exist")
			) {
				console.log(
					"checkOnboardingStatus: User not found in database, clearing session"
				);
				await clearSession();
				return;
			}

			setOnboardingState({
				hasCompletedOnboarding: false,
				isCheckingOnboardingStatus: false,
				onboardingError:
					error.message || "Failed to check onboarding status",
			});
		}
	};

	const markOnboardingComplete = async () => {
		if (!user?.id) return;
		console.log(
			"markOnboardingComplete: Marking complete for:",
			user.email
		);
		try {
			await OnboardingService.completeOnboarding(user.id);
			setOnboardingState((prev) => ({
				...prev,
				hasCompletedOnboarding: true,
				onboardingError: null,
			}));
			console.log("markOnboardingComplete: Success");
		} catch (error: any) {
			console.error("markOnboardingComplete: Error:", error);
			setOnboardingState((prev) => ({
				...prev,
				onboardingError:
					error.message || "Failed to mark onboarding complete",
			}));
		}
	};

	const resetOnboarding = async () => {
		if (!user?.id) return;
		try {
			await OnboardingService.resetOnboarding(user.id);
			setOnboardingState((prev) => ({
				...prev,
				hasCompletedOnboarding: false,
				onboardingError: null,
			}));
		} catch (error: any) {
			console.error("resetOnboarding: Error:", error);
			setOnboardingState((prev) => ({
				...prev,
				onboardingError: error.message || "Failed to reset onboarding",
			}));
		}
	};

	const signIn = async (email: string, password: string) => {
		console.log("signIn: Attempting signin for:", email);
		setLoading(true);
		clearErrors();
		try {
			const result = await AuthService.signIn({ email, password });
			console.log("signIn: Success");

			// The auth state change listener will handle setting the user
			// and validating the session
		} catch (error: any) {
			console.error("signIn: Error:", error);
			setLoading(false);
			const errorMessage =
				error?.message || "An unexpected error occurred.";

			if (
				errorMessage.includes("Invalid login credentials") ||
				errorMessage.includes("Invalid credentials")
			) {
				setFieldError(
					"email",
					"Invalid email or password. Please check your credentials."
				);
			} else if (errorMessage.includes("Email not confirmed")) {
				setFieldError(
					"email",
					"Please verify your email before signing in."
				);
			} else if (errorMessage.includes("Too many requests")) {
				setFieldError(
					"email",
					"Too many login attempts. Please wait a moment and try again."
				);
			} else {
				setFieldError("email", errorMessage);
			}
		}
	};

	const signUp = async (
		email: string,
		password: string,
		fullName: string
	) => {
		console.log("signUp: Attempting signup for:", email);
		setLoading(true);
		clearErrors();
		try {
			await AuthService.signUp({ email, password, fullName });
			console.log("signUp: Success");
			setLoading(false);
		} catch (error: any) {
			console.error("signUp: Error:", error);
			setLoading(false);
			const errorMessage =
				error?.message || "An unexpected error occurred.";

			if (
				errorMessage.includes("already registered") ||
				errorMessage.includes("already exists")
			) {
				setFieldError(
					"email",
					"An account with this email already exists."
				);
			} else if (errorMessage.includes("weak password")) {
				setFieldError(
					"password",
					"Password is too weak. Please choose a stronger password."
				);
			} else if (errorMessage.includes("invalid email")) {
				setFieldError("email", "Please enter a valid email address.");
			} else {
				setFieldError("email", errorMessage);
			}
		}
	};

	const signOut = async () => {
		console.log("signOut: Signing out user");
		setLoading(true);
		clearErrors();

		try {
			await AuthService.signOut();
			console.log("signOut: Success");
		} catch (error) {
			console.error("signOut: Error:", error);
		}

		// Clear state immediately
		setUser(null);
		setOnboardingState({
			hasCompletedOnboarding: false,
			isCheckingOnboardingStatus: false,
			onboardingError: null,
		});
		setLoading(false);
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
		onboardingState,
		clearErrors,
		signIn,
		signUp,
		signOut,
		resetPassword,
		checkOnboardingStatus,
		markOnboardingComplete,
		resetOnboarding,
		clearSession, // Expose for manual session clearing
	};

	console.log("AuthProvider: Current state:", {
		hasUser: !!user,
		userEmail: user?.email,
		loading,
		onboardingCompleted: onboardingState.hasCompletedOnboarding,
		checkingOnboarding: onboardingState.isCheckingOnboardingStatus,
	});

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
