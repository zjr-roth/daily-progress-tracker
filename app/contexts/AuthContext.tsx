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
			setUser(user);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = async (email: string, password: string) => {
		setLoading(true);
		try {
			await AuthService.signIn({ email, password });
		} catch (error) {
			setLoading(false);
			throw error;
		}
	};

	const signUp = async (
		email: string,
		password: string,
		fullName: string
	) => {
		setLoading(true);
		try {
			await AuthService.signUp({ email, password, fullName });
		} catch (error) {
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
		await AuthService.resetPassword(email);
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
