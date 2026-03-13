"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api";


type Role = "candidate" | "recruiter";

export default function RegisterForm() {
	//Nothing just destructuring to get loading state and rename it to authLoading
	const { loading: authLoading } = useAuth();
	// We are using these state so we can have controlled inputs
	// In other words, whenever the user types something, 
	// we update the state by rendering the component again
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState<Role>("candidate");
	const [formError, setFormError] = useState<string | null>(null);
	const [formMessage, setFormMessage] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		setFormMessage(null);
		
		//Only spaces is not allowed
		if (!fullName.trim() || !email.trim() || !password.trim()) {
			setFormError("Please fill out all required fields.");
			return;
		}

		if (password !== confirmPassword) {
			setFormError("Passwords do not match.");
			return;
		}

		setSubmitting(true);

		try {
			const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ fullName, email, password, role }),
			});

			if (!signupResponse.ok) {
				const body = await signupResponse.json().catch(() => ({}));
				throw new Error(body.error || "Could not create account.");
			}

			const body = await signupResponse.json().catch(() => ({}));
			setFormMessage(body.message || "Account created. Please verify your email (may be in spam) before signing in.");
			setFullName("");
			setEmail("");
			setPassword("");
			setConfirmPassword("");
			return;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
			setFormError(message);
		} finally {
			setSubmitting(false);
		}
	};
	// Disable the form while submitting or auth context is loading
	//Avoid multiple clicks
	const disabled = submitting || authLoading;

	return (
		<div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
			<h2 className="text-3xl font-semibold text-white">Create your account</h2>
			<p className="mt-2 text-sm text-slate-300">Tell us who you are to tailor your interview flow.</p>
			<p className="mt-2 text-sm text-slate-300">(It might take a minute, free plan issue while processing)</p>
			<form onSubmit={handleSubmit} className="mt-8 space-y-5">
				<div className="space-y-2">
					<label htmlFor="fullName" className="block text-sm font-medium text-slate-200">Full name</label>
					<input
						required
						type="text"
						id="fullName"
						name="fullName"
						value={fullName}
						onChange={(event) => setFullName(event.target.value)}
						placeholder="Alex Johnson"
						className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
					/>
				</div>

				<div className="space-y-2">
					<label htmlFor="email" className="block text-sm font-medium text-slate-200">Work email</label>
					<input
						required
						type="email"
						id="email"
						name="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="you@company.com"
						className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
					/>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					<div className="space-y-2">
						<label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
						<input
							required
							type="password"
							id="password"
							name="password"
							minLength={6}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="••••••••"
							className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">Confirm password</label>
						<input
							required
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							minLength={6}
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							placeholder="••••••••"
							className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
						/>
					</div>
				</div>

				<div className="space-y-3">
					<p className="text-sm font-medium text-slate-200">I am registering as</p>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition ${role === "candidate" ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
							<div>
								<p className="font-semibold text-white">Candidate</p>
								<p className="text-xs text-slate-300">Take assessments and track results.</p>
							</div>
							<input
								type="radio"
								name="role"
								id="role-candidate"
								value="candidate"
								checked={role === "candidate"}
								onChange={() => setRole("candidate")}
								className="h-4 w-4 text-indigo-500 focus:ring-indigo-500"
							/>
						</label>
						<label className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition ${role === "recruiter" ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
							<div>
								<p className="font-semibold text-white">Recruiter</p>
								<p className="text-xs text-slate-300">Build interviews and score submissions.</p>
							</div>
							<input
								type="radio"
								name="role"
								id="role-recruiter"
								value="recruiter"
								checked={role === "recruiter"}
								onChange={() => setRole("recruiter")}
								className="h-4 w-4 text-indigo-500 focus:ring-indigo-500"
							/>
						</label>
					</div>
				</div>

				{formError ? <p className="text-sm text-rose-400">{formError}</p> : null}
				{formMessage ? <p className="text-sm text-emerald-300">{formMessage}</p> : null}

				<button
					type="submit"
					disabled={disabled}
					className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting || authLoading ? "Working..." : "Create account"}
				</button>
				<p className="text-center text-sm text-slate-300">
					Already have an account? <a href="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">Login</a>
				</p>
			</form>
		</div>
	);
}
