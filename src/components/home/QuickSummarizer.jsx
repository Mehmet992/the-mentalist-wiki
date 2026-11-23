import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchEpisodeDetails,
  fetchFandomWikiArticle,
  getEpisodeAct,
} from '../../services/api';

/**
 * Interactive Season & Episode Summarizer widget on the Home Page.
 * Uses Progressive Disclosure: presents a concise, visual 2-line summary card first,
 * and allows the user to expand the multi-paragraph Fandom Wiki story recap on demand.
 *
 * @param {Object} props
 * @param {Array} props.seasons - All 7 seasons fetched from /shows/116/seasons
 * @param {Array} props.episodes - All 151 episodes fetched from /shows/116/episodes
 */
export default function QuickSummarizer({ seasons = [], episodes = [] }) {
  const [mode, setMode] = useState('EPISODE'); // 'EPISODE' or 'SEASON'
  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [showExtendedRecap, setShowExtendedRecap] = useState(false);

  const [episodeLiveDetail, setEpisodeLiveDetail] = useState(null);
  const [episodeWikiRecap, setEpisodeWikiRecap] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter episodes belonging to the currently selected season
  const episodesInSelectedSeason = useMemo(
    () => episodes.filter((ep) => ep.season === Number(selectedSeasonNum)),
    [episodes, selectedSeasonNum]
  );

  // Keep selectedEpisodeId synchronized when season changes
  useEffect(() => {
    if (episodesInSelectedSeason.length > 0) {
      const currentExists = episodesInSelectedSeason.some(
        (ep) => ep.id === Number(selectedEpisodeId)
      );
      if (!currentExists) {
        setSelectedEpisodeId(episodesInSelectedSeason[0].id);
      }
    }
  }, [episodesInSelectedSeason, selectedEpisodeId]);

  // Fetch detailed episode data (guest cast, writer, director) + Fandom recap whenever selectedEpisodeId changes
  useEffect(() => {
    let isMounted = true;
    setShowExtendedRecap(false);
    if (!selectedEpisodeId) return undefined;

    const targetEp = episodes.find((e) => e.id === Number(selectedEpisodeId));

    async function loadEpisodeSummaryData() {
      setLoadingDetail(true);
      try {
        const [fullEp, wikiArticle] = await Promise.all([
          fetchEpisodeDetails(selectedEpisodeId),
          targetEp ? fetchFandomWikiArticle(targetEp.name) : Promise.resolve(null),
        ]);
        if (isMounted) {
          setEpisodeLiveDetail(fullEp);
          setEpisodeWikiRecap(wikiArticle);
          setLoadingDetail(false);
        }
      } catch {
        if (isMounted) {
          setLoadingDetail(false);
        }
      }
    }

    loadEpisodeSummaryData();
    return () => {
      isMounted = false;
    };
  }, [selectedEpisodeId, episodes]);

  // Compute live statistics for the currently selected season from the episodes API payload
  const seasonStats = useMemo(() => {
    const seasonObj = seasons.find((s) => s.number === Number(selectedSeasonNum));
    const eps = episodesInSelectedSeason;
    const ratedEps = eps.filter((e) => typeof e.rating?.average === 'number');
    const avgRating =
      ratedEps.length > 0
        ? (
            ratedEps.reduce((acc, cur) => acc + cur.rating.average, 0) / ratedEps.length
          ).toFixed(2)
        : 'N/A';

    const highestRatedEp =
      ratedEps.length > 0
        ? [...ratedEps].sort((a, b) => b.rating.average - a.rating.average)[0]
        : null;

    const redJohnCount = eps.filter((e) => analyzeEpisodeMilestone(e).mentionsRedJohn).length;

    return {
      seasonObj,
      episodeCount: eps.length,
      avgRating,
      highestRatedEp,
      redJohnCount,
      premiereEpisode: eps[0] || null,
      finaleEpisode: eps[eps.length - 1] || null,
    };
  }, [seasons, selectedSeasonNum, episodesInSelectedSeason]);

  const currentEpisode =
    episodeLiveDetail || episodes.find((e) => e.id === Number(selectedEpisodeId));
  const milestoneInfo = currentEpisode ? analyzeEpisodeMilestone(currentEpisode) : null;
  const guestCast = episodeLiveDetail?._embedded?.guestcast || [];

  return (
    <section className="mt-14 glass-panel rounded-3xl p-6 sm:p-8">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-mono-code uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive API Inspector</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-title">
            Quick Case &amp; Season Summarizer
          </h2>
        </div>

        {/* Toggle between Episode Summarizer and Season Summarizer */}
        <div className="inline-flex rounded-xl bg-black/80 p-1 border border-white/10 self-start">
          <button
            type="button"
            onClick={() => setMode('EPISODE')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mode === 'EPISODE'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Inspect Episode
          </button>
          <button
            type="button"
            onClick={() => setMode('SEASON')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mode === 'SEASON'
                ? 'bg-red-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Inspect Season
          </button>
        </div>
      </div>

      {/* Interactive Selection Controls */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Season Selector Pills */}
        <div className={mode === 'EPISODE' ? 'md:col-span-6' : 'md:col-span-12'}>
          <label className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-2">
            1. Select Season
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((sNum) => (
              <button
                key={sNum}
                type="button"
                onClick={() => setSelectedSeasonNum(sNum)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono-code font-semibold border transition cursor-pointer ${
                  Number(selectedSeasonNum) === sNum
                    ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-zinc-900/80 text-zinc-300 border-white/10 hover:border-red-500/50'
                }`}
              >
                S{sNum}
              </button>
            ))}
          </div>
        </div>

        {/* Episode Dropdown Selector (when in EPISODE mode) */}
        {mode === 'EPISODE' && (
          <div className="md:col-span-6">
            <label
              htmlFor="quick-episode-select"
              className="block text-[11px] font-mono-code uppercase text-zinc-400 mb-2"
            >
              2. Select Episode (Season {selectedSeasonNum})
            </label>
            <select
              id="quick-episode-select"
              value={selectedEpisodeId || ''}
              onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
              className="w-full rounded-xl bg-zinc-900/90 border border-white/15 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {episodesInSelectedSeason.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  S{String(ep.season).padStart(2, '0')}E{String(ep.number).padStart(2, '0')} —{' '}
                  {ep.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Output Area: Concise, Visual Episode Summary */}
      {mode === 'EPISODE' && currentEpisode && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Episode Screenshot */}
          <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-white/10 bg-black relative">
            {currentEpisode.image?.original || currentEpisode.image?.medium ? (
              <img
                src={currentEpisode.image.original || currentEpisode.image.medium}
                alt={currentEpisode.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-zinc-950 text-zinc-500 text-xs">
                No Episode Image
              </div>
            )}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-white">
              S{String(currentEpisode.season).padStart(2, '0')}E
              {String(currentEpisode.number).padStart(2, '0')}
            </div>
            {currentEpisode.rating?.average && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono-code font-bold text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>{currentEpisode.rating.average}</span>
              </div>
            )}
          </div>

          {/* Bite-Sized Episode Briefing */}
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/60 p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono-code text-red-400">
                  <span>
                    {getEpisodeAct(currentEpisode) === 'RED_JOHN_ACT'
                      ? 'Act I • Red John Era'
                      : 'Act II • FBI Era'}
                  </span>
                  <span>•</span>
                  <span className="text-zinc-400 inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {currentEpisode.airdate}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white font-serif-title mt-0.5">
                  {currentEpisode.name}
                </h3>
              </div>

              {loadingDetail && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-code text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                  <span>Loading...</span>
                </span>
              )}
            </div>

            {/* Concise 2-line Official Summary (max-w-prose for easy reading) */}
            <p className="text-sm text-zinc-200 leading-relaxed max-w-prose">
              {milestoneInfo?.cleanSummary || 'No summary text returned by API.'}
            </p>

            {/* Compact Guest Cast Pills (Max 4 shown) */}
            {guestCast.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono-code text-zinc-400 mr-1 inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-red-400" />
                  Guests:
                </span>
                {guestCast.slice(0, 4).map((g, i) => (
                  <span
                    key={`${g.person?.id}-${i}`}
                    className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-xs text-zinc-300"
                  >
                    {g.character?.name}
                  </span>
                ))}
                {guestCast.length > 4 && (
                  <span className="text-xs font-mono-code text-zinc-500">
                    +{guestCast.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Progressive Disclosure: Optional Extended Story Recap Accordion */}
            {showExtendedRecap &&
              episodeWikiRecap &&
              (episodeWikiRecap.recap || episodeWikiRecap.overview) && (
                <div className="rounded-xl bg-zinc-900/90 border border-white/10 p-4 animate-fade-slide">
                  <div className="flex items-center justify-between text-xs font-mono-code text-red-400 uppercase mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clapperboard className="h-3.5 w-3.5" />
                      <span>Extended Wiki Story Recap</span>
                    </span>
                    {episodeWikiRecap.infobox?.Writer && (
                      <span className="text-zinc-400">
                        Writer: {episodeWikiRecap.infobox.Writer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-prose line-clamp-4">
                    {episodeWikiRecap.recap || episodeWikiRecap.overview}
                  </p>
                </div>
              )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              {episodeWikiRecap && (episodeWikiRecap.recap || episodeWikiRecap.overview) ? (
                <button
                  type="button"
                  onClick={() => setShowExtendedRecap((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-code text-zinc-300 hover:text-white cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-red-400" />
                  <span>
                    {showExtendedRecap ? 'Hide Extended Recap' : 'Expand Extended Wiki Recap'}
                  </span>
                  {showExtendedRecap ? (
                    <ChevronUp className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-red-400" />
                  )}
                </button>
              ) : (
                <span />
              )}

              <Link
                to={`/episodes/${currentEpisode.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
              >
                <span>Open Case File</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEASON SUMMARIZER MODE (Visual & Compact) */}
      {mode === 'SEASON' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3 flex justify-center">
            {seasonStats.seasonObj?.image?.original || seasonStats.seasonObj?.image?.medium ? (
              <img
                src={
                  seasonStats.seasonObj.image.original || seasonStats.seasonObj.image.medium
                }
                alt={`Season ${selectedSeasonNum}`}
                className="w-40 h-56 object-cover rounded-2xl border border-white/15 shadow-lg"
              />
            ) : (
              <div className="w-40 h-56 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                <Layers className="h-10 w-10 text-red-500" />
              </div>
            )}
          </div>

          <div className="lg:col-span-9 rounded-2xl border border-white/10 bg-black/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono-code uppercase text-red-400">
                  Season {selectedSeasonNum} • {seasonStats.seasonObj?.premiereDate} →{' '}
                  {seasonStats.seasonObj?.endDate}
                </span>
                <h3 className="text-2xl font-bold text-white font-serif-title">
                  Season {selectedSeasonNum} Snapshot
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono-code text-white">
                  {seasonStats.episodeCount} Episodes
                </span>
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-amber-500/30 text-xs font-mono-code text-amber-400 font-bold">
                  ★ {seasonStats.avgRating} Avg
                </span>
              </div>
            </div>

            {/* Compact Premiere vs Finale Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {seasonStats.premiereEpisode && (
                <Link
                  to={`/episodes/${seasonStats.premiereEpisode.id}`}
                  className="rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 p-3.5 transition"
                >
                  <span className="text-[10px] font-mono-code text-red-400 uppercase block">
                    Premiere (E01)
                  </span>
                  <strong className="text-white text-sm block truncate mt-0.5">
                    {seasonStats.premiereEpisode.name}
                  </strong>
                  <span className="text-zinc-400 line-clamp-1 mt-1 block">
                    {analyzeEpisodeMilestone(seasonStats.premiereEpisode).cleanSummary}
                  </span>
                </Link>
              )}

              {seasonStats.finaleEpisode && (
                <Link
                  to={`/episodes/${seasonStats.finaleEpisode.id}`}
                  className="rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 p-3.5 transition"
                >
                  <span className="text-[10px] font-mono-code text-red-400 uppercase block">
                    Finale (E{seasonStats.finaleEpisode.number})
                  </span>
                  <strong className="text-white text-sm block truncate mt-0.5">
                    {seasonStats.finaleEpisode.name}
                  </strong>
                  <span className="text-zinc-400 line-clamp-1 mt-1 block">
                    {analyzeEpisodeMilestone(seasonStats.finaleEpisode).cleanSummary}
                  </span>
                </Link>
              )}

              {seasonStats.highestRatedEp && (
                <Link
                  to={`/episodes/${seasonStats.highestRatedEp.id}`}
                  className="rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 p-3.5 transition"
                >
                  <span className="text-[10px] font-mono-code text-amber-400 uppercase block">
                    ★ Top Rated ({seasonStats.highestRatedEp.rating?.average})
                  </span>
                  <strong className="text-white text-sm block truncate mt-0.5">
                    E{seasonStats.highestRatedEp.number}: {seasonStats.highestRatedEp.name}
                  </strong>
                  <span className="text-zinc-300 line-clamp-1 mt-1 block">
                    Click to inspect full case file →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
