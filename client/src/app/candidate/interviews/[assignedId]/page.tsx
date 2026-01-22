"use client";

import Link from "next/link";
import { useMemo } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useCandidateAssignments } from "@/hooks/useCandidateAssignments";
import useAuth from "@/hooks/useAuth";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/assignments";

export default function CandidateInterviewDetailPage() {
  const { assignedId } = useParams<{ assignedId: string }>();
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const { assignments, loading, error } = useCandidateAssignments(!!user);

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Interview details</h1>
            {error ? (
              <p className="text-rose-300">Could not load this interview: {error}</p>
            ) : (
              <p className="text-slate-200">We could not find that interview yet.</p>
            )}
          </div>
          <Link
            href="/candidate/dashboard?tab=interviews"
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Go to dashboard
          </Link>
        </div>
        <Link
          href="/candidate/dashboard?tab=interviews"
          className="inline-flex w-fit rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
        >
          Back to interviews
        </Link>
      </main>
    );
  }

  const templateTitle = match?.interviewTemplate?.title || "Untitled template";
  const description = match?.interviewTemplate?.description || "No description provided";
  const created = match?.createdAt ? new Date(match.createdAt).toLocaleString() : "";
  const expires = match?.expiresAt ? new Date(match.expiresAt).toLocaleString() : "";
  const startsAt = match?.startTime ? new Date(match.startTime).toLocaleString() : "";
  const endsAt = match?.endTime ? new Date(match.endTime).toLocaleString() : "";
  const status = match?.status ? ASSIGNMENT_STATUS_LABEL[match.status] ?? match.status : "";
  const expiresAt = match?.expiresAt ? new Date(match.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
  const canStart = match.status !== "completed" && !isExpired;
  const startLabel = match.status === "in_progress" ? "Resume interview" : "Start interview";
  const startPath = `/candidate/interviews/${assignedId}/start`;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-4xl flex-col gap-3 px-6 pb-6 pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Interview details</p>
          <h1 className="text-3xl font-semibold">{templateTitle}</h1>
          <p className="text-sm text-slate-300">Status: {status}</p>
        </div>
        <Link
          href="/candidate/dashboard?tab=interviews"
          className="self-start rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
        >
          Go to dashboard
        </Link>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-6 pb-14">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

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
          <p className="mt-2 text-sm text-slate-300">
            Start your interview to view the question set and timer. We will handle coding, multiple choice, and behavioral flows based on the
            template type.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canStart ? (
              <button
                type="button"
                onClick={() => router.push(startPath)}
                className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
              >
                {startLabel}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white opacity-60"
                aria-disabled
              >
                {isExpired ? "Assignment expired" : "Completed"}
              </button>
            )}
          </div>
          {isExpired && <p className="mt-2 text-xs text-amber-200">This interview assignment has expired.</p>}
        </section>

        <Link
          href="/candidate/dashboard?tab=interviews"
          className="inline-flex w-fit rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
        >
          Back to interviews
        </Link>
      </main>
    </div>
  );
}
