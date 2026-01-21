"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCandidateAssignments, type CandidateAssignment } from "@/hooks/useCandidateAssignments";
import useAuth from "@/hooks/useAuth";

const STATUS_LABEL: Record<CandidateAssignment["status"], string> = {
  pending: "Scheduled",
  in_progress: "Going on",
  completed: "Completed",
};

type StatusKey = keyof typeof STATUS_LABEL;

export default function CandidateInterviewsPage() {
  const { user, loading: authLoading, error: authError, refresh } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const initialStatus = (params.get("status") as StatusKey | null) ?? "in_progress";
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>(initialStatus);

  const {
    assignments,
    loading,
    error,
    reload,
  } = useCandidateAssignments(!!user);

  const statusBuckets = useMemo(() => {
    const buckets: Record<StatusKey, CandidateAssignment[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    assignments.forEach((item) => {
      buckets[item.status]?.push(item);
    });
    return buckets;
  }, [assignments]);

  if (authLoading) {
    return (
      <main className="p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <p className="text-red-400">{authError}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <p>Please log in to view your interviews.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-5xl flex-col gap-2 px-6 pb-6 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Interviews</p>
        <h1 className="text-3xl font-semibold">Your interview activity</h1>
        <p className="text-sm text-slate-300">Browse going-on, scheduled, and completed interviews. Click one to drill into its details.</p>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-6 pb-12">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(STATUS_LABEL) as StatusKey[]).map((statusKey) => {
            const count = statusBuckets[statusKey]?.length ?? 0;
            const isActive = selectedStatus === statusKey;
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => {
                  setSelectedStatus(statusKey);
                  router.replace(`/candidate/interviews?status=${statusKey}`);
                }}
                className={`flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/10 ${
                  isActive ? "ring-2 ring-indigo-300/60" : ""
                }`}
              >
                <span className="text-[12px] uppercase tracking-[0.18em] text-indigo-200">{STATUS_LABEL[statusKey]}</span>
                <span className="text-3xl font-semibold text-white">{count}</span>
                <span className="text-sm text-slate-200">Click to view list</span>
              </button>
            );
          })}
        </div>

        <AssignmentsTable
          status={selectedStatus}
          assignments={statusBuckets[selectedStatus] ?? []}
          loading={loading}
          onOpenDetail={(assignedId) => router.push(`/candidate/interviews/${assignedId}`)}
          onRefresh={reload}
        />
      </main>
    </div>
  );
}

type TableProps = {
  status: StatusKey;
  assignments: CandidateAssignment[];
  loading: boolean;
  onOpenDetail: (assignedId: string) => void;
  onRefresh: () => void;
};

function AssignmentsTable({ status, assignments, loading, onOpenDetail, onRefresh }: TableProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-indigo-500/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-indigo-200">{STATUS_LABEL[status]}</p>
          <h2 className="text-lg font-semibold text-white">Detailed list</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-200">
          {loading && <span>Loading...</span>}
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Refresh
          </button>
        </div>
      </div>

      {assignments.length === 0 && !loading ? (
        <p className="text-sm text-slate-300">No interviews in this state yet.</p>
      ) : null}

      <div className="divide-y divide-white/5">
        {assignments.map((item) => {
          const templateTitle = item.interviewTemplate?.title || "Untitled template";
          const created = item.createdAt ? new Date(item.createdAt).toLocaleString() : "";
          const expires = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : null;
          const assignedId = item.assignedId || item._id || "";
          return (
            <button
              key={assignedId}
              type="button"
              onClick={() => assignedId && onOpenDetail(assignedId)}
              className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-white">{templateTitle}</p>
                <p className="text-xs text-slate-300">Created {created}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Status: {STATUS_LABEL[item.status]}</span>
                {expires && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Expires {expires}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
