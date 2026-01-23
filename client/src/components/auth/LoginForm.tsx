"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const loggedInUser = await login(email, password);
      const role = loggedInUser?.role || "candidate";
      const target = role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
      router.push(target);
    } catch {
      // error surfaced via auth context
    }
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <h2 className="text-3xl font-semibold text-white">Sign in</h2>
      <p className="mt-2 text-sm text-slate-300">Access your dashboards and pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-200">Work email</label>
          <input
            required
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
          <input
            required
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-sm text-slate-300">
          New here? <a href="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">Create an account</a>
        </p>
      </form>
    </div>
  );
}