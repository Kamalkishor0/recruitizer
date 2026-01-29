"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export default function JobsLanding() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFallbackJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/candidates/jobs`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load jobs");
      }
      const data = await res.json();
      setJobs(data.jobs ?? []);
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
        const recommendations = (data?.recommendations ?? []).map((item: any) => ({
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

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Jobs</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Recommended jobs for you</h2>
      <p className="mt-2 text-sm text-slate-200/90">Personalized matches based on your uploaded resume.</p>
      {loading && <p className="mt-3 text-sm text-slate-200">Loading jobs...</p>}
      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {jobs.length === 0 && !loading && <p className="text-sm text-slate-300">No jobs yet.</p>}
        {jobs.map((job) => (
          <div key={job._id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 shadow-inner shadow-black/15">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">{job.seniority || "Role"}</p>
            <h3 className="text-lg font-semibold text-white">{job.title}</h3>
            <p className="line-clamp-3 text-slate-200/90">{job.description}</p>
            {typeof job.score === "number" && (
              <p className="mt-1 text-xs text-emerald-200/90">Match score: {(job.score * 100).toFixed(1)}%</p>
            )}
            {job.workType && <p className="text-xs text-slate-300">Type: {job.workType}</p>}
            {job.location && <p className="text-xs text-slate-300">Location: {job.location}</p>}
            {job.skills?.length ? <p className="text-xs text-slate-300">Skills: {job.skills.join(", ")}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
