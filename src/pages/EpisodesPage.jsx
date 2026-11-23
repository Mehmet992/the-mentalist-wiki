import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Brain,
  CheckCircle2,
  Dices,
  Film,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchShowEpisodes,
  getEpisodeColorMotif,
  getMemoryPalaceState,
  searchAndRankEpisodes,
  toggleMemoryPalacePinned,
  toggleMemoryPalaceSolved,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';
import EpisodeCard from '../components/cards/EpisodeCard';
import Pagination from '../components/common/Pagination';

const ITEMS_PER_PAGE = 12;

/**
 * Episodes Listing Page (/episodes) displaying all 151 episodes of The Mentalist
 * with Patrick Jane's Memory Palace (Solved Case Progress Bar & Pinned Case Bookmarks),
 * relevance-ranked text search, labeled filter inputs, and a 1-click Random Case launcher.
 */
export default function EpisodesPage() {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memory Palace state (Solved cases & Pinned bookmarks)
  const [memoryPalace, setMemoryPalace] = useState(() => getMemoryPalaceState());
  const [palaceFilter, setPalaceFilter] = useState('ALL'); // 'ALL', 'PINNED', 'SOLVED', 'UNSOLVED'

  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('ALL');
  const [actFilter, setActFilter] = useState('ALL');
  const [motifFilter, setMotifFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CHRONOLOGICAL');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Retrieves all 151 episodes.
   */
  const loadEpisodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShowEpisodes();
      setEpisodes(data);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, seasonFilter, actFilter, motifFilter, sortBy, palaceFilter]);

  /**
   * Toggles an episode's solved status inside Patrick Jane's Memory Palace.
   */
  const handleToggleSolved = (episodeId) => {
    const updated = toggleMemoryPalaceSolved(episodeId);
    setMemoryPalace({ ...updated });
  };

  /**
   * Toggles an episode's pinned bookmark inside Patrick Jane's Memory Palace.
   */
  const handleTogglePinned = (episodeId) => {
    const updated = toggleMemoryPalacePinned(episodeId);
    setMemoryPalace({ ...updated });
  };

  /**
   * Resets all search and filter controls back to their default state.
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSeasonFilter('ALL');
    setActFilter('ALL');
    setMotifFilter('ALL');
    setPalaceFilter('ALL');
    setSortBy('CHRONOLOGICAL');
    setCurrentPage(1);
  };

  /**
   * Picks a random episode out of the 151 records and opens its full Case File.
   */
  const handleOpenRandomCase = () => {
    if (episodes.length === 0) return;
    const randomEp = episodes[Math.floor(Math.random() * episodes.length)];
    navigate(`/episodes/${randomEp.id}`);
  };

  // Compute filtered and relevance-ranked episode list reactively based on user inputs
  const filteredEpisodes = useMemo(() => {
    const basePool = episodes.filter((ep) => {
      const analysis = analyzeEpisodeMilestone(ep);
      const colorMotif = getEpisodeColorMotif(ep);
      const isPinned = memoryPalace.pinnedIds.includes(ep.id);
      const isSolved = memoryPalace.solvedIds.includes(ep.id);

      if (palaceFilter === 'PINNED' && !isPinned) return false;
      if (palaceFilter === 'SOLVED' && !isSolved) return false;
      if (palaceFilter === 'UNSOLVED' && isSolved) return false;

      if (seasonFilter !== 'ALL' && ep.season !== Number(seasonFilter)) {
        return false;
      }
      if (actFilter !== 'ALL' && analysis.act !== actFilter) {
        return false;
      }
      if (motifFilter === 'RED_JOHN_ONLY' && !analysis.mentionsRedJohn) {
        return false;
      }
      if (motifFilter === 'RED_MOTIF' && colorMotif !== 'RED_MOTIF') {
        return false;
      }
      if (motifFilter === 'COLOR_SHIFT_MOTIF' && colorMotif !== 'COLOR_SHIFT_MOTIF') {
        return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      return searchAndRankEpisodes(basePool, searchQuery);
    }

    if (sortBy === 'RATING_DESC') {
      return [...basePool].sort(
        (a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)
      );
    }
    if (sortBy === 'REVERSE_CHRONOLOGICAL') {
      return [...basePool].reverse();
    }
    return basePool;
  }, [
    episodes,
    seasonFilter,
    actFilter,
    motifFilter,
    searchQuery,
    sortBy,
    palaceFilter,
    memoryPalace,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / ITEMS_PER_PAGE));
  const paginatedEpisodes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEpisodes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEpisodes, currentPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Loading all 151 episode case files..."
          endpointHint="api.tvmaze.com/shows/116/episodes"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadEpisodes} />
      </div>
    );
  }

  const solvedCount = memoryPalace.solvedIds.length;
  const pinnedCount = memoryPalace.pinnedIds.length;
  const progressPct =
    episodes.length > 0 ? Math.round((solvedCount / episodes.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header & Patrick Jane's Memory Palace Tracker */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold uppercase mb-2">
              <Film className="h-3.5 w-3.5" />
              <span>CBI &amp; FBI Case Directory • {episodes.length} Episodes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f5] font-serif-title">
              Episode Case Files
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
              Browse, search, and pin your favorite investigations into Patrick Jane&apos;s Memory
              Palace or track which cases you have solved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleOpenRandomCase}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/60 transition cursor-pointer"
            >
              <Dices className="h-4 w-4" />
              <span>Random Case File</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-red-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Patrick Jane's Memory Palace Bar (Embedded directly inside Episodes Page!) */}
        <div className="mt-5 rounded-2xl bg-[#0d0d13]/95 border border-white/10 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-red-300 uppercase">
                <Brain className="h-4 w-4 text-red-400" />
                <span>Patrick Jane&apos;s Memory Palace — Investigation Progress</span>
              </span>
              <span className="font-mono-code text-zinc-300">
                <strong className="text-emerald-400">{solvedCount}</strong> / {episodes.length}{' '}
                Cases Solved ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/5">
              <div
                style={{ width: `${Math.max(2, progressPct)}%` }}
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-500"
              />
            </div>
          </div>

          {/* Memory Palace Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setPalaceFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                palaceFilter === 'ALL'
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-white'
              }`}
            >
              All Cases ({episodes.length})
            </button>
            <button
              type="button"
              onClick={() => setPalaceFilter('PINNED')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                palaceFilter === 'PINNED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-amber-300'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Pinned ({pinnedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPalaceFilter('SOLVED')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                palaceFilter === 'SOLVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Solved ({solvedCount})</span>
            </button>
          </div>
        </div>

        {/* Reactive Search & Filter Controls with Visible Sticking Labels */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <label
              htmlFor="episodes-search-input"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Search Episode Title, Plot, or Code
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="episodes-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Red John, Pilot, S06E08..."
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 pl-10 pr-4 text-sm text-[#f5f5f5] placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="episodes-season-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Season
            </label>
            <select
              id="episodes-season-select"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
            >
              <option value="ALL">All Seasons (1–7)</option>
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <option key={s} value={s}>
                  Season {s}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="episodes-act-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Narrative Act
            </label>
            <select
              id="episodes-act-select"
              value={actFilter}
              onChange={(e) => setActFilter(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
            >
              <option value="ALL">All Story Acts</option>
              <option value="RED_JOHN_ACT">Act I: Red John Era</option>
              <option value="FBI_ACT">Act II: FBI Era</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="episodes-motif-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Case Motif
            </label>
            <select
              id="episodes-motif-select"
              value={motifFilter}
              onChange={(e) => setMotifFilter(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
            >
              <option value="ALL">All Case Types</option>
              <option value="RED_JOHN_ONLY">Red John Direct Cases</option>
              <option value="RED_MOTIF">Red-Titled Episodes</option>
              <option value="COLOR_SHIFT_MOTIF">Post-RJ Color Titles</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="episodes-sort-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Sort Order
            </label>
            <select
              id="episodes-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
            >
              <option value="CHRONOLOGICAL">S01E01 → S07E13</option>
              <option value="RATING_DESC">Highest Rating ★</option>
              <option value="REVERSE_CHRONOLOGICAL">Newest First</option>
            </select>
          </div>
        </div>

        {/* Active Filter Status Bar */}
        <div className="mt-4 flex items-center justify-between text-xs font-mono-code text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-red-400" />
            <span>
              Matching Cases: <strong className="text-white">{filteredEpisodes.length}</strong> /{' '}
              {episodes.length}
            </span>
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Episodes Grid */}
      {paginatedEpisodes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">
            No episodes match your current filter criteria
          </h2>
          <p className="text-base text-zinc-400 mb-4">
            Try clearing your search keyword or switching the Memory Palace / Season filter.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEpisodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                isSolved={memoryPalace.solvedIds.includes(episode.id)}
                isPinned={memoryPalace.pinnedIds.includes(episode.id)}
                onToggleSolved={handleToggleSolved}
                onTogglePinned={handleTogglePinned}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEpisodes.length}
            visibleCount={paginatedEpisodes.length}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
