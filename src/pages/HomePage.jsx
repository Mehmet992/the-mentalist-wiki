import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Film,
  Layers,
  ShieldAlert,
  Star,
  Tv,
  Users,
} from 'lucide-react';
import {
  fetchShowCast,
  fetchShowEpisodes,
  fetchShowOverview,
  fetchShowSeasons,
  stripHtmlTags,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';
import StackedCardDeck from '../components/home/StackedCardDeck';
import DualIdentityPanel from '../components/home/DualIdentityPanel';
import QuickSummarizer from '../components/home/QuickSummarizer';
import CharacterCard from '../components/cards/CharacterCard';

/**
 * Home Page component applying:
 * - Rule 1 (60-30-10 Obsidian / Dark Glass / Crimson Accent Balance)
 * - Rule 5 (Z-Pattern Hero layout)
 * - Rule 6 & 7 (Frosted Glassmorphism, Ambient Spotlights & Micro-interactions)
 * - Progressive Disclosure (Bite-sized scannable text upfront, expandable on click)
 */
export default function HomePage() {
  const [showData, setShowData] = useState(null);
  const [castList, setCastList] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [episodesList, setEpisodesList] = useState([]);
  const [activeCastIndex, setActiveCastIndex] = useState(0);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches all required Home Page datasets in parallel from the public TVmaze API.
   */
  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, cast, seasons, episodes] = await Promise.all([
        fetchShowOverview(),
        fetchShowCast(),
        fetchShowSeasons(),
        fetchShowEpisodes(),
      ]);

      const seenPersonIds = new Set();
      const uniqueCast = cast.filter((item) => {
        const pid = item.person?.id;
        if (!pid || seenPersonIds.has(pid)) return false;
        seenPersonIds.add(pid);
        return true;
      });

      setShowData(overview);
      setCastList(uniqueCast);
      setSeasonsList(seasons);
      setEpisodesList(episodes);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Loading The Mentalist show overview, cast deck, and episode archives from API..."
          endpointHint="api.tvmaze.com/shows/116"
        />
      </div>
    );
  }

  if (error || !showData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadHomeData} />
      </div>
    );
  }

  const cleanShowSummary = stripHtmlTags(showData.summary);
  const activeCastItem = castList[activeCastIndex] || castList[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Rule 5: Z-Pattern Hero Container with Glassmorphism & Progressive Disclosure */}
      <section className="glass-panel rounded-3xl p-6 sm:p-9 relative overflow-hidden">
        {/* Rule 6: Subtle Ambient Spotlights (10% Crimson Accent) */}
        <div className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 rounded-full bg-red-600/12 blur-3xl" />

        {/* Z-Pattern Top Bar: Left Title/Genres -> Right Compact Metrics Pills */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[11px] font-mono-code text-red-400 font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>SHOW ID #{showData.id}</span>
              </span>

              {showData.genres?.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-white/10 text-[11px] font-mono-code text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif-title tracking-wide">
                {showData.name}
              </h1>
              <button
                type="button"
                onClick={() => setShowFullSynopsis((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-mono-code text-red-400 hover:text-red-300 transition cursor-pointer"
              >
                <span>{showFullSynopsis ? 'Hide Series Premise' : 'Read Series Premise'}</span>
                {showFullSynopsis ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Progressive Disclosure: Compact 1-line teaser by default, full premise only on click */}
            <p
              className={`mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-prose ${
                showFullSynopsis ? '' : 'line-clamp-1'
              }`}
            >
              {cleanShowSummary}
            </p>
          </div>

          {/* Z-Pattern Top-Right: Compact Horizontal Stat Pills */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-black/70 border border-white/10 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <div>
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block leading-none">
                  Rating
                </span>
                <span className="text-sm font-bold text-white">
                  {showData.rating?.average || 'N/A'}
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-black/70 border border-white/10 flex items-center gap-2">
              <Film className="h-4 w-4 text-red-500" />
              <div>
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block leading-none">
                  Cases
                </span>
                <span className="text-sm font-bold text-white">{episodesList.length}</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-black/70 border border-white/10 flex items-center gap-2">
              <Layers className="h-4 w-4 text-red-500" />
              <div>
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block leading-none">
                  Seasons
                </span>
                <span className="text-sm font-bold text-white">{seasonsList.length}</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-black/70 border border-white/10 flex items-center gap-2">
              <Tv className="h-4 w-4 text-red-500" />
              <div>
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block leading-none">
                  Network
                </span>
                <span className="text-sm font-bold text-white">
                  {showData.network?.name || 'CBS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Z-Pattern Diagonal Sweep: Left 3D Stacked Card Deck -> Right Compact Dual-Identity Spotlight */}
        <div className="relative z-10 mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <StackedCardDeck
              castList={castList}
              activeIndex={activeCastIndex}
              onSelectIndex={setActiveCastIndex}
            />
          </div>

          <div className="lg:col-span-7">
            <DualIdentityPanel activeCastItem={activeCastItem} />
          </div>
        </div>
      </section>

      {/* Quick Navigation Portal Cards (Rule 7 Hover Micro-interactions) */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/timeline" className="glass-card-interactive group rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Clock className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white font-serif-title">
            Two-Act Story Timeline
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            Act I (Red John Hunt) &amp; Act II (The FBI Era)
          </p>
        </Link>

        <Link to="/episodes" className="glass-card-interactive group rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Film className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white font-serif-title">
            All {episodesList.length} Episode Files
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            Search &amp; filter by season, Act, and color motifs
          </p>
        </Link>

        <Link to="/characters" className="glass-card-interactive group rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Users className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white font-serif-title">
            Actors &amp; Characters
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            Real actor identities vs. series characters
          </p>
        </Link>

        <Link to="/seasons" className="glass-card-interactive group rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Layers className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white font-serif-title">
            {seasonsList.length} Seasons &amp; Crew
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            Season ratings, premiere dates, and creators
          </p>
        </Link>
      </section>

      {/* Interactive Episode & Season Live Summarizer Section */}
      <QuickSummarizer seasons={seasonsList} episodes={episodesList} />

      {/* Main Cast Dual-Identity Overview Grid on Home Page */}
      <section className="mt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono-code uppercase text-red-400">
              Live API Cast Roster
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-title mt-0.5">
              Starring Actors &amp; Series Characters
            </h2>
          </div>
          <Link
            to="/characters"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            <span>Explore Full Cast Directory</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {castList.map((castItem) => (
            <CharacterCard
              key={`${castItem.person?.id}-${castItem.character?.id}`}
              castItem={castItem}
              roleBadge="Main Series Cast"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
