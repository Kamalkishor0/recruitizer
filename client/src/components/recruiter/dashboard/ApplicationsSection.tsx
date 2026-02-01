"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useRecruiterTemplates } from "@/hooks/useRecruiterTemplates";

export type Application = {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobLocation?: string;
  jobWorkType?: string;
  jobSeniority?: string;
  candidate?: { id?: string; name?: string; email?: string };
  status?: string;
  submittedAt?: string;
  confirmation?: boolean;
  additionalInfo?: string;
  extra?: {
    phone?: string;
    linkedin?: string;
    portfolio?: string;
    location?: string;
    salaryExpectation?: string;
  };
  resume?: { fileName?: string; mimeType?: string; size?: number };
};

export default function ApplicationsSection() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, Array<{ applicationId: string; candidateId?: string; candidateName?: string; candidateEmail?: string; submittedAt?: string }>>>({});
  const [recLoading, setRecLoading] = useState<Record<string, boolean>>({});
  const [recError, setRecError] = useState<Record<string, string | null>>({});
  const [topKByJob, setTopKByJob] = useState<Record<string, number>>({});
  const [assigningJob, setAssigningJob] = useState<string | null>(null);
  const [assignMessage, setAssignMessage] = useState<Record<string, string | null>>({});
  const [expiresAt, setExpiresAt] = useState<string>(() => toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [confirmJobId, setConfirmJobId] = useState<string | null>(null);

  const { templates, loading: templatesLoading, error: templatesError } = useRecruiterTemplates(true);
  const defaultTemplateId = templates.length ? templates[0].id : "";
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    if (templates.length && !selectedTemplateId) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [templates, selectedTemplateId, defaultTemplateId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/recruiters/applications`, { credentials: "include" });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.error || "Failed to load applications");
        }
        const body = await res.json();
        setApplications(body.applications ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load applications";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Application[]>();
    applications.forEach((app) => {
      const key = app.jobId || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    });
    return map;
  }, [applications]);

  const jobCards = useMemo(() => {
    return [...grouped.entries()].map(([jobId, apps]) => {
      const sample = apps[0];
      return {
        jobId,
        title: sample.jobTitle || "Untitled role",
        location: sample.jobLocation,
        workType: sample.jobWorkType,
        seniority: sample.jobSeniority,
        count: apps.length,
      };
    });
  }, [grouped]);

  useEffect(() => {
    if (!selectedJobId && jobCards.length) {
      setSelectedJobId(jobCards[0].jobId);
    }
  }, [selectedJobId, jobCards]);

  const fetchRecommendations = async (jobId: string, topK: number) => {
    setRecLoading((prev) => ({ ...prev, [jobId]: true }));
    setRecError((prev) => ({ ...prev, [jobId]: null }));
    try {
      const res = await fetch(`${API_BASE}/recruiters/jobs/${jobId}/recommendations?topK=${topK}`, { credentials: "include" });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || "Failed to load recommendations");
      }
      const body = await res.json();
      const recs = body.recommendations || [];
      setRecommendations((prev) => ({ ...prev, [jobId]: recs }));
      return recs as Array<{ applicationId: string; candidateId?: string; candidateName?: string; candidateEmail?: string; submittedAt?: string }>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load recommendations";
      setRecError((prev) => ({ ...prev, [jobId]: msg }));
      setRecommendations((prev) => ({ ...prev, [jobId]: [] }));
      return [];
    } finally {
      setRecLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const loadRecommendations = async (jobId: string) => {
    const topK = topKByJob[jobId] ?? 5;
    return fetchRecommendations(jobId, topK);
  };

  const runAssignment = async (jobId: string, options?: { forceExisting?: boolean }) => {
    const desired = topKByJob[jobId] ?? 5;
    const parsedExpiry = new Date(expiresAt);
    const forceExisting = options?.forceExisting ?? false;

    setAssigningJob(jobId);
    setConfirmJobId(null);
    setAssignMessage((prev) => ({ ...prev, [jobId]: null }));

    // Fetch a small buffer beyond desired to replace any already-assigned candidates.
    const bufferedRecs = await fetchRecommendations(jobId, desired + 5);
    const queue = [...bufferedRecs];

    if (!queue.length) {
      setAssigningJob(null);
      setAssignMessage((prev) => ({ ...prev, [jobId]: "No recommendations to assign." }));
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    let assigned = 0;
    const skippedAssigned: string[] = [];
    const otherFailures: Array<{ candidate?: string; error?: string }> = [];

    while (queue.length && assigned < desired) {
      const rec = queue.shift();
      if (!rec) break;
      try {
        const res = await fetch(`${API_BASE}/recruiters/assign-test`, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            candidateId: rec.candidateId,
            candidateEmail: rec.candidateEmail,
            interviewTemplate: selectedTemplateId,
            expireAt: parsedExpiry.toISOString(),
            force: forceExisting,
          }),
        });

        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          const msg = detail?.error || res.statusText;
          if (res.status === 409 && !forceExisting) {
            skippedAssigned.push(rec.candidateEmail || rec.candidateId || "candidate");
            continue;
          }
          otherFailures.push({ candidate: rec.candidateEmail || rec.candidateId, error: msg });
          continue;
        }

        assigned += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        otherFailures.push({ candidate: rec.candidateEmail || rec.candidateId, error: msg });
      }
    }

    const shortage = desired - assigned;
    const parts: string[] = [];
    parts.push(`Assigned ${assigned}/${desired}.`);
    if (skippedAssigned.length) {
      parts.push(`Skipped already-assigned: ${skippedAssigned.slice(0, 3).join(", ")}${skippedAssigned.length > 3 ? "…" : ""}`);
    }
    if (otherFailures.length) {
      const first = otherFailures[0];
      parts.push(`Other errors: ${first.error || "Unknown"}${first.candidate ? ` (${first.candidate})` : ""}`);
    }
    if (shortage > 0 && !queue.length) {
      parts.push("Ran out of candidates to reach Top K.");
    }

    setAssignMessage((prev) => ({ ...prev, [jobId]: parts.join(" ") }));
    setAssigningJob(null);
  };

  const assignTopForJob = (jobId: string) => {
    const desired = topKByJob[jobId] ?? 5;
    if (!selectedTemplateId) {
      setAssignMessage((prev) => ({ ...prev, [jobId]: "Select a template first." }));
      return;
    }
    const parsedExpiry = new Date(expiresAt);
    if (!expiresAt || Number.isNaN(parsedExpiry.getTime())) {
      setAssignMessage((prev) => ({ ...prev, [jobId]: "Pick a valid expiration date." }));
      return;
    }

    if (!(recommendations[jobId]?.length)) {
      setAssignMessage((prev) => ({ ...prev, [jobId]: "Fetch rankings first." }));
      return;
    }

    // Show modern inline confirmation card; actual assignment happens when user clicks confirm.
    setConfirmJobId(jobId);
    setAssignMessage((prev) => ({ ...prev, [jobId]: `Ready to assign Top ${desired}. Confirm to proceed.` }));
  };

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Applications</p>
          <h2 className="text-2xl font-semibold text-white">Per-job submissions</h2>
          <p className="text-sm text-slate-200/90">Review candidates who applied to your posted roles.</p>
        </div>
        {loading && <span className="text-sm text-slate-300">Loading...</span>}
      </div>

      {error && <p className="text-sm text-rose-200">{error}</p>}
      {!loading && applications.length === 0 && !error && <p className="text-sm text-slate-300">No applications yet.</p>}

      <div className="grid gap-4 lg:grid-cols-[0.55fr,1.45fr]">
        <div className="space-y-3">
          {jobCards.map((job) => {
            const active = job.jobId === selectedJobId;
            return (
              <button
                key={job.jobId}
                type="button"
                onClick={() => { setSelectedJobId(job.jobId); }}
                className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                  active ? "border-indigo-300/70 bg-indigo-950/50 shadow-indigo-500/20" : "border-white/10 bg-white/5 hover:border-indigo-300/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Job</p>
                    <h3 className="text-base font-semibold text-white">{job.title}</h3>
                    <p className="text-[11px] text-slate-300">{[job.location, job.workType, job.seniority].filter(Boolean).join(" • ") || "Details"}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-200">{job.count} app{job.count === 1 ? "" : "s"}</span>
                </div>
              </button>
            );
          })}
          {jobCards.length === 0 && !loading && <p className="text-sm text-slate-300">No jobs with applications yet.</p>}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/10">
          {selectedJobId ? (
            (() => {
              const apps = grouped.get(selectedJobId) || [];
              const job = apps[0];
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-indigo-200">Job</p>
                      <h3 className="text-xl font-semibold text-white">{job?.jobTitle || "Untitled role"}</h3>
                      <p className="text-xs text-slate-300">{[job?.jobLocation, job?.jobWorkType, job?.jobSeniority].filter(Boolean).join(" • ") || "Details"}</p>
                      <p className="text-[11px] text-slate-400">{apps.length} application{apps.length === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={topKByJob[selectedJobId] ?? 5}
                        onChange={(e) => setTopKByJob((prev) => ({ ...prev, [selectedJobId]: Number(e.target.value) }))}
                        className="w-20 rounded border border-white/15 bg-slate-900/80 px-2 py-1 text-sm text-white outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => loadRecommendations(selectedJobId)}
                        disabled={recLoading[selectedJobId]}
                        className="rounded border border-indigo-300/50 bg-indigo-500/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-indigo-200 hover:bg-indigo-500 disabled:opacity-60"
                      >
                        {recLoading[selectedJobId] ? "Ranking…" : "Fetch top K"}
                      </button>
                    </div>
                  </div>

                  {recError[selectedJobId] && <p className="text-sm text-rose-200">{recError[selectedJobId]}</p>}

                  <div className="divide-y divide-white/5 rounded-lg border border-white/10 bg-white/5">
                    {apps.map((app) => (
                      <div key={app.id} className="p-3 space-y-2">
                        <div className="flex w-full items-center justify-between gap-3 text-left">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">{app.candidate?.name || "Candidate"}</p>
                            <p className="text-xs text-slate-300">{app.candidate?.email}</p>
                          </div>
                          <div className="text-right text-xs text-slate-300">
                            <p className="font-semibold text-white">{app.status || "submitted"}</p>
                            <p>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "--"}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-200">
                          <span className="text-slate-300">{[job?.jobLocation, job?.jobWorkType, job?.jobSeniority].filter(Boolean).join(" • ")}</span>
                          <a
                            className="inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100"
                            href={`${API_BASE}/recruiters/applications/${app.id}/resume`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View resume
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-lg border border-indigo-400/20 bg-indigo-950/40 p-4">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-indigo-200">Similarity ranking</p>
                        <p className="text-sm text-slate-200">Top candidates for this job ranked by our machine learning model.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={topKByJob[selectedJobId] ?? 5}
                          onChange={(e) => setTopKByJob((prev) => ({ ...prev, [selectedJobId]: Number(e.target.value) }))}
                          className="w-20 rounded border border-white/15 bg-slate-900/80 px-2 py-1 text-sm text-white outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => loadRecommendations(selectedJobId)}
                          disabled={recLoading[selectedJobId]}
                          className="rounded border border-indigo-300/50 bg-indigo-500/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-indigo-200 hover:bg-indigo-500 disabled:opacity-60"
                        >
                          {recLoading[selectedJobId] ? "Ranking…" : "Fetch top K"}
                        </button>
                      </div>
                    </div>

                    {recError[selectedJobId] && <p className="text-sm text-rose-200">{recError[selectedJobId]}</p>}
                    {!recLoading[selectedJobId] && (recommendations[selectedJobId]?.length ?? 0) === 0 && !recError[selectedJobId] && (
                      <p className="text-sm text-slate-300">Run a fetch to see ranked candidates.</p>
                    )}

                    {(recommendations[selectedJobId] || []).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-sm text-slate-200">Template</label>
                          <select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="min-w-[220px] rounded border border-white/15 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                          >
                            {templatesLoading && <option value="">Loading…</option>}
                            {templatesError && <option value="">Templates unavailable</option>}
                            {!templatesLoading && !templatesError && templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.title} · {tpl.testType}
                              </option>
                            ))}
                          </select>
                          <label className="text-sm text-slate-200">Expires</label>
                          <input
                            type="datetime-local"
                            value={expiresAt}
                            min={toLocalInputValue(new Date())}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="rounded border border-white/15 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                          />
                          <button
                            type="button"
                            onClick={() => assignTopForJob(selectedJobId)}
                            disabled={assigningJob === selectedJobId || !recommendations[selectedJobId]?.length}
                            className="rounded border border-emerald-300/40 bg-emerald-500/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-emerald-200 hover:bg-emerald-500 disabled:opacity-60"
                          >
                            {assigningJob === selectedJobId ? "Assigning…" : "Assign to top"}
                          </button>
                        </div>
                        {confirmJobId === selectedJobId && (
                          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                            <div className="flex-1 min-w-[220px]">
                              <p className="font-semibold">Skip already-assigned and keep filling Top K?</p>
                              <p className="text-xs text-amber-50/90">We will skip candidates who already have this template and move to the next ranked ones.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setConfirmJobId(null); runAssignment(selectedJobId, { forceExisting: true }); }}
                                className="rounded border border-white/30 px-3 py-1 text-xs font-semibold text-white hover:border-white/60"
                              >
                                Assign anyway
                              </button>
                              <button
                                type="button"
                                onClick={() => runAssignment(selectedJobId)}
                                className="rounded border border-emerald-300/50 bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white hover:border-emerald-200 hover:bg-emerald-500"
                              >
                                Skip assigned & continue
                              </button>
                            </div>
                          </div>
                        )}
                        {assignMessage[selectedJobId] && <p className="text-sm text-slate-200">{assignMessage[selectedJobId]}</p>}

                        <div className="divide-y divide-white/5 overflow-hidden rounded border border-white/10 bg-white/5">
                          {(recommendations[selectedJobId] || []).map((rec) => (
                            <div key={rec.applicationId} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">{rec.candidateName || "Candidate"}</p>
                                <p className="text-xs text-slate-300">{rec.candidateEmail || "No email"}</p>
                                <p className="text-[11px] text-slate-400">Submitted {rec.submittedAt ? new Date(rec.submittedAt).toLocaleString() : "--"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-slate-300">Select a job to see its applications.</p>
          )}
        </div>
      </div>
    </section>
  );
}

const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16);
