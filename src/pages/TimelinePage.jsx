import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  Star,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchEpisodeDetails,
  fetchFandomWikiArticle,
  fetchShowEpisodes,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';

/**
 * Interactive Two-Act Story Timeline Page (/timeline).
 * Displays episodes on a Crime-Scene Evidence Table / Detective Corkboard where each
 * episode Polaroid card is pinned with a crimson push-pin and linked to the next
 * episode by glowing SVG red strings. Visitors can toggle between the Evidence Table
 * view and the Classic Vertical Timeline view.
 */
export default function TimelinePage() {
  const [episodes, setEpisodes] = useState([]);
  const [redJohnLore, setRedJohnLore] = useState(null);
  const [showRedJohnDossier, setShowRedJohnDossier] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loadingRecapId, setLoadingRecapId] = useState(null);

  const [boardLayout, setBoardLayout] = useState('EVIDENCE_BOARD'); // 'EVIDENCE_BOARD' or 'VERTICAL_LIST'
  const [selectedAct, setSelectedAct] = useState('ALL'); // 'ALL', 'RED_JOHN_ACT', 'FBI_ACT'
  const [onlyMilestones, setOnlyMilestones] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads all 151 episodes from TVmaze and fetches Red John context.
   */
  const loadTimelineData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allEpisodes, rjWiki] = await Promise.all([
        fetchShowEpisodes(),
        fetchFandomWikiArticle('Red John'),
      ]);

      setEpisodes(allEpisodes);
      setRedJohnLore(rjWiki);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimelineData();
  }, [loadTimelineData]);

  /**
   * Progressive Disclosure Handler: Fetches and toggles the extended story recap
   * and guest cast for a specific timeline episode node on demand.
   */
  const handleToggleNodeExpansion = async (episode) => {
    if (expandedNodes[episode.id]) {
      setExpandedNodes((prev) => {
        const updated = { ...prev };
        delete updated[episode.id];
        return updated;
      });
      return;
    }

    setLoadingRecapId(episode.id);
    try {
      const wikiQueryTitle =
        episode.season === 6 && episode.number === 8 ? 'Red John (episode)' : episode.name;

      const [wikiData, detailData] = await Promise.all([
        fetchFandomWikiArticle(wikiQueryTitle),
        fetchEpisodeDetails(episode.id),
      ]);

      setExpandedNodes((prev) => ({
        ...prev,
        [episode.id]: {
          wiki: wikiData,
          details: detailData,
        },
      }));
    } finally {
      setLoadingRecapId(null);
    }
  };

  // Enrich episodes with milestone analysis and filter according to user controls
  const filteredTimeline = useMemo(() => {
    return episodes
      .map((ep) => ({
        ...ep,
        analysis: analyzeEpisodeMilestone(ep),
      }))
      .filter((ep) => {
        if (onlyMilestones && !ep.analysis.isMilestone) return false;
        if (selectedAct !== 'ALL' && ep.analysis.act !== selectedAct) return false;
        if (selectedSeason !== 'ALL' && ep.season !== Number(selectedSeason)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inTitle = ep.name.toLowerCase().includes(q);
          const inSummary = ep.analysis.cleanSummary.toLowerCase().includes(q);
          const inTag = ep.analysis.milestoneTag.toLowerCase().includes(q);
          return inTitle || inSummary || inTag;
        }
        return true;
      });
  }, [episodes, onlyMilestones, selectedAct, selectedSeason, searchQuery]);

  const actOneEpisodes = useMemo(
    () => filteredTimeline.filter((ep) => ep.analysis.act === 'RED_JOHN_ACT'),
    [filteredTimeline]
  );

  const actTwoEpisodes = useMemo(
    () => filteredTimeline.filter((ep) => ep.analysis.act === 'FBI_ACT'),
    [filteredTimeline]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Pinning chronological case files onto the Evidence Board..."
          endpointHint="api.tvmaze.com/shows/116/episodes"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadTimelineData} />
      </div>
    );
  }

  /**
   * Renders an Evidence Board Grid where Episode Polaroid cards are pinned to a
   * crime-scene table and linked to the next episode with glowing SVG red strings.
   */
  const renderEvidenceBoard = (episodeList) => {
    return (
      <div className="relative rounded-3xl border border-red-900/40 bg-[#0d0c12]/90 p-5 sm:p-8 overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] bg-[radial-gradient(#ef44441f_1px,transparent_1px)] [background-size:22px_22px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14 relative z-10">
          {episodeList.map((ep, index) => {
            const expandedData = expandedNodes[ep.id];
            const isExpanded = Boolean(expandedData);
            const wikiArticle = expandedData?.wiki;
            const guestCast = expandedData?.details?._embedded?.guestcast || [];
            const isEven = index % 2 === 0;
            const hasNext = index < episodeList.length - 1;

            const isCornerstone =
              (ep.season === 1 && ep.number === 1) ||
              (ep.season === 6 && ep.number === 8) ||
              (ep.season === 6 && ep.number === 9) ||
              (ep.season === 7 && ep.number === 13);

            // Slight organic Polaroid tilt on the evidence board
            const tiltClass = isEven ? 'md:-rotate-[0.7deg]' : 'md:rotate-[0.7deg] md:mt-8';

            return (
              <div key={ep.id} className={`relative ${tiltClass} transition-transform hover:rotate-0`}>
                {/* SVG Red String linking this card's push-pin to the next card in the sequence */}
                {hasNext && (
                  <>
                    {/* Desktop Diagonal / Zig-Zag Red String between Left and Right Columns */}
                    <svg
                      aria-hidden="true"
                      className={`hidden md:block pointer-events-none absolute top-3 z-0 overflow-visible ${
                        isEven ? 'left-1/2 w-[112%] h-24' : 'right-1/2 w-[112%] h-44'
                      }`}
                      viewBox="0 0 400 120"
                      preserveAspectRatio="none"
                    >
                      {isEven ? (
                        <path
                          d="M 0,4 Q 200,55 400,28"
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2.8"
                          strokeDasharray="6 3"
                          className="drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]"
                        />
                      ) : (
                        <path
                          d="M 400,4 Q 200,95 0,115"
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2.8"
                          strokeDasharray="6 3"
                          className="drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]"
                        />
                      )}
                    </svg>

                    {/* Mobile Vertical Red String connecting down to next card */}
                    <div
                      aria-hidden="true"
                      className="md:hidden pointer-events-none absolute left-1/2 -bottom-14 h-14 w-0.5 bg-gradient-to-b from-red-500 to-red-700 shadow-[0_0_10px_rgba(239,68,68,0.9)] z-0"
                    />
                  </>
                )}

                {/* 3D Red Push-Pin at the top center of the Evidence Card */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-[0_4px_14px_rgba(220,38,38,0.9)] ${
                      isCornerstone
                        ? 'bg-red-500 border-white text-white scale-110'
                        : 'bg-gradient-to-br from-red-500 to-red-800 border-red-300 text-white'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="h-2 w-0.5 bg-zinc-400" />
                </div>

                {/* Polaroid Evidence Dossier Card */}
                <article
                  className={`relative z-10 rounded-2xl border p-4 sm:p-5 bg-[#13131b]/95 shadow-[0_14px_35px_rgba(0,0,0,0.8)] transition-all text-left ${
                    isCornerstone
                      ? 'border-red-500/80 ring-1 ring-red-500/40'
                      : 'border-white/15 hover:border-red-500/60'
                  }`}
                >
                  {/* Polaroid Photo Frame */}
                  <Link
                    to={`/episodes/${ep.id}`}
                    className="block relative h-44 w-full rounded-xl overflow-hidden bg-black border border-white/10 mb-3.5 group"
                  >
                    {ep.image?.original || ep.image?.medium ? (
                      <img
                        src={ep.image.original || ep.image.medium}
                        alt={ep.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                        No Case Photo
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-white">
                      S{String(ep.season).padStart(2, '0')}E{String(ep.number).padStart(2, '0')}
                    </span>

                    {ep.rating?.average && (
                      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md text-xs font-bold text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{ep.rating.average}</span>
                      </span>
                    )}

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600/90 text-[11px] font-semibold text-white truncate">
                        {ep.analysis.milestoneTag}
                      </span>
                      <span className="text-xs text-zinc-200 inline-flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3 text-red-400" />
                        {ep.airdate}
                      </span>
                    </div>
                  </Link>

                  {/* Case Headline & 2-Line Progressive Disclosure Summary */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5] font-serif-title">
                    Season {ep.season}, Episode {ep.number}: {ep.name}
                  </h3>

                  <p
                    className={`text-base text-zinc-200 leading-[1.5] mt-1.5 max-w-[65ch] ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {ep.analysis.cleanSummary}
                  </p>

                  {/* Action Row */}
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleNodeExpansion(ep)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-red-400 transition cursor-pointer"
                    >
                      {loadingRecapId === ep.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                          <span>Opening Dossier...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {isExpanded ? 'Hide Evidence Notes' : 'Read Case Notes & Guests'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-red-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-red-400" />
                          )}
                        </>
                      )}
                    </button>

                    <Link
                      to={`/episodes/${ep.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition"
                    >
                      <span>Open Case File</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Expanded Evidence Drawer */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-3 animate-fade-slide">
                      {wikiArticle && (wikiArticle.recap || wikiArticle.overview) && (
                        <div className="rounded-xl bg-black/70 border border-white/10 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-red-400 uppercase mb-1">
                            <span>Detailed Episode Story</span>
                            {wikiArticle.infobox?.Writer && (
                              <span className="text-zinc-400">
                                Writer: {wikiArticle.infobox.Writer}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-200 leading-[1.5] line-clamp-5">
                            {wikiArticle.recap || wikiArticle.overview}
                          </p>
                        </div>
                      )}

                      {guestCast.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-400 mr-1">
                            Guests:
                          </span>
                          {guestCast.slice(0, 5).map((g, idx) => (
                            <span
                              key={`${g.person?.id}-${idx}`}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-200"
                            >
                              {g.character?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Renders the classic F-Pattern vertical timeline track when user toggles List View.
   */
  const renderVerticalTimelineNode = (ep, index) => {
    const expandedData = expandedNodes[ep.id];
    const isExpanded = Boolean(expandedData);
    const wikiArticle = expandedData?.wiki;
    const guestCast = expandedData?.details?._embedded?.guestcast || [];
    const isCornerstone =
      (ep.season === 1 && ep.number === 1) ||
      (ep.season === 6 && ep.number === 8) ||
      (ep.season === 6 && ep.number === 9) ||
      (ep.season === 7 && ep.number === 13);

    return (
      <div key={ep.id} className="relative pl-8 sm:pl-11 py-3">
        <div className="absolute left-3 sm:left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-red-800 to-zinc-900" />
        <div
          className={`absolute left-0.5 sm:left-1 top-6 h-5 w-5 rounded-full border flex items-center justify-center text-[9px] font-mono-code font-bold ${
            isCornerstone
              ? 'bg-red-600 border-white text-white shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-110'
              : 'bg-red-950 border-red-500 text-red-200'
          }`}
        >
          {index + 1}
        </div>

        <div className="glass-card-interactive rounded-2xl p-4 sm:p-5 text-left">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link
              to={`/episodes/${ep.id}`}
              className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 group"
            >
              {ep.image?.medium || ep.image?.original ? (
                <img
                  src={ep.image.medium || ep.image.original}
                  alt={ep.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : null}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-xs font-mono-code font-bold text-white">
                S{String(ep.season).padStart(2, '0')}E{String(ep.number).padStart(2, '0')}
              </span>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-red-400">
                  {ep.analysis.milestoneTag}
                </span>
                <span className="text-xs text-zinc-400">{ep.airdate}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5] font-serif-title">
                Season {ep.season} - Episode {ep.number} : {ep.name}
              </h3>
              <p
                className={`text-base text-zinc-200 leading-[1.5] mt-1 max-w-[65ch] ${
                  isExpanded ? '' : 'line-clamp-2'
                }`}
              >
                {ep.analysis.cleanSummary}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleNodeExpansion(ep)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-red-400 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Details' : 'Expand Story & Guests'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <Link
                  to={`/episodes/${ep.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300"
                >
                  <span>Case File</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-fade-slide">
              {wikiArticle && (wikiArticle.recap || wikiArticle.overview) && (
                <p className="text-sm text-zinc-300 leading-[1.5]">
                  {wikiArticle.recap || wikiArticle.overview}
                </p>
              )}
              {guestCast.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {guestCast.slice(0, 6).map((g, idx) => (
                    <span
                      key={`${g.person?.id}-${idx}`}
                      className="px-2.5 py-0.5 rounded bg-zinc-900 text-xs text-zinc-300"
                    >
                      {g.character?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Compact Timeline Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>CBI Evidence Table &amp; Red String Case Timeline</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f5] font-serif-title">
              The Mentalist Evidence Board Timeline
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
              Follow the crimson thread connecting Patrick Jane&apos;s investigation from{' '}
              <strong className="text-white">S01E01 (&ldquo;Pilot&rdquo;)</strong> to{' '}
              <strong className="text-red-400">S06E08 (&ldquo;Red John&rdquo;)</strong>, and into{' '}
              <strong className="text-white">Act II: The FBI Era (S06E09–S07E13)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            {/* Switch between Red String Evidence Table and Vertical List */}
            <div className="inline-flex rounded-xl bg-[#0d0d13] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setBoardLayout('EVIDENCE_BOARD')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  boardLayout === 'EVIDENCE_BOARD'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Evidence Board</span>
              </button>
              <button
                type="button"
                onClick={() => setBoardLayout('VERTICAL_LIST')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  boardLayout === 'VERTICAL_LIST'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>List View</span>
              </button>
            </div>

            {redJohnLore?.overview && (
              <button
                type="button"
                onClick={() => setShowRedJohnDossier((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-red-300 transition cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>{showRedJohnDossier ? 'Hide Red John File' : 'Who Is Red John?'}</span>
                {showRedJohnDossier ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progressive Disclosure: Red John Background Dossier */}
        {showRedJohnDossier && redJohnLore?.overview && (
          <div className="mt-4 rounded-2xl bg-[#0d0d13] border border-red-500/40 p-4 text-base text-zinc-200 leading-[1.5] max-w-[65ch] animate-fade-slide">
            <span className="text-red-400 uppercase text-xs font-bold block mb-1">
              Who Is Red John?
            </span>
            {redJohnLore.overview}
          </div>
        )}

        {/* Filter & Act Navigation Controls */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedAct('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedAct === 'ALL'
                  ? 'bg-red-600 text-white border-red-400 shadow'
                  : 'bg-zinc-900/90 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Both Acts
            </button>
            <button
              type="button"
              onClick={() => setSelectedAct('RED_JOHN_ACT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedAct === 'RED_JOHN_ACT'
                  ? 'bg-red-600 text-white border-red-400 shadow'
                  : 'bg-zinc-900/90 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Act I: Red John (S1–S6E8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedAct('FBI_ACT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedAct === 'FBI_ACT'
                  ? 'bg-red-600 text-white border-red-400 shadow'
                  : 'bg-zinc-900/90 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Act II: FBI Era (S6E9–S7E13)
            </button>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-end justify-end gap-2.5">
            <div className="flex-1 min-w-[170px] text-left">
              <label
                htmlFor="timeline-search-input"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Search Timeline Cases
              </label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="timeline-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Red John, Pilot..."
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 pl-8 pr-3 text-xs text-[#f5f5f5] placeholder-zinc-500"
                />
              </div>
            </div>

            <div className="text-left">
              <label
                htmlFor="timeline-season-select"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Season
              </label>
              <select
                id="timeline-season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-zinc-200"
              >
                <option value="ALL">All Seasons</option>
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <option key={s} value={s}>
                    Season {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setOnlyMilestones((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                onlyMilestones
                  ? 'bg-red-600/20 border-red-500/50 text-red-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-300'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{onlyMilestones ? 'Key Milestones' : 'All 151 Cases'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACT I: THE RED JOHN HUNT (S01E01 -> S06E08) */}
      {(selectedAct === 'ALL' || selectedAct === 'RED_JOHN_ACT') && (
        <section className="mb-12">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-red-400">
                  ACT I • CBI EVIDENCE BOARD
                </span>
                <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title">
                  The Red John Pursuit: Season 1, Episode 1 → Season 6, Episode 8
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 shrink-0">
              {actOneEpisodes.length} Pinned Cases
            </span>
          </div>

          {actOneEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-8 text-center text-base text-zinc-400">
              No Act I episodes match your current filter.
            </div>
          ) : boardLayout === 'EVIDENCE_BOARD' ? (
            renderEvidenceBoard(actOneEpisodes)
          ) : (
            <div>{actOneEpisodes.map((ep, idx) => renderVerticalTimelineNode(ep, idx))}</div>
          )}
        </section>
      )}

      {/* ACT TRANSITION DIVIDER (S06E08 -> S06E09) */}
      {selectedAct === 'ALL' && (
        <div className="my-12 rounded-2xl border border-red-500/50 bg-gradient-to-r from-[#0b0b10] via-red-950/50 to-[#0b0b10] p-6 text-center">
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase">
            Turning Point • After Season 6, Episode 8 (&ldquo;Red John&rdquo;)
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#f5f5f5] font-serif-title mt-2">
            Red John Case Closed → Two Years Later: The FBI Era Begins
          </h3>
          <p className="text-sm text-zinc-300 max-w-2xl mx-auto mt-1">
            Starting in S06E09 (&ldquo;My Blue Heaven&rdquo;), Jane and Lisbon reunite at the FBI in Austin,
            Texas, and episode titles transition from shades of Red to new colors.
          </p>
        </div>
      )}

      {/* ACT II: THE FBI ERA (S06E09 -> S07E13) */}
      {(selectedAct === 'ALL' || selectedAct === 'FBI_ACT') && (
        <section>
          <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-red-400">
                  ACT II • FBI CASE BOARD (AUSTIN, TEXAS)
                </span>
                <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title">
                  The FBI Era: Season 6, Episode 9 → Season 7, Episode 13
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 shrink-0">
              {actTwoEpisodes.length} Pinned Cases
            </span>
          </div>

          {actTwoEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-8 text-center text-base text-zinc-400">
              No Act II episodes match your current filter.
            </div>
          ) : boardLayout === 'EVIDENCE_BOARD' ? (
            renderEvidenceBoard(actTwoEpisodes)
          ) : (
            <div>{actTwoEpisodes.map((ep, idx) => renderVerticalTimelineNode(ep, idx))}</div>
          )}
        </section>
      )}
    </div>
  );
}
