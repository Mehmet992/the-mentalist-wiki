import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Star,
  X,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchShowCrew,
  fetchShowEpisodes,
  fetchShowImages,
  fetchShowSeasons,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';

/**
 * Seasons, Rating Trends, Official Artwork Lightbox & Crew Page (/seasons).
 * Combines live data from /shows/116/seasons, /shows/116/episodes, /shows/116/images,
 * and /shows/116/crew.
 */
export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [crew, setCrew] = useState([]);
  const [images, setImages] = useState([]);

  const [expandedSeasonNumber, setExpandedSeasonNumber] = useState(null);
  const [crewRoleFilter, setCrewRoleFilter] = useState('ALL');
  const [showAllCrew, setShowAllCrew] = useState(false);

  // Official Artwork Gallery & Lightbox states
  const [imageTypeFilter, setImageTypeFilter] = useState('ALL');
  const [showAllImages, setShowAllImages] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches seasons, episodes, production crew, and official artwork in parallel from TVmaze API.
   */
  const loadSeasonsAndCrew = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [seasonsData, episodesData, crewData, imagesData] = await Promise.all([
        fetchShowSeasons(),
        fetchShowEpisodes(),
        fetchShowCrew(),
        fetchShowImages(),
      ]);

      setSeasons(seasonsData);
      setEpisodes(episodesData);
      setCrew(crewData);
      setImages(imagesData || []);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeasonsAndCrew();
  }, [loadSeasonsAndCrew]);

  // Compute aggregated metrics for each season from the live episodes payload
  const enrichedSeasons = useMemo(() => {
    return seasons.map((season) => {
      const seasonEps = episodes.filter((e) => e.season === season.number);
      const rated = seasonEps.filter((e) => typeof e.rating?.average === 'number');
      const avgRating =
        rated.length > 0
          ? (
              rated.reduce((sum, ep) => sum + ep.rating.average, 0) / rated.length
            ).toFixed(2)
          : 'N/A';

      const topEp =
        rated.length > 0
          ? [...rated].sort((a, b) => b.rating.average - a.rating.average)[0]
          : null;

      return {
        ...season,
        seasonEpisodes: seasonEps,
        avgRating,
        topEp,
      };
    });
  }, [seasons, episodes]);

  const crewRoles = useMemo(() => {
    const roles = new Set(crew.map((c) => c.type).filter(Boolean));
    return ['ALL', ...Array.from(roles)];
  }, [crew]);

  const filteredCrew = useMemo(() => {
    if (crewRoleFilter === 'ALL') return crew;
    return crew.filter((c) => c.type === crewRoleFilter);
  }, [crew, crewRoleFilter]);

  const visibleCrew = showAllCrew ? filteredCrew : filteredCrew.slice(0, 8);

  // Filter official artwork by type ('poster', 'banner', 'background')
  const imageTypes = useMemo(() => {
    const types = new Set(images.map((img) => img.type).filter(Boolean));
    return ['ALL', ...Array.from(types)];
  }, [images]);

  const filteredImages = useMemo(() => {
    if (imageTypeFilter === 'ALL') return images;
    return images.filter((img) => img.type === imageTypeFilter);
  }, [images, imageTypeFilter]);

  const visibleImages = showAllImages ? filteredImages : filteredImages.slice(0, 4);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Fetching all 7 seasons, rating analytics, artwork, and crew from TVmaze API..."
          endpointHint="api.tvmaze.com/shows/116/seasons"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadSeasonsAndCrew} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-mono-code uppercase mb-2">
          <Layers className="h-3.5 w-3.5" />
          <span>7 Seasons, Rating Analytics &amp; Official Artwork • Live API</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-title">
          Seasons, Rating Trends &amp; Artwork Archive
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-prose">
          Explore all 7 broadcast seasons (2008–2015) with interactive episode rating trend
          charts, official posters &amp; artwork lightbox, and the series production crew.
        </p>
      </div>

      {/* 7 Seasons Cards with Interactive Rating Trend Charts */}
      <div className="space-y-6">
        {enrichedSeasons.map((season) => {
          const isExpanded = expandedSeasonNumber === season.number;
          return (
            <div key={season.id} className="glass-panel rounded-3xl overflow-hidden">
              {/* Season Summary & Interactive Rating Chart Row */}
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left 6 Cols: Poster & Season Metadata */}
                <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center gap-5">
                  {season.image?.medium || season.image?.original ? (
                    <img
                      src={season.image.medium || season.image.original}
                      alt={`Season ${season.number}`}
                      className="w-24 h-36 object-cover rounded-2xl border border-white/15 shrink-0 cursor-pointer hover:scale-105 transition"
                      onClick={() =>
                        setLightboxImage({
                          url: season.image.original || season.image.medium,
                          title: `The Mentalist — Season ${season.number} Official Poster`,
                          type: 'season poster',
                        })
                      }
                    />
                  ) : null}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-red-600/20 border border-red-500/40 text-xs font-mono-code text-red-300 font-bold">
                        SEASON {season.number}
                      </span>
                      <span className="text-xs font-mono-code text-zinc-400">
                        {season.number <= 5
                          ? 'Act I: Red John Era'
                          : season.number === 6
                          ? 'Turning Point: Red John → FBI'
                          : 'Act II: Final FBI Season'}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white font-serif-title">
                      The Mentalist — Season {season.number}
                    </h2>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-red-400" />
                        <span>
                          {season.premiereDate} → {season.endDate}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-white">{season.seasonEpisodes.length}</strong>{' '}
                        Episodes
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{season.avgRating} Avg</span>
                      </span>
                    </div>

                    {season.topEp && (
                      <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-white/10 text-xs text-zinc-300">
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        <span>
                          Peak:{' '}
                          <Link
                            to={`/episodes/${season.topEp.id}`}
                            className="text-red-400 hover:text-red-300 font-semibold underline"
                          >
                            E{season.topEp.number} &ldquo;{season.topEp.name}&rdquo; (★{' '}
                            {season.topEp.rating?.average})
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 6 Cols: Interactive Episode Rating Bar Chart */}
                <div className="lg:col-span-6 rounded-2xl bg-black/70 border border-white/10 p-4">
                  <div className="flex items-center justify-between text-[11px] font-mono-code text-zinc-400 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                      <BarChart3 className="h-3.5 w-3.5 text-red-400" />
                      <span>Interactive Rating Trend (Click any bar)</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Red John</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span>Case</span>
                      </span>
                    </div>
                  </div>

                  {/* Bar Chart Track */}
                  <div className="h-20 flex items-end gap-1.5 pt-2">
                    {season.seasonEpisodes.map((ep) => {
                      const rating = ep.rating?.average || 7.5;
                      const heightPct = Math.min(
                        100,
                        Math.max(25, Math.round(((rating - 6.8) / 2.6) * 100))
                      );
                      const isRj = analyzeEpisodeMilestone(ep).mentionsRedJohn;

                      return (
                        <Link
                          key={ep.id}
                          to={`/episodes/${ep.id}`}
                          title={`S${ep.season}E${ep.number}: "${ep.name}" — Rating: ★ ${rating}`}
                          className="flex-1 h-full flex flex-col justify-end group relative"
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t-md transition-all group-hover:brightness-125 ${
                              isRj
                                ? 'bg-gradient-to-t from-red-700 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                : 'bg-gradient-to-t from-zinc-700 to-amber-400/85'
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono-code text-zinc-500">
                      E01 → E{String(season.seasonEpisodes.length).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSeasonNumber(isExpanded ? null : season.number)
                      }
                      className="inline-flex items-center gap-1 text-xs font-mono-code text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? 'Hide Episode List'
                          : `Expand All ${season.seasonEpisodes.length} Episodes`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure: Expandable Season Episodes List */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-black/75 p-5 sm:p-6 animate-fade-slide">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {season.seasonEpisodes.map((ep) => (
                      <Link
                        key={ep.id}
                        to={`/episodes/${ep.id}`}
                        className="group rounded-xl border border-white/10 hover:border-red-500/60 bg-zinc-900/70 p-3 flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] font-mono-code text-red-400">
                            <span>
                              S{String(ep.season).padStart(2, '0')}E
                              {String(ep.number).padStart(2, '0')}
                            </span>
                            <span>•</span>
                            <span className="text-zinc-500">{ep.airdate}</span>
                            {ep.rating?.average && (
                              <span className="text-amber-400">★ {ep.rating.average}</span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400 mt-0.5">
                            {ep.name}
                          </h4>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-red-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add-on #4: Official Posters & Artwork Lightbox Gallery (GET /shows/116/images) */}
      {images.length > 0 && (
        <section className="mt-14 glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono-code uppercase text-red-400 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Fetched from api.tvmaze.com/shows/116/images</span>
              </span>
              <h2 className="text-2xl font-bold text-white font-serif-title mt-1">
                Official Posters &amp; Artwork Gallery (Showing {visibleImages.length} of{' '}
                {filteredImages.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-end gap-2.5">
              <div className="text-left">
                <label
                  htmlFor="seasons-artwork-type-select"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Artwork Category
                </label>
                <select
                  id="seasons-artwork-type-select"
                  value={imageTypeFilter}
                  onChange={(e) => {
                    setImageTypeFilter(e.target.value);
                    setShowAllImages(false);
                  }}
                  className="h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-zinc-200"
                >
                  {imageTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'All Artwork Types' : `Type: ${type.toUpperCase()}`}
                    </option>
                  ))}
                </select>
              </div>

              {filteredImages.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllImages((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-red-300 transition cursor-pointer"
                >
                  <span>
                    {showAllImages
                      ? 'Show Top 4 Only'
                      : `Expand All ${filteredImages.length} Artworks`}
                  </span>
                  {showAllImages ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleImages.map((img) => {
              const thumbUrl =
                img.resolutions?.medium?.url || img.resolutions?.original?.url;
              const fullUrl =
                img.resolutions?.original?.url || img.resolutions?.medium?.url;
              const width = img.resolutions?.original?.width;
              const height = img.resolutions?.original?.height;

              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() =>
                    setLightboxImage({
                      url: fullUrl,
                      title: `Official ${img.type || 'Series'} Artwork (#${img.id})`,
                      type: img.type || 'artwork',
                      dimensions: width && height ? `${width} × ${height}px` : null,
                    })
                  }
                  className="glass-card-interactive group rounded-2xl overflow-hidden text-left relative cursor-pointer"
                >
                  <div className="h-56 w-full bg-black overflow-hidden relative">
                    <img
                      src={thumbUrl}
                      alt={`The Mentalist ${img.type || 'Artwork'}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] font-mono-code uppercase text-red-300">
                      {img.type || 'Poster'}
                    </span>
                    <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 border border-white/15 text-zinc-200 group-hover:text-red-400">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono-code text-zinc-300">
                      <span>Artwork #{img.id}</span>
                      {width && height && (
                        <span className="text-zinc-400">
                          {width}×{height}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Production Crew Directory Section (Fetched from /shows/116/crew) */}
      <section className="mt-14 glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-mono-code uppercase text-red-400 flex items-center gap-1.5">
              <Clapperboard className="h-3.5 w-3.5" />
              <span>Fetched from api.tvmaze.com/shows/116/crew</span>
            </span>
            <h2 className="text-2xl font-bold text-white font-serif-title mt-1">
              Series Creators &amp; Production Crew (Showing {visibleCrew.length} of{' '}
              {filteredCrew.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="text-left">
              <label
                htmlFor="seasons-crew-role-select"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Crew Role
              </label>
              <select
                id="seasons-crew-role-select"
                value={crewRoleFilter}
                onChange={(e) => {
                  setCrewRoleFilter(e.target.value);
                  setShowAllCrew(false);
                }}
                className="h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3.5 text-xs text-zinc-200"
              >
                {crewRoles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'ALL' ? 'All Crew Roles' : role}
                  </option>
                ))}
              </select>
            </div>

            {filteredCrew.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllCrew((prev) => !prev)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-red-300 transition cursor-pointer"
              >
                <span>
                  {showAllCrew ? 'Show Top 8 Crew' : `Show All ${filteredCrew.length} Crew`}
                </span>
                {showAllCrew ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {visibleCrew.map((member, index) => (
            <div
              key={`${member.person?.id}-${member.type}-${index}`}
              className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex items-center gap-3"
            >
              {member.person?.image?.medium ? (
                <img
                  src={member.person.image.medium}
                  alt={member.person.name}
                  className="h-11 w-11 rounded-xl object-cover border border-white/15 shrink-0"
                />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-mono-code text-red-400 shrink-0">
                  CREW
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-mono-code uppercase text-red-400 block truncate">
                  {member.type}
                </span>
                <h3 className="text-sm font-bold text-white truncate">
                  {member.person?.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full-Screen Official Artwork Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-slide"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full glass-panel rounded-3xl p-4 sm:p-6 border border-red-500/40"
          >
            <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono-code uppercase text-red-400 block">
                  {lightboxImage.type}{' '}
                  {lightboxImage.dimensions ? `• ${lightboxImage.dimensions}` : ''}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif-title">
                  {lightboxImage.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-300 hover:text-white border border-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center bg-black/80 rounded-2xl overflow-hidden max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
