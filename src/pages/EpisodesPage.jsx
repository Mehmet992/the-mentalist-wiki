import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices, Film, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchShowEpisodes,
  getEpisodeColorMotif,
  searchAndRankEpisodes,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';
import EpisodeCard from '../components/cards/EpisodeCard';
import Pagination from '../components/common/Pagination';

const ITEMS_PER_PAGE = 12;

/**
 * Episodes Listing Page (/episodes) displaying all 151 episodes of The Mentalist
 * fetched from the TVmaze API with relevance-ranked text search, labeled filter inputs
 * (UI/UX Slides 6 & 37), a 1-click Random Case File launcher, and pagination.
 */
export default function EpisodesPage() {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('ALL');
  const [actFilter, setActFilter] = useState('ALL');
  const [motifFilter, setMotifFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CHRONOLOGICAL');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Retrieves all 151 episodes from the public TVmaze API endpoint.
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
  }, [searchQuery, seasonFilter, actFilter, motifFilter, sortBy]);

  /**
   * Resets all search and filter controls back to their default state.
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSeasonFilter('ALL');
    setActFilter('ALL');
    setMotifFilter('ALL');
    setSortBy('CHRONOLOGICAL');
    setCurrentPage(1);
  };

  /**
   * Picks a random episode out of the 151 API records and opens its full Case File.
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

    // When a search query is entered, rank by relevance so exact title matches (e.g. "Red John" S06E08) appear first
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
  }, [episodes, seasonFilter, actFilter, motifFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / ITEMS_PER_PAGE));
  const paginatedEpisodes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEpisodes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEpisodes, currentPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Fetching all 151 episode case files from TVmaze API..."
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold uppercase mb-2">
              <Film className="h-3.5 w-3.5" />
              <span>CBI &amp; FBI Case Directory • {episodes.length} API Records</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f5] font-serif-title">
              Episode Case Files
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
              Search and filter across all 151 episodes by keyword, season, narrative Act, or launch a random case dossier.
            </p>
          </div>

          {/* Aligned Header Action Buttons: Random Case File + Reset Filters */}
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

        {/* Reactive Search & Filter Controls with Visible Sticking Labels (UI/UX Slide 6 & 37) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Text Search Input */}
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

          {/* Season Filter */}
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

          {/* Story Act Filter */}
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

          {/* Color Motif / Red John Case Filter */}
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

          {/* Sort Order */}
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
              {searchQuery.trim() ? ' (Sorted by search relevance)' : ''}
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
            Try clearing your search keyword or switching the Season / Act filter.
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
              <EpisodeCard key={episode.id} episode={episode} />
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
