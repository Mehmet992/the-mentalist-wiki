import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, FileWarning, Home } from 'lucide-react';

/**
 * Custom 404 Not Found Page ("Case File Redacted") rendered whenever a user
 * navigates to an unknown client-side route (path="*").
 */
export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-5 shadow-[0_0_30px_rgba(220,38,38,0.35)]">
          <FileWarning className="h-8 w-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-xs font-mono-code uppercase tracking-widest text-red-300 mb-3">
          HTTP 404 • CASE DOSSIER REDACTED OR MISSING
        </span>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif-title">
          Unlisted Archive Route
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto mt-3 leading-relaxed">
          The requested path{' '}
          <code className="px-2 py-0.5 rounded bg-black/80 border border-white/10 text-red-400 font-mono-code text-xs">
            {location.pathname}
          </code>{' '}
          does not match any active CBI or FBI dossier in our archive.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-950/60 transition"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home Deck</span>
          </Link>

          <Link
            to="/timeline"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <Compass className="h-4 w-4 text-red-400" />
            <span>Open Story Timeline</span>
          </Link>

          <Link
            to="/episodes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4 text-red-400" />
            <span>Browse All 151 Cases</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
