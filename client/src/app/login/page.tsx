"use client";

import LoginForm from "@/components/auth/LoginForm";
import Navbar from "@/components/layout/Navbar";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 lg:flex-row lg:items-start">
        <section className="lg:w-1/2 space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Welcome back</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Sign in to keep your interviews, templates, and scores in sync.
          </h1>
          <p className="text-lg text-slate-300">
            Use your account to manage interview flows, invite candidates, and continue where you left off.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-indigo-200">Secure by default</p>
              <p className="text-sm text-slate-200">Sessions stay encrypted and scoped by role.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-indigo-200">Fast access</p>
              <p className="text-sm text-slate-200">Jump straight to your recruiter or candidate dashboard.</p>
            </div>
          </div>
        </section>
        <section className="lg:w-1/2">
          <LoginForm />
        </section>
      </main>
    </div>
  );
}