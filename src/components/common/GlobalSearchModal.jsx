import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Dices,
  Film,
  Loader2,
  Search,
  Shield,
  Star,
  User,
  X,
} from 'lucide-react';
import {
  fetchShowCast,
  fetchShowEpisodes,
  stripHtmlTags,
} from '../../services/api';

/**
 * Global Spotlight Search Modal (Ctrl + K) allowing users to instantaneously
 * search across all 151 Episodes, Series Characters, and Real Actors fetched from the API,
 * or jump to a Random Case File ("Surprise Me") with one click.
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
  const [loading, setLoading] = useState(false);

  // Focus input and load cached API datasets when modal opens
  useEffect(() => {
    if (!isOpen) return undefined;
    setTimeout(() => inputRef.current?.focus(), 50);

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

  // Compute matching episodes and cast members reactively from user query
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        matchedEpisodes: episodes.slice(0, 4),
        matchedCast: cast.slice(0, 4),
      };
    }

    const matchedEpisodes = episodes
      .filter((ep) => {
        const code = `s${String(ep.season).padStart(2, '0')}e${String(ep.number).padStart(2, '0')}`;
        const summary = stripHtmlTags(ep.summary).toLowerCase();
        return (
          ep.name.toLowerCase().includes(q) ||
          code.includes(q) ||
          summary.includes(q)
        );
      })
      .slice(0, 6);

    const matchedCast = cast
      .filter(
        (c) =>
          (c.character?.name || '').toLowerCase().includes(q) ||
          (c.person?.name || '').toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { matchedEpisodes, matchedCast };
  }, [query, episodes, cast]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-slide"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden border border-red-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/60">
          <Search className="h-5 w-5 text-red-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Instant Search: Episode title, S06E08, Patrick Jane, Simon Baker..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 text-red-500 animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[65vh] overflow-y-auto p-5 space-y-5">
          {/* Quick Random Case Action Banner */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-red-950/25 border border-red-500/30">
            <div className="flex items-center gap-2.5 text-xs text-zinc-200">
              <Dices className="h-4 w-4 text-red-400 shrink-0" />
              <span>Want to inspect a random case out of all 151 episodes?</span>
            </div>
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition cursor-pointer shrink-0"
            >
              Random Case File
            </button>
          </div>

          {/* Matching Actors & Series Characters */}
          {searchResults.matchedCast.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-red-400" />
                <span>
                  {query.trim() ? 'Matching Actors & Characters' : 'Featured Cast Profiles'}
                </span>
              </h4>
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
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
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

          {/* Matching Episodes */}
          <div>
            <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-red-400" />
              <span>
                {query.trim() ? 'Matching Episode Case Files' : 'Quick Episode Access'}
              </span>
            </h4>
            {searchResults.matchedEpisodes.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No episodes or actors matched &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.matchedEpisodes.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/episodes/${ep.id}`);
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/10 hover:border-red-500/50 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-black border border-white/15 text-xs font-mono-code font-bold text-red-400 shrink-0">
                        S{String(ep.season).padStart(2, '0')}E{String(ep.number).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate group-hover:text-red-400">
                          {ep.name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Shortcut Hint */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-[11px] font-mono-code text-zinc-500">
          <span>Shortcut: Press Ctrl + K anytime to open Spotlight Search</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
