"use client";

import { useEffect, useMemo, useState } from "react";
import CandidateSidebar, { type CandidateTab } from "@/components/candidate/CandidateSidebar";
import { useCandidateAssignments, type CandidateAssignment } from "@/hooks/useCandidateAssignments";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type AssignmentStatus = "pending" | "in_progress" | "completed";
const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Scheduled",
  in_progress: "Going on",
  completed: "Completed",
};

// Candidate dashboard shell with tabbed sections
export default function CandidateDashboard() {
  const { user, loading, error, refresh, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<CandidateTab>("jobs");
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus>("in_progress");
  const router = useRouter();

  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useCandidateAssignments(!!user);

  const statusBuckets = useMemo(() => {
    const buckets: Record<AssignmentStatus, CandidateAssignment[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    assignments.forEach((item) => {
      buckets[item.status]?.push(item);
    });
    return buckets;
  }, [assignments]);

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
        <p className="text-red-400">{error}</p>
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

  if (user.role && user.role !== "candidate") {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Candidate Dashboard</h1>
        <p className="text-gray-700">You do not have access to candidate tools.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Welcome back</p>
          <h1 className="text-3xl font-semibold leading-tight text-white">Candidate dashboard</h1>
          <p className="text-sm text-slate-300">Use the sidebar to jump between jobs, scheduled interviews, and results.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-200">Signed in as</p>
            <p className="text-base font-semibold text-white">{user.fullName || user.email}</p>
          </div>
          <span className="h-10 w-px bg-white/10" aria-hidden />
          <button
            type="button"
            onClick={logout}
            className="rounded-xl px-3 py-2 font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl gap-6 px-6 pb-14">
        <CandidateSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <section className="flex-1 space-y-6">
          {activeTab === "jobs" && <JobsLanding />}
          {activeTab === "interviews" && (
            <InterviewsOverview
              loading={assignmentsLoading}
              error={assignmentsError}
              statusBuckets={statusBuckets}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              onOpenAssignment={(assignedId) => router.push(`/candidate/interviews/${assignedId}`)}
            />
          )}
          {activeTab === "results" && <ResultsOverview />}
        </section>
      </main>
    </div>
  );
}

function JobsLanding() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Jobs landing</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Jobs posted by recruiters</h2>
      <p className="mt-1 text-sm text-slate-300">
        When recruiters publish roles, they will appear here. For now, this space stays clean so we can wire it up next.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="h-32 rounded-xl border border-dashed border-emerald-200/30 bg-emerald-500/5 p-4 text-sm text-emerald-100/80"
          >
            <p className="font-semibold text-emerald-100">Upcoming job slot</p>
            <p className="mt-2 text-emerald-50/70">We will populate recruiter-posted jobs here with role details and apply actions.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type InterviewsOverviewProps = {
  loading: boolean;
  error: string | null;
  statusBuckets: Record<AssignmentStatus, CandidateAssignment[]>;
  selectedStatus: AssignmentStatus;
  onSelectStatus: (status: AssignmentStatus) => void;
  onOpenAssignment: (assignedId: string) => void;
};

function InterviewsOverview({ loading, error, statusBuckets, selectedStatus, onSelectStatus, onOpenAssignment }: InterviewsOverviewProps) {
  const [showChoices, setShowChoices] = useState(true);

  const tiles = useMemo(
    () => [
      {
        status: "in_progress" as const,
        label: "Going on",
        description: "Interviews you can resume right now",
        accent: "from-emerald-400/25 via-emerald-300/15 to-slate-900/70",
        badge: "Go",
        count: statusBuckets.in_progress.length,
      },
      {
        status: "pending" as const,
        label: "Scheduled",
        description: "Interviews that are scheduled and waiting to start",
        accent: "from-indigo-400/25 via-indigo-300/15 to-slate-900/70",
        badge: "Sc",
        count: statusBuckets.pending.length,
      },
      {
        status: "completed" as const,
        label: "Completed",
        description: "Interviews you have finished",
        accent: "from-amber-400/25 via-amber-300/15 to-slate-900/70",
        badge: "Co",
        count: statusBuckets.completed.length,
      },
    ],
    [statusBuckets],
  );

  return (
    <section className="space-y-5">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {showChoices && (
        <div className="grid gap-4 lg:grid-cols-3">
          {tiles.map((tile) => (
            <StatusTile
              key={tile.status}
              label={tile.label}
              description={tile.description}
              count={tile.count}
              badge={tile.badge}
              accent={tile.accent}
              active={selectedStatus === tile.status}
              loading={loading}
              onSelect={() => {
                onSelectStatus(tile.status);
                setShowChoices(false);
              }}
            />
          ))}
        </div>
      )}

      {!showChoices && (
        <StatusDetail
          status={selectedStatus}
          assignments={statusBuckets[selectedStatus] ?? []}
          loading={loading}
          onBack={() => setShowChoices(true)}
          onOpenAssignment={onOpenAssignment}
        />
      )}
    </section>
  );
}

type StatusTileProps = {
  label: string;
  description: string;
  count: number;
  badge: string;
  accent: string;
  active: boolean;
  loading: boolean;
  onSelect: () => void;
};

function StatusTile({ label, description, count, badge, accent, active, loading, onSelect }: StatusTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={loading}
      className={`group flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-5 text-left shadow-inner shadow-black/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 hover:border-white/20 hover:shadow-indigo-500/20 ${
        active ? "ring-2 ring-indigo-300/60" : ""
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-sm font-semibold text-white/90 ring-1 ring-white/20">{badge}</span>
      </div>
      <p className="text-3xl font-semibold text-white">{count}</p>
      <p className="text-sm text-slate-100/80">{description}</p>
      <span className="pointer-events-none inline-flex items-center gap-1 text-xs font-semibold text-indigo-100/90 opacity-0 transition group-hover:opacity-100">
        View details
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
        </svg>
      </span>
    </button>
  );
}

type StatusDetailProps = {
  status: AssignmentStatus;
  assignments: CandidateAssignment[];
  loading: boolean;
  onBack: () => void;
  onOpenAssignment: (assignedId: string) => void;
};

function StatusDetail({ status, assignments, loading, onBack, onOpenAssignment }: StatusDetailProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">{STATUS_LABEL[status]}</p>
          <h3 className="text-xl font-semibold text-white">Interviews in this state</h3>
          <p className="text-sm text-slate-300">Only the selected category is shown; other tiles are hidden.</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
        >
          Back to choices
        </button>
      </div>

      {loading && <p className="text-sm text-slate-200">Loading...</p>}
      {!loading && assignments.length === 0 && <p className="text-sm text-slate-300">No interviews in this state yet.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {assignments.map((item) => {
          const title = item.interviewTemplate?.title || "Untitled template";
          const assignedId = item.assignedId || item._id || "";
          const created = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";
          const expires = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : null;
          return (
            <div
              key={assignedId || title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/15"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-300">Created {created}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center mt-3 gap-2 text-xs text-slate-200">
                {expires && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Expires {expires}</span>}
                {item.startTime && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Starts {new Date(item.startTime).toLocaleString()}</span>}
              </div>
              <div className="flex mt-3">
                <button
                  type="button"
                  onClick={() => assignedId && onOpenAssignment(assignedId)}
                  className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
                >
                  Open details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsOverview() {
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Results</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Completed interview outcomes</h2>
        <p className="mt-1 text-sm text-slate-300">
          We will list your scores, feedback, and recruiter decisions here after each interview finishes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-slate-900/60 p-5">
          <p className="text-[12px] uppercase tracking-[0.16em] text-amber-50">Recent results</p>
          <h3 className="mt-1 text-lg font-semibold text-white">No completed interviews yet</h3>
          <p className="mt-2 text-sm text-slate-200/90">
            Once you finish interviews, we will surface scores, notes, and links to detailed feedback here.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-slate-900/60 p-5">
          <p className="text-[12px] uppercase tracking-[0.16em] text-emerald-50">Next steps</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Track offers and follow-ups</h3>
          <p className="mt-2 text-sm text-slate-200/90">
            We will add links to offer letters, follow-up interviews, and recruiter comments when available.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-50/90">
            <span className="rounded-full bg-white/10 px-3 py-1">Feedback feed</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Score breakdown</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Shareable summaries</span>
          </div>
        </div>
      </div>
    </section>
  );
}