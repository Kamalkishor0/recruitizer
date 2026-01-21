"use client";

import Link from "next/link";
import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { useCandidateAssignments } from "@/hooks/useCandidateAssignments";
import useAuth from "@/hooks/useAuth";

export default function CandidateInterviewDetailPage() {
  const { assignedId } = useParams<{ assignedId: string }>();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { assignments, loading, error, reload } = useCandidateAssignments(!!user);

  const match = useMemo(() => assignments.find((item) => (item.assignedId || item._id) === assignedId), [assignments, assignedId]);

  if (authLoading) {
    return (
      <main className="p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading interview details...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Interview details</h1>
        <p className="text-red-400">{authError}</p>
      </main>
    );
  }

  if (!user) {
    return notFound();
  }

  if (!match) {
    return (
      <main className="p-6 space-y-4 text-white">
        <h1 className="text-2xl font-semibold">Interview details</h1>
        {error ? (
          <p className="text-rose-300">Could not load this interview: {error}</p>
        ) : (
          <p className="text-slate-200">We could not find that interview yet. Try refreshing.</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Refresh
          </button>
          <Link
            href="/candidate/interviews"
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Back to interviews
          </Link>
        </div>
      </main>
    );
  }

  const templateTitle = match?.interviewTemplate?.title || "Untitled template";
  const description = match?.interviewTemplate?.description || "No description provided";
  const created = match?.createdAt ? new Date(match.createdAt).toLocaleString() : "";
  const expires = match?.expiresAt ? new Date(match.expiresAt).toLocaleString() : "";
  const startsAt = match?.startTime ? new Date(match.startTime).toLocaleString() : "";
  const endsAt = match?.endTime ? new Date(match.endTime).toLocaleString() : "";
  const status = match?.status ? match.status.replace("_", " ") : "";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-4xl flex-col gap-2 px-6 pb-6 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Interview details</p>
        <h1 className="text-3xl font-semibold">{templateTitle}</h1>
        <p className="text-sm text-slate-300">Status: {status}</p>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-6 pb-14">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-200">
          {loading && <span>Loading latest data…</span>}
          <button
            type="button"
            onClick={reload}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Refresh
          </button>
        </div>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-indigo-500/10">
          <p className="text-sm text-slate-200">{description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200">
            {created && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Created {created}</span>}
            {expires && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Expires {expires}</span>}
            {startsAt && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Starts {startsAt}</span>}
            {endsAt && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Ends {endsAt}</span>}
            {assignedId && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">ID: {assignedId}</span>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Next actions</h2>
          <p className="mt-2 text-sm text-slate-300">We will surface start/resume links, countdown timers, and checkpoints here.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-white opacity-70"
              aria-disabled
            >
              Start interview (coming soon)
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3 text-sm text-indigo-100">
          <Link href="/candidate/interviews" className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold transition hover:border-white/20 hover:bg-white/15">
            Back to interviews
          </Link>
          <Link href="/candidate/dashboard" className="text-indigo-200 underline-offset-4 hover:text-white hover:underline">
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
