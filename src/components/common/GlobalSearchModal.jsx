import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Dices,
  Film,
  Layers,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchShowCast,
  fetchShowEpisodes,
  getRecentVisits,
  searchAndRankEpisodes,
  stripHtmlTags,
} from '../../services/api';

const QUICK_SUGGESTIONS = [
  'Red John',
  'Pilot',
  'Strawberries and Cream',
  'Patrick Jane',
  'Teresa Lisbon',
  'My Blue Heaven',
  'White Orchids',
];

/**
 * Global Spotlight Search Modal (Ctrl + K).
 * - Locks background page scrolling while open so scrolling inside results never scrolls the body.
 * - Uses searchAndRankEpisodes() so exact title matches (like S06E08 "Red John") always rank #1.
 * - Implements Nielsen's Heuristic #6 (Recognition Over Recall — Slide 26) with
 *   Quick Search Suggestion Chips and Recently Visited Dossiers.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [cast, setCast] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lock background page scroll while modal is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus input, load recent visits, and ensure API catalog is loaded when modal opens
  useEffect(() => {
    if (!isOpen) return undefined;
    setRecentVisits(getRecentVisits());
    setTimeout(() => inputRef.current?.focus(), 40);

    let isMounted = true;
    async function loadSearchCatalog() {
      if (episodes.length > 0 && cast.length > 0) return;
      setLoading(true);
      try {
        const [epData, castData] = await Promise.all([
          fetchShowEpisodes(),
          fetchShowCast(),
        ]);
        if (isMounted) {
          setEpisodes(epData);
          const seen = new Set();
          setCast(
            castData.filter((c) => {
              const pid = c.person?.id;
              if (!pid || seen.has(pid)) return false;
              seen.add(pid);
              return true;
            })
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSearchCatalog();
    return () => {
      isMounted = false;
    };
  }, [isOpen, episodes.length, cast.length]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /**
   * Picks a random episode from the 151 API records and navigates directly to its Case File.
   */
  const handleSurpriseMe = async () => {
    let epPool = episodes;
    if (epPool.length === 0) {
      try {
        epPool = await fetchShowEpisodes();
      } catch {
        return;
      }
    }
    if (epPool.length > 0) {
      const randomEp = epPool[Math.floor(Math.random() * epPool.length)];
      onClose();
      navigate(`/episodes/${randomEp.id}`);
    }
  };

  // Compute relevance-ranked matching episodes, cast members, and seasons
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        matchedEpisodes: episodes.slice(0, 5),
        matchedCast: cast.slice(0, 4),
        matchedSeason: null,
        totalEpisodeMatches: episodes.length,
      };
    }

    const rankedEpisodes = searchAndRankEpisodes(episodes, q);

    const matchedCast = cast.filter(
      (c) =>
        (c.character?.name || '').toLowerCase().includes(q) ||
        (c.person?.name || '').toLowerCase().includes(q) ||
        (c.person?.country?.name || '').toLowerCase().includes(q)
    );

    const seasonMatch = q.match(/season\s*([1-7])/i);
    const matchedSeason = seasonMatch ? Number(seasonMatch[1]) : null;

    return {
      matchedEpisodes: rankedEpisodes.slice(0, 25),
      matchedCast,
      matchedSeason,
      totalEpisodeMatches: rankedEpisodes.length,
    };
  }, [query, episodes, cast]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-label"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/80 backdrop-blur-md animate-fade-slide overscroll-contain"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden border border-red-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row with Visible Label (UI/UX Slide 6 & 37) */}
        <div className="px-5 pt-3.5 pb-3 border-b border-white/10 bg-[#0d0d13]">
          <div className="flex items-center justify-between mb-1.5">
            <label
              id="global-search-label"
              htmlFor="global-archive-search-input"
              className="text-xs font-semibold uppercase tracking-wider text-red-400"
            >
              Search Episodes, Characters, Actors &amp; Seasons
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search modal"
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-red-500 shrink-0" />
            <input
              id="global-archive-search-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type e.g. Red John, S06E08, Patrick Jane, Simon Baker..."
              className="w-full bg-transparent text-base text-[#f5f5f5] placeholder-zinc-500 py-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 cursor-pointer"
              >
                Clear
              </button>
            )}
            {loading && <Loader2 className="h-4 w-4 text-red-500 animate-spin shrink-0" />}
          </div>
        </div>

        {/* Scrollable Results Container (overscroll-contain prevents background scroll) */}
        <div className="max-h-[62vh] overflow-y-auto overscroll-contain p-5 space-y-5">
          {/* Recognition Over Recall (UI/UX Slide 26): Quick Search Suggestions */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              Quick Search Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuery(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                    query.toLowerCase() === chip.toLowerCase()
                      ? 'bg-red-600 text-white border-red-400'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-white/10'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-red-400 inline mr-1" />
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Recognition Over Recall (UI/UX Slide 26): Recently Visited Dossiers */}
          {!query.trim() && recentVisits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-red-400" />
                <span>Recently Visited Dossiers</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentVisits.map((visit) => (
                  <button
                    key={visit.path}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(visit.path);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-200 transition cursor-pointer"
                  >
                    <span className="text-red-400 font-semibold">{visit.badge}</span>
                    <span>{visit.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Season Shortcut if query mentions a season */}
          {searchResults.matchedSeason && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/seasons');
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-left hover:bg-red-950/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-red-400" />
                <span>Open Season {searchResults.matchedSeason} Overview &amp; Rating Chart</span>
              </div>
              <ArrowRight className="h-4 w-4 text-red-400" />
            </button>
          )}

          {/* Matching Actors & Series Characters */}
          {searchResults.matchedCast.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-red-400" />
                <span>
                  {query.trim()
                    ? `Matching Actors & Characters (${searchResults.matchedCast.length})`
                    : 'Featured Cast Profiles'}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchResults.matchedCast.map((c) => (
                  <button
                    key={c.person?.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/characters/${c.person?.id}`);
                    }}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/10 hover:border-red-500/50 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.character?.image?.medium || c.person?.image?.medium ? (
                        <img
                          src={c.character?.image?.medium || c.person?.image?.medium}
                          alt={c.character?.name}
                          className="h-10 w-10 rounded-lg object-cover object-top shrink-0"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate group-hover:text-red-400">
                          {c.character?.name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate flex items-center gap-1">
                          <Shield className="h-3 w-3 text-red-400" />
                          <span>Actor: {c.person?.name}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Episodes (Relevance Ranked so S06E08 "Red John" is #1 for "Red John"!) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-red-400" />
                <span>
                  {query.trim()
                    ? `Matching Episode Case Files (${searchResults.totalEpisodeMatches} found — Ranked by Relevance)`
                    : 'Quick Episode Access'}
                </span>
              </h3>
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
              >
                <Dices className="h-3.5 w-3.5" />
                <span>Random Case</span>
              </button>
            </div>

            {searchResults.matchedEpisodes.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">
                No episodes or actors matched &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.matchedEpisodes.map((ep) => {
                  const milestone = analyzeEpisodeMilestone(ep);
                  const isShowdown = ep.season === 6 && ep.number === 8;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/episodes/${ep.id}`);
                      }}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition cursor-pointer group ${
                        isShowdown
                          ? 'bg-red-950/35 hover:bg-red-950/55 border-red-500/60'
                          : 'bg-zinc-900/70 hover:bg-zinc-900 border-white/10 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-1 rounded bg-black/80 border border-white/15 text-xs font-mono-code font-bold text-red-400 shrink-0">
                          S{String(ep.season).padStart(2, '0')}E
                          {String(ep.number).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate group-hover:text-red-400">
                              {ep.name}
                            </span>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] text-red-300 shrink-0">
                              {milestone.milestoneTag}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 truncate mt-0.5">
                            {stripHtmlTags(ep.summary)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {ep.rating?.average && (
                          <span className="inline-flex items-center gap-1 text-xs font-mono-code text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span>{ep.rating.average}</span>
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Shortcut Hint */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#0d0d13] flex items-center justify-between text-xs text-zinc-400">
          <span>Shortcut: Press Ctrl + K anytime to open Search</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
