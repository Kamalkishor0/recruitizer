// Navbar component

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Recruitizer</p>
            <p className="text-lg font-semibold">AI powered hiring</p>
          </div>
        </div>
        <nav className="flex items-center gap-8 text-sm font-medium text-slate-200">
          {/* <Link href="/" className="transition hover:text-white">Home</Link> */}
          <Link href="/login" className="underline decoration-transparent hover:decoration-white transition-colors duration-200">Login</Link>
          <Link href="/register" className="underline decoration-transparent hover:decoration-white transition-colors duration-200">Register</Link>
          <Link href="/about" className="underline decoration-transparent hover:decoration-white transition-colors duration-200">About</Link>
          {/* <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            <Image
              src="/images/847969.png"
              alt="User"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          </div> */}
        </nav>
      </div>
    </header>
  );
}
