"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AuthService } from "../lib/auth";

interface AuthContextType {
	user: User | null;
	loading: boolean;
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

		try {
			console.log("AuthContext: Calling AuthService.signIn");
			const result = await AuthService.signIn({ email, password });
			console.log("AuthContext: signIn completed successfully", result);

			// Don't set loading to false here - let the auth state change handle it
		} catch (error: any) {
			console.error("AuthContext: signIn failed with error:", error);
			console.error("AuthContext: Error message:", error.message);

			// Make sure loading is set to false on error
			setLoading(false);

			// Re-throw the error so the component can catch it
			throw error;
		}
	};

	const signUp = async (
		email: string,
		password: string,
		fullName: string
	) => {
		console.log("AuthContext: Starting signUp process");
		setLoading(true);

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
			throw error;
		}
	};

	const signOut = async () => {
		setLoading(true);
		try {
			await AuthService.signOut();
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	const resetPassword = async (email: string) => {
		try {
			await AuthService.resetPassword(email);
		} catch (error) {
			throw error;
		}
	};

	const value = {
		user,
		loading,
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
