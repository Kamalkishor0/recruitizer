"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type User = {
	_id: string;
	email: string;
	role?: string;
	fullName?: string;
};

type AuthContextValue = {
	user: User | null;
	loading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<User | null>;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const persistUser = useCallback((nextUser: User | null) => {
		setUser(nextUser);
		if (nextUser) {
			localStorage.setItem("user", JSON.stringify(nextUser));
		} else {
			localStorage.removeItem("user");
		}
	}, []);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE}/auth/me`, {
				credentials: "include",
			});

			if (!res.ok) {
				persistUser(null);
				return;
			}

			const body = (await res.json()) as { user?: User };
			persistUser(body.user ?? null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load user";
			setError(message);
			persistUser(null);
		} finally {
			setLoading(false);
		}
	}, [persistUser]);

	const login = useCallback(async (email: string, password: string) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE}/auth/signin`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Login failed");
			}

			const data = (await res.json()) as { token?: string; user?: User };

			if (data?.token) {
				localStorage.setItem("token", data.token);
			} else {
				localStorage.removeItem("token");
			}

			persistUser(data?.user ?? null);
			return data?.user ?? null;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Login failed";
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [persistUser]);

	const logout = useCallback(async () => {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				credentials: "include",
			});
		} catch {
			// Best-effort logout; ignore network errors
		} finally {
			persistUser(null);
			localStorage.removeItem("token");
		}
	}, [persistUser]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return (
		<AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return ctx;
}
