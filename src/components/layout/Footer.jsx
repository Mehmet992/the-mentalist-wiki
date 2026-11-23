import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ExternalLink, ShieldAlert } from 'lucide-react';

/**
 * Footer component displaying live API data sources and archive section links.
 */
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/75 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand Identity */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src="/favicon.svg"
                alt="The Mentalist Red John Emblem"
                className="h-8 w-8 rounded-lg shadow-[0_0_14px_rgba(220,38,38,0.45)]"
              />
              <span className="font-serif-title font-bold text-lg text-white tracking-wider">
                THE MENTALIST WIKI
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An interactive series encyclopedia and CBI / FBI case archive dedicated to The
              Mentalist (2008–2015). All episodes, seasons, actor biographies, and character
              dossiers are retrieved live from public APIs.
            </p>
          </div>

          {/* Column 2: Quick Wiki Navigation */}
          <div>
            <h3 className="text-xs font-mono-code uppercase tracking-wider text-red-400 mb-3">
              Archive Sections
            </h3>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li>
                <Link to="/" className="hover:text-red-400 transition">
                  Home — 3D Cast Card Deck &amp; Quick Summarizer
                </Link>
              </li>
              <li>
                <Link to="/timeline" className="hover:text-red-400 transition">
                  Story Timeline — Act I (Red John) &amp; Act II (FBI Era)
                </Link>
              </li>
              <li>
                <Link to="/episodes" className="hover:text-red-400 transition">
                  Episodes Directory — All 151 Cases &amp; Random Case Picker
                </Link>
              </li>
              <li>
                <Link to="/characters" className="hover:text-red-400 transition">
                  Actors &amp; Characters — Real vs. Series Identities
                </Link>
              </li>
              <li>
                <Link to="/investigation" className="hover:text-red-400 transition">
                  Red John Suspect Board &amp; Mentalist Observation Test
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Public API Endpoints */}
          <div>
            <h3 className="text-xs font-mono-code uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span>Live Public API Endpoints</span>
            </h3>
            <ul className="space-y-2 text-xs font-mono-code text-zinc-400">
              <li>
                <a
                  href="https://api.tvmaze.com/shows/116"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                >
                  <span>api.tvmaze.com/shows/116</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://thementalist.fandom.com/api.php"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                >
                  <span>thementalist.fandom.com/api.php</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/api/rest_v1/page/summary/The_Mentalist"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                >
                  <span>en.wikipedia.org/api/rest_v1</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <span>The Mentalist Case Archives &amp; Series Encyclopedia</span>
          <span>Live Data Powered by TVmaze, Fandom MediaWiki &amp; Wikipedia REST APIs</span>
        </div>
      </div>
    </footer>
  );
}
