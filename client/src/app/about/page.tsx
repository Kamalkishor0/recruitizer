import Navbar from "@/components/layout/Navbar";

const recruiterSteps = [
  "Create and save a template: add modules, time limits, reference solutions, and a role-specific rubric.",
  "From Templates → Create Assignment: choose the template, set due dates and visibility, then save.",
  "Select candidates (from workspace or by email), personalize the invite, and send the branded link.",
  "When submissions arrive, review auto-scores, select candidates,get their emails with single click.",
];

const candidateSteps = [
  "Track your scheduled or completed interviews",
  "Give tests in a distraction-free environment with a built-in code editor(coming soon) and timer.",
  "Submit your answers before the deadline.",
  "Receive updates of your interview status by recruiter on your dashboard.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">About</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Structured interviews for every participant</h1>
          <p className="text-base text-slate-300">
            Build transparent hiring experiences where recruiters control the template, candidates know what to expect, and
            every evaluation stays fair and auditable.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">Recruiter playbook</p>
            </div>
            <ol className="space-y-3 text-sm text-slate-200">
              {recruiterSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="text-indigo-400">0{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">Candidate steps</p>
            </div>
            <ol className="space-y-3 text-sm text-slate-200">
              {candidateSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="text-emerald-400">0{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}