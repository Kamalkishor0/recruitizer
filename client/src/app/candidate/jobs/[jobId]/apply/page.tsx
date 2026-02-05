"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface JobDetail {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  skills?: string[];
  location?: string;
  workType?: string;
  seniority?: string;
  recruiterName?: string;
}

interface ResumeMeta {
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export default function ApplyToJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = useMemo(() => (Array.isArray(params?.jobId) ? params.jobId[0] : params?.jobId), [params]);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [resume, setResume] = useState<ResumeMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    phone: "",
    linkedin: "",
    portfolio: "",
    location: "",
    salaryExpectation: "",
    additionalInfo: "",
    confirmation: false,
  });

  useEffect(() => {
    const load = async () => {
      if (!jobId) {
        setError("Missing job id");
        setLoading(false);
        return;
      }

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const [jobRes, resumeRes] = await Promise.all([
          fetch(`${API_BASE}/candidates/jobs/${jobId}`, { credentials: "include", headers }),
          fetch(`${API_BASE}/candidates/resume`, { credentials: "include", headers }),
        ]);

        if (jobRes.status === 404) {
          throw new Error("Job not found or inactive");
        }
        if (!jobRes.ok) {
          throw new Error("Failed to load job");
        }
        const jobData = await jobRes.json();
        setJob(jobData.job);

        if (resumeRes.status === 404) {
          setResume(null);
        } else if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          setResume(resumeData.resume);
        } else {
          throw new Error("Failed to load resume");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    if (!form.confirmation) {
      setError("Please confirm your resume details are accurate.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidates/jobs/${jobId}/apply`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          confirmation: form.confirmation,
          additionalInfo: form.additionalInfo,
          extra: {
            phone: form.phone,
            linkedin: form.linkedin,
            portfolio: form.portfolio,
            location: form.location,
            salaryExpectation: form.salaryExpectation,
          },
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || "Failed to submit application");
      }

      setSuccess("Application submitted successfully.");
      setTimeout(() => router.push("/candidate/dashboard"), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit application";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-200">Loading...</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-slate-100">
        <p className="text-rose-200">{error}</p>
        <Link href="/candidate/dashboard" className="mt-3 inline-flex text-emerald-200">Back to dashboard</Link>
      </div>
    );
  }

  if (!job) {
    return <p className="text-slate-200">Job not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Apply</p>
          <h1 className="text-2xl font-semibold text-white">{job.title}</h1>
          <p className="text-sm text-slate-200/90">{job.recruiterName ? `Posted by ${job.recruiterName}` : "Job details"}</p>
        </div>
        <Link href="/candidate/dashboard" className="text-sm text-emerald-200 hover:text-emerald-100">Back</Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-semibold text-white">Review your resume details</h2>
        {resume ? (
          <div className="mt-2 text-sm text-slate-200">
            <p className="font-semibold">{resume.fileName}</p>
            <p className="text-slate-300">{resume.mimeType} • {(resume.size / 1024).toFixed(1)} KB</p>
            {resume.uploadedAt && <p className="text-xs text-slate-400">Uploaded {new Date(resume.uploadedAt).toLocaleString()}</p>}
            <a
              href={`${API_BASE}/candidates/resume/file`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-emerald-200 hover:text-emerald-100"
            >
              View resume
            </a>
          </div>
        ) : (
          <p className="mt-2 text-sm text-rose-200">No resume found. Please upload your resume before applying.</p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">Job summary</h2>
        <p className="text-sm text-slate-200/90">{job.description}</p>
        {job.requirements && <p className="text-sm text-slate-200/90">Requirements: {job.requirements}</p>}
        {job.skills?.length ? <p className="text-sm text-slate-200/90">Skills: {job.skills.join(", ")}</p> : null}
        {job.location && <p className="text-sm text-slate-200/90">Location: {job.location}</p>}
        {job.workType && <p className="text-sm text-slate-200/90">Type: {job.workType}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-100">
            <span className="text-slate-300">Phone</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span className="text-slate-300">LinkedIn</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={form.linkedin}
              onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/username"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span className="text-slate-300">Portfolio / GitHub</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={form.portfolio}
              onChange={(e) => setForm((p) => ({ ...p, portfolio: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span className="text-slate-300">Preferred location / remote</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span className="text-slate-300">Salary expectation</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={form.salaryExpectation}
              onChange={(e) => setForm((p) => ({ ...p, salaryExpectation: e.target.value }))}
              placeholder="$X or range"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm text-slate-100">
          <span className="text-slate-300">Additional information</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
            value={form.additionalInfo}
            onChange={(e) => setForm((p) => ({ ...p, additionalInfo: e.target.value }))}
            placeholder="Highlight achievements, role fit, or availability"
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-slate-100">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500"
            checked={form.confirmation}
            onChange={(e) => setForm((p) => ({ ...p, confirmation: e.target.checked }))}
          />
          <span className="text-slate-300">
            I confirm the details in my resume are accurate and up to date. I agree to share this information with the recruiter for this role.
          </span>
        </label>

        {error && <p className="text-sm text-rose-200">{error}</p>}
        {success && <p className="text-sm text-emerald-200">{success}</p>}

        <button
          type="submit"
          disabled={submitting || !resume}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit application"}
        </button>
      </form>
      </div>
    </div>
  );
}
