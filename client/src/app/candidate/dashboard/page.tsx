"use client";

import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";

// Candidate dashboard
export default function CandidateDashboard() {
  const { user, loading, error, refresh, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      refresh();
    }
  }, [user, refresh]);

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Candidate Dashboard</h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Candidate Dashboard</h1>
        <p>Please log in to view your dashboard.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Signed in as</p>
          <h1 className="text-2xl font-semibold">{user.fullName || user.email}</h1>
          <p className="text-sm text-gray-500">Role: {user.role || "candidate"}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Welcome back!</h2>
        <p className="text-sm text-gray-600">This is where you can surface user-specific data once available (assigned tests, interview schedule, etc.).</p>
      </section>
    </main>
  );
}