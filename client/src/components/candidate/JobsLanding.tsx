"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import Link from "next/link";

type Job = {
  _id: string;
  recruiterName?: string;
  seniority?: string;
  title?: string;
  description?: string;
  score?: number;
  workType?: string;
  location?: string;
  skills?: string[];
  applied?: boolean;
};

export default function JobsLanding() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const fetchFallbackJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/candidates/jobs`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load jobs");
      }
      const data = await res.json();
      setJobs((data.jobs ?? []) as Job[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load jobs";
      setError((prev) => prev ?? msg);
    }
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/candidates/recommendations`, { credentials: "include" });

        if (res.status === 404) {
          setError("Upload a resume to see personalized job recommendations.");
          await fetchFallbackJobs();
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load recommendations");
        }

        const data = await res.json();
        const recommendations = (data?.recommendations ?? []).map((item: { job: Job; score?: number }) => ({
          ...item.job,
          score: item.score,
        }));

        if (recommendations.length === 0) {
          setError("No recommendations found yet. Showing available jobs.");
          await fetchFallbackJobs();
          return;
        }

        setJobs(recommendations);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load recommendations";
        setError(msg);
        await fetchFallbackJobs();
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [fetchFallbackJobs]);

  useEffect(() => {
    setPage(1);
  }, [jobs.length]);

  const totalPages = useMemo(() => (jobs.length === 0 ? 1 : Math.ceil(jobs.length / pageSize)), [jobs.length, pageSize]);
  const currentPage = Math.min(page, totalPages);
  const visibleJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return jobs.slice(start, start + pageSize);
  }, [currentPage, jobs, pageSize]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Jobs</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">AI Recommended jobs for you</h2>
      <p className="mt-2 text-sm text-slate-200/90">Personalized matches based on your uploaded resume.</p>
      {loading && <p className="mt-3 text-sm text-slate-200">Loading jobs...</p>}
      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {jobs.length === 0 && !loading && <p className="text-sm text-slate-300">No jobs yet.</p>}
        {visibleJobs.map((job) => (
          <div key={job._id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 shadow-inner shadow-black/15">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-200/90">
              <p className="rounded-lg bg-white/10 px-2 py-1 font-semibold text-emerald-100">{job.recruiterName || "Recruiter"}</p>
              <p className="uppercase tracking-[0.16em] text-emerald-200">{job.seniority || "Role"}</p>
            </div>
            <h3 className="text-lg font-semibold text-white">{job.title}</h3>
            <p className="line-clamp-3 text-slate-200/90">{job.description}</p>
            <br />
            {job.workType && <p className="text-xs text-slate-300">Type: {job.workType}</p>}
            {job.location && <p className="text-xs text-slate-300">Location: {job.location}</p>}
            {job.skills?.length ? <p className="text-xs text-slate-300">Skills: {job.skills.join(", ")}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {job.applied ? (
                <span className="inline-flex items-center rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100">
                  Applied
                </span>
              ) : (
                <Link
                  href={`/candidate/jobs/${job._id}/apply`}
                  className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
                >
                  Apply
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      {jobs.length > 0 && totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
