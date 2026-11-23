import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ExternalLink } from 'lucide-react';

/**
 * Footer component displaying live API data sources and archive section links.
 * Clicking the Red John Smiley emblem in the footer triggers the Red John Calling Card Easter Egg.
 */
export default function Footer() {
  const triggerRedJohnEasterEgg = () => {
    window.dispatchEvent(new CustomEvent('open-red-john-easter-egg'));
  };

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0b0b10]/80 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Column 1: Brand Identity */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <button
                type="button"
                onClick={triggerRedJohnEasterEgg}
                title="Easter Egg: Click to summon Red John's Calling Card"
                className="cursor-pointer rounded-lg hover:scale-110 transition-transform"
              >
                <img
                  src="/favicon.svg"
                  alt="Summon Red John Calling Card"
                  className="h-8 w-8 rounded-lg shadow-[0_0_14px_rgba(220,38,38,0.45)]"
                />
              </button>
              <span className="font-serif-title font-bold text-lg text-[#f5f5f5] tracking-wider">
                THE MENTALIST WIKI
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-[1.5] max-w-[65ch]">
              An interactive series encyclopedia and CBI / FBI case archive dedicated to The
              Mentalist (2008–2015). Explore all 151 episode case files, 7 seasons, cast
              biographies, and character dossiers.
            </p>
          </div>

          {/* Column 2: Quick Wiki Navigation */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">
              Archive Sections
            </h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>
                <Link to="/" className="hover:text-red-400 underline-offset-4 hover:underline transition">
                  Home — 3D Cast Card Deck &amp; Quick Summarizer
                </Link>
              </li>
              <li>
                <Link to="/timeline" className="hover:text-red-400 underline-offset-4 hover:underline transition">
                  Story Timeline — Act I (Red John) &amp; Act II (FBI Era)
                </Link>
              </li>
              <li>
                <Link to="/episodes" className="hover:text-red-400 underline-offset-4 hover:underline transition">
                  Episodes Directory — All 151 Cases &amp; Random Case Picker
                </Link>
              </li>
              <li>
                <Link to="/characters" className="hover:text-red-400 underline-offset-4 hover:underline transition">
                  Actors &amp; Characters — Real vs. Series Identities
                </Link>
              </li>
              <li>
                <Link to="/investigation" className="hover:text-red-400 underline-offset-4 hover:underline transition">
                  Red John Suspect Board &amp; Mentalist Observation Test
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Reference Sources */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span>Archive Reference Sources</span>
            </h2>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <a
                  href="https://www.tvmaze.com/shows/116/the-mentalist"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 underline-offset-4 hover:underline"
                >
                  <span>TVmaze — The Mentalist Guide</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://thementalist.fandom.com/wiki/The_Mentalist_Wiki"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 underline-offset-4 hover:underline"
                >
                  <span>The Mentalist Fandom Encyclopedia</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/The_Mentalist"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 underline-offset-4 hover:underline"
                >
                  <span>Wikipedia — The Mentalist</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
          <span>The Mentalist Case Archives &amp; Series Encyclopedia</span>
          <span>California Bureau of Investigation (CBI) &amp; FBI Special Dossier</span>
        </div>
      </div>
    </footer>
  );
}
