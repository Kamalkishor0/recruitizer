"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useCandidateAssignments, type CandidateAssignment } from "@/hooks/useCandidateAssignments";
import useAuth from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/assignments";

type StartedTestPayload = {
  assignedId?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  expiresAt?: string;
  interviewTemplate?: {
    title?: string;
    description?: string;
    testType?: string;
    timeLimit?: number;
    totalMarks?: number;
    questions?: Array<{
      _id?: string;
      prompt?: string;
      description?: string;
      options?: string[];
      marks?: number;
    }>;
  };
};

type StartResponse = {
  message?: string;
  assignedTest?: StartedTestPayload;
  error?: string;
};

export default function StartInterviewPage() {
  const { assignedId } = useParams<{ assignedId: string }>();
  const router = useRouter();
  const { user, loading: authLoading, error: authError, refresh } = useAuth();
  const { assignments, loading, error } = useCandidateAssignments(!!user);
  const [startError, setStartError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      refresh();
    }
  }, [user, authLoading, refresh]);

  const assignment = useMemo<CandidateAssignment | undefined>(
    () => assignments.find((item) => (item.assignedId || item._id) === assignedId),
    [assignments, assignedId],
  );

  const expiresAt = assignment?.expiresAt ? new Date(assignment.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
  const statusLabel = assignment?.status ? ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status : "Scheduled";
  const jobTitle = assignment?.jobTitle || "Assigned role";
  const testType = assignment?.interviewTemplate?.testType || "multiple_choice";
  const timeLimit = assignment?.interviewTemplate?.timeLimit;
  const isFinished = assignment?.status === "completed" || assignment?.status === "passed" || assignment?.status === "failed";

  const conditions = [
    "Stay on this tab for the full duration — switching tabs may pause or cancel the attempt.",
    "Do not use external help (search, AI, or another person) during the interview.",
    "Ensure your internet connection and environment are stable before you begin.",
    "Once you start, the timer will continue running until it finishes.",
  ];

  const persistSession = (payload: StartedTestPayload | undefined) => {
    if (typeof window === "undefined" || !payload) return;
    sessionStorage.setItem(`currentTest-${assignedId}`, JSON.stringify(payload));
  };

  const handleStart = async () => {
    if (!user) {
      setStartError("Please sign in as a candidate to start this interview.");
      return;
    }
    if (isFinished) {
      setStartError("This interview has already been closed.");
      return;
    }
    setSubmitting(true);
    setStartError(null);
    try {
      const res = await fetch(`${API_BASE}/candidates/start-test/${user._id}/${assignedId}`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as StartResponse;
      if (!res.ok) {
        throw new Error(body.error || "Failed to start interview");
      }
      const payload = body.assignedTest || (body as unknown as StartedTestPayload);
      if (typeof window !== "undefined" && assignment?.status !== "in_progress") {
        sessionStorage.removeItem(`currentAnswers-${assignedId}`);
      }
      persistSession(payload);
      const type = payload?.interviewTemplate?.testType || testType || "multiple_choice";
      router.push(`/candidate/interviews/${assignedId}/quiz?type=${encodeURIComponent(type)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start interview";
      if (message.toLowerCase().includes("already started")) {
        const cached = typeof window !== "undefined" ? sessionStorage.getItem(`currentTest-${assignedId}`) : null;
        if (cached) {
          router.push(`/candidate/interviews/${assignedId}/quiz?type=${encodeURIComponent(testType)}`);
          return;
        }
      }
      setStartError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignedId) {
    return notFound();
  }

  if (authLoading || loading) {
    return (
      <main className="p-6">
        <p>Loading interview info...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Start interview</h1>
        <p className="text-rose-300">{authError}</p>
      </main>
    );
  }

  if (!user) {
    return notFound();
  }

  if (!assignment) {
    return (
      <main className="p-6 space-y-4 text-white">
        <h1 className="text-2xl font-semibold">Start interview</h1>
        {error ? <p className="text-rose-300">{error}</p> : <p className="text-slate-200">We could not find that assignment.</p>}
        
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-4xl flex-col gap-2 px-6 pb-6 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Interview start</p>
        <h1 className="text-3xl font-semibold">{jobTitle}</h1>
        <p className="text-sm text-slate-300">Status: {statusLabel}</p>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-6 pb-14">
        {(error || startError) && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {startError || error}
          </div>
        )}

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-indigo-500/10">
          <div className="flex flex-wrap gap-3 text-xs text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 capitalize">Type: {testType}</span>
            {assignment?.jobWorkType && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{assignment.jobWorkType}</span>}
            {assignment?.jobLocation && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{assignment.jobLocation}</span>}
            {assignment?.jobSeniority && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{assignment.jobSeniority}</span>}
            {timeLimit ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Time limit: {timeLimit} min</span> : null}
            {expiresAt ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Expires {expiresAt.toLocaleString()}</span> : null}
          </div>
          <p className="text-sm text-slate-200">
            Please review the guidelines below. You will be redirected to the appropriate workspace once you click start. The timer begins as soon as
            the workspace loads.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {conditions.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={submitting || isExpired || isFinished}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/60 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExpired ? "Expired" : isFinished ? "Closed" : assignment.status === "in_progress" ? "Resume interview" : "Start interview"}
            </button>
            <Link
              href={`/candidate/interviews/${assignedId}`}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
            >
              Back to details
            </Link>
          </div>
          {isExpired && <p className="text-xs text-amber-200">This assignment has expired. Please contact your recruiter for a new slot.</p>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-white">What happens next</h2>
          <ol className="mt-3 space-y-2">
            <li>1. We start your session and lock in the timer.</li>
            <li>2. You are routed to the workspace for {testType.replace("_", " ")} questions.</li>
            <li>3. When time runs out, the attempt auto-finishes.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
