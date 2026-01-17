import Link from "next/link";

import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <Navbar />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[140px]" />
        </div>

        <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 lg:flex lg:items-center lg:gap-12">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Hire faster, fairly</p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Structured, AI-assisted interviews for recruiters and candidates.
              </h1>
              <p className="text-lg text-slate-200 sm:text-xl">
                Design consistent interview flows, auto-score submissions, and give candidates a transparent way to practice before the real conversation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5"
              >
                Sign in
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:text-white"
              >
                See how it works
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-white">92%</p>
                <p className="text-sm text-slate-300">Less time coordinating screening calls</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-white">Real-time</p>
                <p className="text-sm text-slate-300">Auto-scoring across coding, behavioral, and MCQ</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-white">Two modes</p>
                <p className="text-sm text-slate-300">Recruiter dashboards and candidate practice</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex-1 lg:mt-0">
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-indigo-500/10">
              <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
              <div className="absolute -right-12 bottom-6 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Next interview template</p>
                  <span className="text-xs rounded-full bg-indigo-500/30 px-3 py-1 text-indigo-100">Live draft</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm font-semibold text-indigo-200">Coding</p>
                    <p className="text-sm text-slate-200">Timed editor, language-aware scoring, and hints.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm font-semibold text-indigo-200">Behavioral</p>
                    <p className="text-sm text-slate-200">Calibrated rubrics for consistent evaluations.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm font-semibold text-indigo-200">MCQ</p>
                    <p className="text-sm text-slate-200">Mix of difficulty levels with instant grading.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm font-semibold text-indigo-200">Score sheet</p>
                    <p className="text-sm text-slate-200">Automatic summaries and coaching notes.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Invite sent</p>
                    <p className="text-xs text-slate-300">Candidate receives a guided test link</p>
                  </div>
                  <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-100">Ready</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Built for both sides</p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Recruiter control, candidate clarity</h2>
            </div>
            <Link
              href="/register"
              className="text-sm font-semibold text-indigo-200 transition hover:text-white"
            >
              Create your workspace →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Recruiters</p>
                <span className="text-xs rounded-full bg-white/10 px-3 py-1 text-slate-100">Operate</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Launch role-specific templates in minutes.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Track submissions, scores, and rubric notes in one dashboard.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Automate invites, reminders, and interviewer assignments.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Export structured feedback to your ATS.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Candidates</p>
                <span className="text-xs rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100">Practice</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Guided coding, behavioral, and multiple-choice sessions.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Live code editor with test cases and timed checkpoints.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Score breakdowns and coaching notes after submission.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Rehearse as many times as you want before an invite.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">A clean, predictable interview loop</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-indigo-200">1. Configure</p>
              <p className="mt-2 text-sm text-slate-200">Select coding, behavioral, or MCQ modules, set timers, and define rubrics.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-indigo-200">2. Invite</p>
              <p className="mt-2 text-sm text-slate-200">Send a branded link; candidates complete guided sessions on their time.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-indigo-200">3. Score</p>
              <p className="mt-2 text-sm text-slate-200">Review auto-scores, add qualitative notes, and compare candidates fairly.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/40 via-indigo-500/20 to-purple-500/30 p-8 text-center shadow-xl">
            <h3 className="text-2xl font-semibold text-white sm:text-3xl">Ready to streamline interviews?</h3>
            <p className="mt-3 text-sm text-slate-100 sm:text-base">
              Spin up your first template, invite a candidate, and see how structured hiring feels in under 10 minutes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Continue as recruiter
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Continue as candidate
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
