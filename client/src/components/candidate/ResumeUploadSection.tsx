"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

function openResumeFile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  fetch(`${API_BASE}/candidates/resume/file`, {
    credentials: "include",
    headers,
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch resume");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    })
    .catch((err) => {
      console.error("Failed to open resume:", err);
      alert("Failed to open resume. Please try again.");
    });
}

export default function ResumeUploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<null | { fileName: string; uploadedAt?: string; size?: number }>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidates/resume`, { credentials: "include", headers });
      if (res.status === 404) {
        setResume(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load resume");
      }
      const data = await res.json();
      setResume(data?.resume ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load resume";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Please choose a PDF resume to upload.");
      return;
    }
    if (!file.type.includes("pdf")) {
      setError("Only PDF resumes are supported right now.");
      return;
    }

    setUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const formData = new FormData();
      formData.append("file", file);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidates/resume`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to upload resume");
      }

      const data = await res.json();
      setResume(data?.resume ?? null);
      setSuccess("Resume uploaded successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload resume";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">Resume</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Upload your latest resume</h2>
      <p className="mt-2 text-sm text-slate-200/90">Your resume will be used for better job recommendations.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100/90">
          <span className="font-semibold text-white">Choose PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs text-slate-200"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload resume"}
          </button>

          {file && (
            <span className="text-xs text-slate-200/80">
              Ready to upload: {file.name} ({Math.round(file.size / 1024)} KB)
            </span>
          )}
        </div>
      </form>

      {loading && <p className="mt-3 text-sm text-slate-200">Checking your current resume...</p>}
      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-200">{success}</p>}

      {resume && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
          <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-200">Current resume on file</p>
          <p className="mt-2 text-base font-semibold text-white">{resume.fileName}</p>
          <p className="text-xs text-slate-300">Uploaded {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleString() : "recently"}</p>
          {resume.size && <p className="text-xs text-slate-400">Size: {Math.round(resume.size / 1024)} KB</p>}
          <button
            type="button"
            onClick={openResumeFile}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 hover:text-emerald-100"
          >
            View resume
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
