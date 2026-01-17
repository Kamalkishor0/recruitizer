"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

// Layout wrapper for recruiter-only pages
export default function RecruiterLayout({ children }: { children: ReactNode }) {
	const { user, loading, refresh } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// Keep session fresh on layout mount
		refresh();
	}, [refresh]);

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace("/login");
			return;
		}
		if (user.role !== "recruiter") {
			router.replace("/candidate/dashboard");
		}
	}, [user, loading, router]);

	if (loading) {
		return <main className="p-6">Loading...</main>;
	}

	if (!user || user.role !== "recruiter") {
		// Avoid flashing content before redirect completes
		return null;
	}

	return <div>{children}</div>;
}
