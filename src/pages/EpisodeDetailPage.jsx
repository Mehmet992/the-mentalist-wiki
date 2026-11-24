import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Clock,
  ExternalLink,
  FileText,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchEpisodeDetails,
  fetchFandomWikiArticle,
  fetchShowEpisodes,
  getMemoryPalaceState,
  recordRecentVisit,
  toggleMemoryPalacePinned,
  toggleMemoryPalaceSolved,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';

const INITIAL_GUEST_CAST_LIMIT = 4;

/**
 * Dynamic Episode Detail Page (/episodes/:id).
 * Applies Progressive Disclosure to both the extended Wiki story recap and the
 * Episode Guest Cast list (displays only the top 4 guest cast members initially,
 * with a clean toggle button to reveal the rest if an episode has a large guest list).
 */
export default function EpisodeDetailPage() {
  const { id } = useParams();
  const [episode, setEpisode] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [wikiArticle, setWikiArticle] = useState(null);
  const [expandFullRecap, setExpandFullRecap] = useState(false);
  const [showAllGuestCast, setShowAllGuestCast] = useState(false);
  const [memoryPalace, setMemoryPalace] = useState(() => getMemoryPalaceState());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads the selected episode's details, guest cast, crew, and Fandom Wiki article.
   */
  const loadEpisodeDossier = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandFullRecap(false);
    setShowAllGuestCast(false);
    try {
      const [epData, episodeList] = await Promise.all([
        fetchEpisodeDetails(id),
        fetchShowEpisodes(),
      ]);

      const wikiTitle =
        epData.season === 6 && epData.number === 8 ? 'Red John (episode)' : epData.name;
      const fandomData = await fetchFandomWikiArticle(wikiTitle);

      setEpisode(epData);
      setAllEpisodes(episodeList);
      setWikiArticle(fandomData);

      // Record visit for Recognition Over Recall in Ctrl+K Search (UI/UX Slide 26)
      recordRecentVisit({
        path: `/episodes/${epData.id}`,
        badge: `S${String(epData.season).padStart(2, '0')}E${String(epData.number).padStart(
          2,
          '0'
        )}`,
        title: epData.name,
      });

      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEpisodeDossier();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadEpisodeDossier]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message={`Fetching full case dossier for Episode ID #${id}...`}
          endpointHint={`api.tvmaze.com/episodes/${id}?embed[]=guestcast&embed[]=guestcrew`}
        />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadEpisodeDossier} />
      </div>
    );
  }

  const analysis = analyzeEpisodeMilestone(episode);
  const guestCast = episode._embedded?.guestcast || [];
  const guestCrew = episode._embedded?.guestcrew || [];

  // Limit initial visible guest cast to 4 items so large guest lists never look crowded
  const visibleGuestCast = showAllGuestCast
    ? guestCast
    : guestCast.slice(0, INITIAL_GUEST_CAST_LIMIT);
  const hiddenGuestCount = Math.max(0, guestCast.length - INITIAL_GUEST_CAST_LIMIT);

  const currentIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < allEpisodes.length - 1
      ? allEpisodes[currentIndex + 1]
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb & Prev/Next Case Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          to="/episodes"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition"
        >
          <ArrowLeft className="h-4 w-4 text-red-400" />
          <span>Back to All Episodes</span>
        </Link>

        <div className="flex items-center gap-2">
          {prevEpisode && (
            <Link
              to={`/episodes/${prevEpisode.id}`}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-zinc-300 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-red-400" />
              <span>
                Prev: S{prevEpisode.season}E{prevEpisode.number}
              </span>
            </Link>
          )}
          {nextEpisode && (
            <Link
              to={`/episodes/${nextEpisode.id}`}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-zinc-300 transition"
            >
              <span>
                Next: S{nextEpisode.season}E{nextEpisode.number}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-red-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Episode Case File Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: High-Res Still & Production Metadata */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl">
              {episode.image?.original || episode.image?.medium ? (
                <img
                  src={episode.image.original || episode.image.medium}
                  alt={episode.name}
                  className="w-full h-60 sm:h-68 object-cover"
                />
              ) : (
                <div className="w-full h-60 flex items-center justify-center text-zinc-600 text-xs">
                  No Episode Still Available
                </div>
              )}
            </div>

            {/* Key Case Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-black/70 border border-white/10 p-3">
                <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                  Rating
                </span>
                <span className="inline-flex items-center gap-1 text-base font-bold text-amber-400 mt-1">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{episode.rating?.average || 'N/A'}</span>
                </span>
              </div>

              <div className="rounded-xl bg-black/70 border border-white/10 p-3">
                <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                  Air Date
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white mt-1.5">
                  <Calendar className="h-3.5 w-3.5 text-red-400" />
                  <span>{episode.airdate}</span>
                </span>
              </div>

              <div className="rounded-xl bg-black/70 border border-white/10 p-3">
                <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                  Runtime
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white mt-1.5">
                  <Clock className="h-3.5 w-3.5 text-red-400" />
                  <span>{episode.runtime || 60} min</span>
                </span>
              </div>
            </div>

            {/* Episode Directors & Writers */}
            <div className="rounded-2xl bg-black/70 border border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-code uppercase text-red-400 font-semibold">
                <Clapperboard className="h-4 w-4" />
                <span>Directors &amp; Writers</span>
              </div>

              {guestCrew.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {guestCrew.map((c, idx) => (
                    <div
                      key={`${c.person?.id}-${idx}`}
                      className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                    >
                      <span className="text-zinc-400">{c.guestCrewType}</span>
                      <span className="font-semibold text-white">{c.person?.name}</span>
                    </div>
                  ))}
                </div>
              ) : wikiArticle?.infobox?.Director || wikiArticle?.infobox?.Writer ? (
                <div className="space-y-1.5 text-xs">
                  {wikiArticle.infobox.Director && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Director</span>
                      <span className="font-semibold text-white">
                        {wikiArticle.infobox.Director}
                      </span>
                    </div>
                  )}
                  {wikiArticle.infobox.Writer && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Writer</span>
                      <span className="font-semibold text-white">
                        {wikiArticle.infobox.Writer}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  Standard series unit crew credit (TVmaze ID #{episode.id}).
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Official Synopsis & Progressive Disclosure Story Recap */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-xs font-mono-code font-bold text-red-300">
                  Season {episode.season} • Episode {episode.number}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono-code text-zinc-300">
                  {analysis.act === 'RED_JOHN_ACT'
                    ? 'Act I: Red John Era'
                    : 'Act II: FBI Era'}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono-code text-zinc-400">
                  {analysis.milestoneTag}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-title">
                {episode.name}
              </h1>

              {/* Favorite & Watched Actions on Episode Detail Page */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMemoryPalace({ ...toggleMemoryPalacePinned(episode.id) })}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    memoryPalace.pinnedIds.includes(episode.id)
                      ? 'bg-red-600/20 border-red-400 text-red-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-200'
                  }`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${
                      memoryPalace.pinnedIds.includes(episode.id) ? 'fill-red-400 text-red-400' : ''
                    }`}
                  />
                  <span>
                    {memoryPalace.pinnedIds.includes(episode.id)
                      ? 'Saved in Favorites'
                      : 'Add to Favorites'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemoryPalace({ ...toggleMemoryPalaceSolved(episode.id) })}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    memoryPalace.solvedIds.includes(episode.id)
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {memoryPalace.solvedIds.includes(episode.id)
                      ? 'Episode Watched'
                      : 'Mark as Watched'}
                  </span>
                </button>
              </div>
            </div>

            {/* Official Case Summary */}
            <div className="rounded-2xl bg-black/70 border border-white/10 p-5">
              <div className="flex items-center gap-2 text-xs font-mono-code uppercase text-red-400 font-semibold mb-2">
                <FileText className="h-4 w-4" />
                <span>Case Synopsis</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-100 leading-relaxed max-w-prose">
                {analysis.cleanSummary || 'No official summary available.'}
              </p>
            </div>

            {/* Progressive Disclosure: Extended Story Recap */}
            {wikiArticle && (wikiArticle.recap || wikiArticle.overview) && (
              <div className="rounded-2xl bg-black/70 border border-white/10 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono-code uppercase text-red-400 font-semibold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Full Episode Story</span>
                  </div>
                  {wikiArticle.wikiUrl && (
                    <a
                      href={wikiArticle.wikiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono-code text-zinc-400 hover:text-red-300"
                    >
                      <span>Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <p
                  className={`text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-prose whitespace-pre-line ${
                    expandFullRecap ? '' : 'line-clamp-3'
                  }`}
                >
                  {[wikiArticle.overview, wikiArticle.recap].filter(Boolean).join('\n\n')}
                </p>

                <button
                  type="button"
                  onClick={() => setExpandFullRecap((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-code text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  <span>
                    {expandFullRecap ? 'Collapse Extended Story' : 'Read Full Story Recap'}
                  </span>
                  {expandFullRecap ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Episode Guest Cast Section (Capped at 4 initially with Show More toggle!) */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-white font-serif-title flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              <span>
                Episode Guest Cast (Showing {visibleGuestCast.length} of {guestCast.length})
              </span>
            </h2>

            {guestCast.length > INITIAL_GUEST_CAST_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllGuestCast((prev) => !prev)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-red-300 transition cursor-pointer"
              >
                <span>
                  {showAllGuestCast
                    ? 'Show Top 4 Guest Cast Only'
                    : `Show All ${guestCast.length} Guest Cast (+${hiddenGuestCount} More)`}
                </span>
                {showAllGuestCast ? (
                  <ChevronUp className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-red-400" />
                )}
              </button>
            )}
          </div>

          {guestCast.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No additional guest cast records returned for this episode by TVmaze.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {visibleGuestCast.map((item, idx) => {
                const img =
                  item.character?.image?.medium ||
                  item.person?.image?.medium ||
                  item.person?.image?.original;
                return (
                  <Link
                    key={`${item.person?.id}-${idx}`}
                    to={`/characters/${item.person?.id}`}
                    className="glass-card-interactive group rounded-xl p-3 flex items-center gap-3 animate-fade-slide"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={item.person?.name}
                        className="h-12 w-12 rounded-xl object-cover border border-white/15 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] text-zinc-500 shrink-0">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400">
                        {item.character?.name || 'Guest Role'}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {item.person?.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
