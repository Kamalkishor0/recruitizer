"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

// Layout wrapper for candidate-only pages
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  // Keep the session fresh when candidate pages mount.
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Redirect recruiters away from candidate-only surfaces.
    if (user.role === "recruiter") {
      router.replace("/recruiter/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <main className="p-6">Loading...</main>;
  }

  if (!user || user.role === "recruiter") {
    // Avoid flashing content while redirecting.
    return null;
  }

  return <div>{children}</div>;
}