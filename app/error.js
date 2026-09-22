"use client";

export default function Error({ reset }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 bg-ink bg-grain text-center">
      <div>
        <p className="font-display text-6xl font-bold text-brand">Oops</p>
        <h1 className="font-display text-2xl font-bold mt-3">Something went wrong</h1>
        <p className="text-mist text-sm mt-2">Please try again. If it keeps happening, contact support.</p>
        <div className="flex justify-center gap-3 mt-7">
          <button onClick={reset} className="btn-primary">Try again</button>
          <a href="/" className="btn-ghost">Go home</a>
        </div>
      </div>
    </main>
  );
}
