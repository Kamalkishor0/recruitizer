"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { RecruiterTemplate } from "@/hooks/useRecruiterTemplates";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type AssignInterviewFormProps = {
    templates: RecruiterTemplate[];
    loading?: boolean;
    error?: string | null;
    onReloadTemplates?: () => void;
    onAssigned?: () => void;
};

const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16);

export default function AssignInterviewForm({ templates, loading = false, error = null, onReloadTemplates, onAssigned }: AssignInterviewFormProps) {
    const [candidateEmail, setCandidateEmail] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<string>(() => toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const sortedTemplates = useMemo(() => [...templates].sort((a, b) => a.title.localeCompare(b.title)), [templates]);

    useEffect(() => {
        if (!sortedTemplates.length) {
            setSelectedTemplateId("");
            return;
        }
        setSelectedTemplateId((current) => {
            const exists = current && sortedTemplates.some((tpl) => tpl.id === current);
            if (exists && current) return current;
            return sortedTemplates[0].id;
        });
    }, [sortedTemplates]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setSuccessMessage(null);

        if (!candidateEmail.trim()) {
            setFormError("Candidate email is required.");
            return;
        }
        if (!selectedTemplateId) {
            setFormError("Select an interview template.");
            return;
        }
        const parsedExpiry = new Date(expiresAt);
        if (!expiresAt || Number.isNaN(parsedExpiry.getTime())) {
            setFormError("Pick a valid expiration date and time.");
            return;
        }

        setSubmitting(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/recruiters/assign-test`, {
                method: "POST",
                credentials: "include",
                headers,
                body: JSON.stringify({
                    candidateEmail: candidateEmail.trim(),
                    interviewTemplate: selectedTemplateId,
                    expireAt: parsedExpiry.toISOString(),
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to assign interview.");
            }

            setSuccessMessage("Interview assigned. Pending candidate start.");
            setCandidateEmail("");
            setExpiresAt(toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
            onAssigned?.();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to assign interview.";
            setFormError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Assign</p>
                    <h3 className="text-lg font-semibold text-white">Send an interview template</h3>
                    <p className="text-sm text-slate-300">Placeholder flow: resolve a candidate by email and attach a template.</p>
                </div>
                {onReloadTemplates && (
                    <button
                        type="button"
                        onClick={onReloadTemplates}
                        className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
                    >
                        Refresh templates
                    </button>
                )}
            </div>

            <div className="mt-3 space-y-2">
                {loading && <p className="text-sm text-slate-300">Loading templates…</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
                {!loading && !error && !sortedTemplates.length && <p className="text-sm text-slate-300">Create a template before assigning.</p>}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <label className="space-y-2 text-sm">
                    <span className="text-slate-200">Candidate email</span>
                    <input
                        type="email"
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
                    />
                </label>

                <label className="space-y-2 text-sm">
                    <span className="text-slate-200">Interview template</span>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
                    >
                        {sortedTemplates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                                {tpl.title} · {tpl.testType}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm">
                    <span className="text-slate-200">Expires at</span>
                    <input
                        type="datetime-local"
                        value={expiresAt}
                        min={toLocalInputValue(new Date())}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
                    />
                    <p className="text-xs text-slate-400">Candidates must start before this time. Defaults to 7 days out.</p>
                </label>

                {formError && <p className="text-sm text-red-400">{formError}</p>}
                {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={submitting || !sortedTemplates.length}
                        className="rounded-lg border border-indigo-400/50 bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Assigning…" : "Assign interview"}
                    </button>
                    <p className="text-xs text-slate-400">We will add integrations later; this uses candidate email as a placeholder.</p>
                </div>
            </form>
        </div>
    );
}
