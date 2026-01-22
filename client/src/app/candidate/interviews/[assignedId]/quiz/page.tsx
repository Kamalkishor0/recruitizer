"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api";

type StoredQuestion = {
  _id?: string;
  prompt?: string;
  description?: string;
  options?: string[];
  difficulty?: string;
  marks?: number;
};

type StoredTemplate = {
  title?: string;
  description?: string;
  testType?: string;
  timeLimit?: number;
  questions?: StoredQuestion[];
};

type StoredTest = {
  assignedId?: string;
  status?: string;
  startTime?: string;
  expiresAt?: string;
  interviewTemplate?: StoredTemplate;
};

const formatTime = (seconds: number) => {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const secs = (clamped % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function QuizWorkspacePage() {
  const { assignedId } = useParams<{ assignedId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();
  const [testData, setTestData] = useState<StoredTest | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});

  const computeRemaining = (payload: StoredTest | null) => {
    const limit = payload?.interviewTemplate?.timeLimit;
    if (!limit || limit <= 0) return 0;
    const started = payload?.startTime ? Date.parse(payload.startTime) : null;
    if (!started || Number.isNaN(started)) {
      return limit * 60;
    }
    const elapsedSec = Math.max(0, Math.floor((Date.now() - started) / 1000));
    const remaining = Math.max(0, limit * 60 - elapsedSec);
    return remaining;
  };

  useEffect(() => {
    if (typeof window === "undefined" || !assignedId) return;
    const raw = sessionStorage.getItem(`currentTest-${assignedId}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredTest;
      setTestData(parsed);
      const savedAnswers = sessionStorage.getItem(`currentAnswers-${assignedId}`);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers) as Record<string, number | null>;
        setAnswers(parsedAnswers);
      }
      const remaining = computeRemaining(parsed);
      setTimeLeft(remaining);
    } catch {
      // Ignore malformed cache
    }
  }, [assignedId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timeLeft]);

  const testType = useMemo(() => {
    const typeFromUrl = searchParams.get("type");
    return testData?.interviewTemplate?.testType || typeFromUrl || "multiple_choice";
  }, [searchParams, testData]);

  const questions = testData?.interviewTemplate?.questions || [];
  const templateTitle = testData?.interviewTemplate?.title || "Interview workspace";
  const hasTimer = Boolean(testData?.interviewTemplate?.timeLimit && testData.interviewTemplate.timeLimit > 0);
  const timeUp = hasTimer && timeLeft === 0;
  const submitted = testData?.status === "completed" || testData?.status === "passed" || testData?.status === "failed";
  const totalQuestions = questions.length;
  const activeQuestion = questions[currentIndex];
  const activeQuestionId = activeQuestion?._id || `q-${currentIndex}`;
  const activeAnswer = activeQuestion ? answers[activeQuestionId] ?? null : null;

  useEffect(() => {
    if (currentIndex >= totalQuestions && totalQuestions > 0) {
      setCurrentIndex(totalQuestions - 1);
    }
  }, [currentIndex, totalQuestions]);

  const persistAnswers = (next: Record<string, number | null>) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(`currentAnswers-${assignedId}`, JSON.stringify(next));
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted || timeUp) return;
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionIdx };
      persistAnswers(next);
      return next;
    });
  };

  const submitResponses = async () => {
    if (!user || !assignedId) return;
    const payloads = questions
      .map((question, idx) => {
        const qid = question._id;
        const ans = answers[qid || `q-${idx}`];
        if (qid && ans !== null && ans !== undefined) {
          return { questionId: qid, answer: String(ans) };
        }
        return null;
      })
      .filter(Boolean) as { questionId: string; answer: string }[];

    if (payloads.length === 0) return;

    await Promise.all(
      payloads.map(async ({ questionId, answer }) => {
        const res = await fetch(`${API_BASE}/submit/${assignedId}/${questionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answer }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || "Failed to save answer");
        }
      }),
    );
  };

  const handleSubmit = async (reason?: "manual" | "time_up") => {
    if (!user || !assignedId || finishing || submitted) return;
    setFinishing(true);
    setSubmitError(null);
    try {
      await submitResponses();
      const res = await fetch(`${API_BASE}/candidates/finish-test/${user._id}/${assignedId}`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || "Failed to submit interview");
      }
        setTimeLeft(0);
        setTestData((prev) => {
          const next = prev ? { ...prev, status: "completed" } : prev;
          if (typeof window !== "undefined" && next) {
            sessionStorage.setItem(`currentTest-${assignedId}`, JSON.stringify(next));
          }
          return next;
        });
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`currentAnswers-${assignedId}`);
        }
        router.push("/candidate/dashboard?tab=interviews");
    } catch (err) {
      if (reason === "time_up") {
        // If time-up submission fails, keep showing time-up and error.
      }
      const message = err instanceof Error ? err.message : "Failed to submit interview";
      setSubmitError(message);
    } finally {
      setFinishing(false);
    }
  };

  useEffect(() => {
    if (timeUp && !submitted) {
      void handleSubmit("time_up");
    }
  }, [timeUp, submitted]);

  if (authLoading) {
    return (
      <main className="p-6">
        <p>Loading workspace...</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Interview workspace</h1>
        <p className="text-rose-300">{authError}</p>
      </main>
    );
  }

  if (!user) {
    return notFound();
  }

  if (!testData) {
    return (
      <main className="p-6 space-y-4 text-white">
        <h1 className="text-2xl font-semibold">Interview workspace</h1>
        <p className="text-slate-200">We need a started session to load questions. Start the interview again to continue.</p>
        <div className="flex gap-3">
          <Link
            href={`/candidate/interviews/${assignedId}/start`}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Go to start screen
          </Link>
          <Link
            href="/candidate/dashboard?tab=interviews"
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
          >
            Back to list
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <header className="mx-auto flex max-w-5xl flex-col gap-2 px-6 pb-6 pt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Interview workspace</p>
        <h1 className="text-3xl font-semibold">{templateTitle}</h1>
        <p className="text-sm text-slate-300">Mode: {testType.replace("_", " ")} (prototype)</p>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-6 pb-14">
        {submitError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {submitError}
          </div>
        )}
        {submitted && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-50">
            Interview submitted. You can return to the details page.
          </div>
        )}
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-indigo-500/10">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">Status: {testData.status || "in_progress"}</span>
          {hasTimer ? (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-100">
              Time left: {formatTime(timeLeft)}
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100">No timer configured</span>
          )}
          {timeUp && <span className="rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">Time is up</span>}
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Question</h2>
            {totalQuestions > 0 && (
              <span className="text-sm text-slate-200">
                {currentIndex + 1} / {totalQuestions}
              </span>
            )}
          </div>
          {questions.length === 0 && <p className="text-sm text-slate-300">No questions were delivered with this template.</p>}
          {activeQuestion && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Q{currentIndex + 1}. {activeQuestion.prompt || "Question prompt"}</p>
                {activeQuestion.marks ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-100">{activeQuestion.marks} pts</span>
                ) : null}
              </div>
              {activeQuestion.description && <p className="mt-2 text-sm text-slate-200">{activeQuestion.description}</p>}
              {activeQuestion.options && activeQuestion.options.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-slate-100">
                  {activeQuestion.options.map((option, idx) => {
                    const isSelected = activeAnswer === idx;
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => handleSelectOption(activeQuestionId, idx)}
                          disabled={submitted || timeUp}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                              : "border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-pressed={isSelected}
                        >
                          <span
                            className={`grid h-5 w-5 place-items-center rounded border text-[10px] font-semibold ${
                              isSelected ? "border-emerald-300 bg-emerald-400/20 text-emerald-50" : "border-white/30 bg-white/10 text-white"
                            }`}
                            aria-hidden
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{option}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {questions.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0 || submitted || timeUp}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
                disabled={currentIndex >= totalQuestions - 1 || submitted || timeUp}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
              {currentIndex === totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={() => handleSubmit("manual")}
                  disabled={submitted || finishing}
                  className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/70 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitted ? "Submitted" : finishing ? "Submitting..." : "Submit interview"}
                </button>
              )}
              {timeUp && !submitted && <span className="text-xs text-amber-200">Time is up; submitting now.</span>}
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-100">
          <Link
            href={`/candidate/interviews/${assignedId}`}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold transition hover:border-white/20 hover:bg-white/15"
          >
            Back to details
          </Link>
        </div>
      </main>
    </div>
  );
}
