"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { API_BASE } from "@/lib/api";
// Similar to struct in C or class in java
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
	login: (email: string, password: string) => Promise<User | null>;  //Signature of login function
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
};
// context will work only when used within a provider
// they are not global like redux store but scoped to the provider (lets say a global one for that)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// It has runs once when the component is mounted 
	// Does not have any dependencies so it will not re-run
	const persistUser = useCallback((nextUser: User | null) => {
		setUser(nextUser);
		if (nextUser) {
			localStorage.setItem("user", JSON.stringify(nextUser));
		} else {
			localStorage.removeItem("user");
		}
	}, []);

	// It will run whenever the 'persistUser' function changes
	// It is used to fetch the current user data from the server
	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
			const headers: Record<string, string> = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			const res = await fetch(`${API_BASE}/auth/me`, {
				credentials: "include", //By default, fetch does not send cookies cross-origin requests
				headers,
			});

			if (res.status === 401 || res.status === 403) {
				persistUser(null);
				return;
			}

			if (!res.ok) {
				const message = `Refresh failed (${res.status})`;
				setError(message);
				return;
			}

			const body = (await res.json()) as { user?: User };
			persistUser(body.user ?? null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load user";
			setError(message);
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
		const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
		if (storedUser) {
			try {
				persistUser(JSON.parse(storedUser) as User);
			} catch {
				persistUser(null);
			}
		}
		refresh();
	}, [refresh, persistUser]);

	return (
		// Providing the context value to child components
		<AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	// Custom hook to use the AuthContext
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return ctx;
}
