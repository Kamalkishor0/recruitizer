import Link from "next/link";

import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
      <Navbar />

      <main className="relative overflow-hidden">

        <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 lg:flex lg:items-center lg:gap-12">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Hire faster, fairly</p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                AI-assisted and Structured interviews for recruiters and candidates.
              </h1>
              <p className="text-lg text-slate-200 sm:text-xl">
                Design and launch role-specific interview templates in minutes, automate scoring and review candidate submissions all in one place.
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
                <p className="text-2xl font-semibold text-white">Faster</p>
                <p className="text-sm text-slate-300">Fast and efficient interview process</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-white">Easy</p>
                <p className="text-sm text-slate-300">User-friendly interface and guided workflows</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-white">Two modes</p>
                <p className="text-sm text-slate-300">Recruiter and candidate dashboards</p>
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
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Launch AI-powered role-specific templates in minutes.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Track submissions, scores, and rubric notes in one dashboard.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Select candidates with single click.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Fast recruitment workflows.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Candidates</p>
                <span className="text-xs rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100">Practice</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Track your scheduled or completed interviews</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Give tests in a distraction-free environment with a built-in code editor(coming soon) and timer.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Submit your answers before the deadline.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />Receive updates of your interview status by recruiter on your dashboard.</li>
              </ul>
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
