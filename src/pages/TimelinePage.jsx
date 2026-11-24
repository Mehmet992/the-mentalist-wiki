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
 * Uses a clean F-Pattern vertical chronological track with Progressive Disclosure:
 * - Act I (S01E01 "Pilot" -> S06E08 "Red John"): Traces Patrick Jane's CBI cases and the hunt for Red John.
 * - Act II (S06E09 "My Blue Heaven" -> S07E13 "White Orchids"): Traces the post-Red John transition to the FBI.
 */
export default function TimelinePage() {
  const [episodes, setEpisodes] = useState([]);
  const [redJohnLore, setRedJohnLore] = useState(null);
  const [showRedJohnDossier, setShowRedJohnDossier] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [loadingRecapId, setLoadingRecapId] = useState(null);

  const [selectedAct, setSelectedAct] = useState('ALL'); // 'ALL', 'RED_JOHN_ACT', 'FBI_ACT'
  const [onlyMilestones, setOnlyMilestones] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads all 151 episodes and fetches Red John context.
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
          message="Constructing the Two-Act Chronological Timeline..."
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
   * Renders a compact F-Pattern timeline card along the vertical chronological track.
   */
  const renderTimelineNode = (ep, index) => {
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
        {/* Timeline Vertical Connector Line */}
        <div className="absolute left-3 sm:left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600/70 via-zinc-800 to-zinc-900" />

        {/* Timeline Node Circle Indicator */}
        <div
          className={`absolute left-0.5 sm:left-1 top-6 h-5 w-5 rounded-full border flex items-center justify-center text-[9px] font-mono-code font-bold ${
            isCornerstone
              ? 'bg-red-600 border-white text-white shadow-[0_0_15px_rgba(239,68,68,0.9)] scale-110'
              : ep.analysis.mentionsRedJohn
              ? 'bg-red-950 border-red-500 text-red-200'
              : 'bg-zinc-900 border-white/20 text-zinc-400'
          }`}
        >
          {index + 1}
        </div>

        {/* Compact F-Pattern Horizontal Card */}
        <div
          className={`glass-card-interactive rounded-2xl p-4 sm:p-5 text-left ${
            isCornerstone ? 'border-red-500/70' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* F-Pattern Left Visual Anchor: Compact Thumbnail */}
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                  No Image
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono-code font-bold text-white border border-white/15">
                S{String(ep.season).padStart(2, '0')}E{String(ep.number).padStart(2, '0')}
              </span>
            </Link>

            {/* F-Pattern Right Content: Scannable Header + 2-Line Bite-Sized Hook */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-red-400">
                    {ep.analysis.milestoneTag}
                  </span>
                  {ep.analysis.mentionsRedJohn && (
                    <span className="px-2 py-0.5 rounded bg-red-600/20 border border-red-500/40 text-[10px] font-semibold text-red-300 uppercase">
                      Red John Arc
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono-code text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-red-400" />
                    <span>{ep.airdate}</span>
                  </span>
                  {ep.rating?.average && (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{ep.rating.average}</span>
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5] font-serif-title">
                Season {ep.season} - Episode {ep.number} : {ep.name}
              </h3>

              {/* Progressive Disclosure: Strict 2-line clamp when collapsed */}
              <p
                className={`text-base text-zinc-200 leading-[1.5] mt-1 max-w-[65ch] ${
                  isExpanded ? '' : 'line-clamp-2'
                }`}
              >
                {ep.analysis.cleanSummary}
              </p>

              {/* Compact Bottom Action Row */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleNodeExpansion(ep)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-red-400 transition cursor-pointer"
                >
                  {loadingRecapId === ep.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                      <span>Loading Story Recap...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isExpanded ? 'Hide Extended Story & Guests' : 'Expand Story & Guests'}
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
                  <span>Case File</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Progressive Disclosure Drawer */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-fade-slide">
              {wikiArticle && (wikiArticle.recap || wikiArticle.overview) && (
                <div className="rounded-xl bg-black/70 border border-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-red-400 uppercase mb-1.5">
                    <span>Detailed Episode Story</span>
                    {wikiArticle.infobox?.Writer && (
                      <span className="text-zinc-400">
                        Writer: {wikiArticle.infobox.Writer} | Director:{' '}
                        {wikiArticle.infobox.Director || 'N/A'}
                      </span>
                    )}
                  </div>
                  <p className="text-base text-zinc-200 leading-[1.5] max-w-[65ch] line-clamp-5">
                    {wikiArticle.recap || wikiArticle.overview}
                  </p>
                </div>
              )}

              {guestCast.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-400 mr-1">
                    Episode Guest Cast:
                  </span>
                  {guestCast.slice(0, 6).map((g, idx) => (
                    <span
                      key={`${g.person?.id}-${idx}`}
                      className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-xs text-zinc-300"
                    >
                      <strong className="text-white">{g.character?.name}</strong>{' '}
                      <span className="text-zinc-400">({g.person?.name})</span>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Compact Timeline Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Chronological Series Roadmap • 2 Acts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f5f5f5] font-serif-title">
              The Mentalist Story Timeline
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
              Trace Patrick Jane&apos;s journey from{' '}
              <strong className="text-white">S01E01 (&ldquo;Pilot&rdquo;)</strong> to the Red John
              showdown in <strong className="text-red-400">S06E08 (&ldquo;Red John&rdquo;)</strong>,
              and into <strong className="text-white">Act II: The FBI Era (S06E09–S07E13)</strong>.
            </p>
          </div>

          {redJohnLore?.overview && (
            <button
              type="button"
              onClick={() => setShowRedJohnDossier((prev) => !prev)}
              className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-red-300 transition cursor-pointer shrink-0"
            >
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span>{showRedJohnDossier ? 'Hide Red John Dossier' : 'Who Is Red John?'}</span>
              {showRedJohnDossier ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Progressive Disclosure: Full-Width Red John Background Dossier */}
        {showRedJohnDossier && redJohnLore?.overview && (
          <div className="mt-4 w-full rounded-2xl bg-[#0d0d13] border border-red-500/40 p-5 text-base text-zinc-200 leading-[1.6] animate-fade-slide">
            <span className="text-red-400 uppercase text-xs font-bold block mb-1.5">
              Who Is Red John?
            </span>
            <p className="w-full">{redJohnLore.overview}</p>
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
          <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-4 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-red-400">
                  ACT I • CBI &amp; THE RED JOHN PURSUIT
                </span>
                <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title">
                  Season 1, Episode 1 (&ldquo;Pilot&rdquo;) → Season 6, Episode 8 (&ldquo;Red John&rdquo;)
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 shrink-0">
              {actOneEpisodes.length} Cases
            </span>
          </div>

          {actOneEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-8 text-center text-base text-zinc-400">
              No Act I episodes match your current filter.
            </div>
          ) : (
            <div>{actOneEpisodes.map((ep, idx) => renderTimelineNode(ep, idx))}</div>
          )}
        </section>
      )}

      {/* ACT TRANSITION DIVIDER (S06E08 -> S06E09) */}
      {selectedAct === 'ALL' && (
        <div className="my-10 rounded-2xl border border-red-500/50 bg-gradient-to-r from-[#0b0b10] via-red-950/50 to-[#0b0b10] p-6 text-center">
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
          <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-4 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-red-400">
                  ACT II • FEDERAL BUREAU OF INVESTIGATION
                </span>
                <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title">
                  Season 6, Episode 9 (&ldquo;My Blue Heaven&rdquo;) → Season 7, Episode 13 (&ldquo;White Orchids&rdquo;)
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 shrink-0">
              {actTwoEpisodes.length} Cases
            </span>
          </div>

          {actTwoEpisodes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-8 text-center text-base text-zinc-400">
              No Act II episodes match your current filter.
            </div>
          ) : (
            <div>{actTwoEpisodes.map((ep, idx) => renderTimelineNode(ep, idx))}</div>
          )}
        </section>
      )}
    </div>
  );
}
