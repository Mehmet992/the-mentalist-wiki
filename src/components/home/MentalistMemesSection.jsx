import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  MessageSquareQuote,
  RefreshCw,
  Smile,
  ThumbsUp,
  X,
} from 'lucide-react';
import {
  fetchMentalistCommunityMemes,
  fetchWikiquoteSeasonScenes,
  getMemeRefreshRateLimitStatus,
  getSavedBanterSelection,
  saveBanterSelection,
} from '../../services/api';

/**
 * Selects up to `limit` unique-episode quote cards from a Wikiquote season's scenes,
 * ensuring no two cards ever repeat the same episode image.
 * If `preferredSceneIds` are provided (e.g. restored from localStorage), uses those first;
 * otherwise shuffles candidates (preferring scenes not in `excludeSceneIds`).
 */
function selectUniqueEpisodeQuotes(
  scenes = [],
  episodesList = [],
  { preferredSceneIds = [], excludeSceneIds = [], limit = 4 } = {}
) {
  const episodeMatched = [];
  for (const scene of scenes) {
    const matchedEp = episodesList.find(
      (ep) =>
        ep.season === scene.season &&
        (ep.number === scene.episodeNumber ||
          ep.name.toLowerCase() === scene.episodeTitle.toLowerCase())
    );
    if (!matchedEp || !(matchedEp.image?.original || matchedEp.image?.medium)) continue;
    episodeMatched.push({
      id: scene.id,
      episode: matchedEp,
      episodeTitle: scene.episodeTitle,
      season: scene.season,
      episodeNumber: scene.episodeNumber,
      imageUrl: matchedEp.image.original || matchedEp.image.medium,
      dialogue: scene.fullDialogue.slice(0, 3),
      sourceUrl: scene.sourceUrl,
    });
  }

  const pickDistinctEpisodes = (orderedList) => {
    const usedEpisodeIds = new Set();
    const chosen = [];
    for (const item of orderedList) {
      if (usedEpisodeIds.has(item.episode.id)) continue;
      usedEpisodeIds.add(item.episode.id);
      chosen.push(item);
      if (chosen.length >= limit) break;
    }
    return chosen;
  };

  if (preferredSceneIds.length > 0) {
    const preferredItems = preferredSceneIds
      .map((id) => episodeMatched.find((item) => item.id === id))
      .filter(Boolean);
    const restored = pickDistinctEpisodes(preferredItems);
    if (restored.length >= Math.min(limit, episodeMatched.length)) {
      return restored;
    }
  }

  const excludedSet = new Set(excludeSceneIds);
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const fresh = shuffle(episodeMatched.filter((item) => !excludedSet.has(item.id)));
  const fallback = shuffle(episodeMatched.filter((item) => excludedSet.has(item.id)));
  return pickDistinctEpisodes([...fresh, ...fallback]);
}

/**
 * Community Memes & Iconic Banter Showcase on the Home Page.
 * Balances two 100% live public data feeds (zero hardcoded captions or images):
 * 1. Social Media Memes & Fan Posts fetched live from meme-api.com/gimme/TheMentalist
 *    (pure community memes, GIFs, and fan images with zero overlapping text boxes).
 * 2. Iconic Episode Banter & Quotes fetched live from en.wikiquote.org paired with
 *    unique, non-repeating episode screenshots from TVmaze (text displayed cleanly below the photo).
 *
 * @param {Object} props
 * @param {Array} props.episodesList - All 151 episodes from /shows/116/episodes
 */
export default function MentalistMemesSection({ episodesList = [] }) {
  const [activeFeed, setActiveFeed] = useState('ALL'); // 'ALL', 'MEMES', 'QUOTES'
  const [communityMemes, setCommunityMemes] = useState([]);
  const [brokenMemeIds, setBrokenMemeIds] = useState({});
  const [banterSeason, setBanterSeason] = useState(() => getSavedBanterSelection()?.season || 1);
  const [uniqueQuoteCards, setUniqueQuoteCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [likedIds, setLikedIds] = useState({});
  const [lightboxItem, setLightboxItem] = useState(null);
  const [refreshingMemes, setRefreshingMemes] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(() => getMemeRefreshRateLimitStatus());

  // Live 1-second countdown while the Refresh Feed cooldown/rate-limit is active
  useEffect(() => {
    if (rateLimitStatus.allowed) return undefined;
    const interval = setInterval(() => {
      const nextStatus = getMemeRefreshRateLimitStatus();
      setRateLimitStatus(nextStatus);
      if (nextStatus.allowed) {
        setRefreshMessage(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitStatus.allowed]);

  /**
   * Loads both the saved/initial 8 Social Memes and the saved/initial 4 Iconic Series Banter
   * cards (persisted in localStorage so closing and reopening the tab preserves them).
   */
  const loadCommunityFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedBanter = getSavedBanterSelection();
      const targetSeason = savedBanter?.season || 1;

      const [memesResult, quotesResult] = await Promise.allSettled([
        fetchMentalistCommunityMemes({ batchSize: 8 }),
        fetchWikiquoteSeasonScenes(targetSeason),
      ]);

      const loadedMemes =
        memesResult.status === 'fulfilled' ? memesResult.value : [];
      const loadedQuotes =
        quotesResult.status === 'fulfilled' ? quotesResult.value : [];

      if (loadedMemes.length === 0 && loadedQuotes.length === 0) {
        setError('Unable to load community memes and quotes right now.');
      }

      setCommunityMemes(loadedMemes);
      setBanterSeason(targetSeason);

      if (episodesList.length > 0 && loadedQuotes.length > 0) {
        const pickedQuotes = selectUniqueEpisodeQuotes(loadedQuotes, episodesList, {
          preferredSceneIds: savedBanter?.sceneIds || [],
          limit: 4,
        });
        setUniqueQuoteCards(pickedQuotes);
        saveBanterSelection({
          season: targetSeason,
          sceneIds: pickedQuotes.map((q) => q.id),
        });
      }

      setLoading(false);
    } catch (err) {
      setError(err?.message || 'Unable to load community feed.');
      setLoading(false);
    }
  }, [episodesList]);

  useEffect(() => {
    loadCommunityFeed();
  }, [loadCommunityFeed]);

  /**
   * Manually refreshes BOTH the Social Memes (8 brand-new memes from the 65+ live pool,
   * excluding all currently shown IDs) AND the Iconic Series Banter (rotating to the next
   * Wikiquote season S1-S6 with 4 brand-new unique-episode scenes), saving both to localStorage
   * while respecting the 15-second cooldown and max 3 refreshes per minute rate limit.
   */
  const handleRefreshMemes = async () => {
    const currentLimit = getMemeRefreshRateLimitStatus();
    setRateLimitStatus(currentLimit);
    if (!currentLimit.allowed || refreshingMemes) {
      setRefreshMessage(
        `Refresh limit active — please wait ${currentLimit.retryAfterSeconds}s before loading another batch.`
      );
      return;
    }

    setRefreshingMemes(true);
    setRefreshMessage(null);
    try {
      const nextSeason = (banterSeason % 6) + 1;
      const currentMemeIds = communityMemes.map((m) => m.id);
      const currentQuoteIds = uniqueQuoteCards.map((q) => q.id);

      const [freshMemes, nextSeasonScenes] = await Promise.all([
        fetchMentalistCommunityMemes({
          forceRefresh: true,
          excludeIds: currentMemeIds,
          batchSize: 8,
        }),
        fetchWikiquoteSeasonScenes(nextSeason).catch(() => []),
      ]);

      if (freshMemes.length > 0) {
        setBrokenMemeIds({});
        setCommunityMemes(freshMemes);
      }

      if (nextSeasonScenes.length > 0 && episodesList.length > 0) {
        const freshQuotes = selectUniqueEpisodeQuotes(nextSeasonScenes, episodesList, {
          excludeSceneIds: currentQuoteIds,
          limit: 4,
        });
        if (freshQuotes.length > 0) {
          setBanterSeason(nextSeason);
          setUniqueQuoteCards(freshQuotes);
          saveBanterSelection({
            season: nextSeason,
            sceneIds: freshQuotes.map((q) => q.id),
          });
        }
      }

      setRateLimitStatus(getMemeRefreshRateLimitStatus());
    } catch (err) {
      setRefreshMessage(
        err?.message || 'Unable to refresh right now. Please try again shortly.'
      );
      setRateLimitStatus(getMemeRefreshRateLimitStatus());
    } finally {
      setRefreshingMemes(false);
    }
  };

  const visibleMemes = useMemo(
    () => communityMemes.filter((m) => !brokenMemeIds[m.id]),
    [communityMemes, brokenMemeIds]
  );

  // Lock body scroll when full-image lightbox is open
  useEffect(() => {
    if (!lightboxItem) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxItem]);

  return (
    <section className="mt-16 glass-panel rounded-3xl p-6 sm:p-8 text-left">
      {/* Header & Balanced Feed Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold uppercase mb-2">
            <Smile className="h-3.5 w-3.5" />
            <span>The Mentalist Memes on Social Media</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] font-serif-title">
            Community Memes, Fan Posts &amp; Iconic Banter
          </h2>
          <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
            A curated balance of pure social-media fan memes and creations from{' '}
            <strong className="text-white">r/TheMentalist</strong> alongside iconic dialogue moments
            from distinct episodes.
          </p>
        </div>

        {/* Feed Filter Switcher + Rate-Limited Refresh Memes & Banter Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
          <div className="inline-flex flex-wrap rounded-xl bg-[#0d0d13] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveFeed('ALL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFeed === 'ALL'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Balanced Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveFeed('MEMES')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFeed === 'MEMES'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Social Memes ({visibleMemes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFeed('QUOTES')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFeed === 'QUOTES'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Iconic Quotes ({uniqueQuoteCards.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefreshMemes}
            disabled={refreshingMemes || !rateLimitStatus.allowed}
            title={
              rateLimitStatus.allowed
                ? 'Load fresh memes & banter scenes and save to browser storage'
                : `Cooldown active — wait ${rateLimitStatus.retryAfterSeconds}s`
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
              refreshingMemes || !rateLimitStatus.allowed
                ? 'bg-zinc-900/70 border-white/10 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-900 hover:bg-red-600 border-red-500/40 text-red-300 hover:text-white cursor-pointer shadow'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingMemes ? 'animate-spin' : ''}`} />
            <span>
              {refreshingMemes
                ? 'Refreshing...'
                : !rateLimitStatus.allowed
                ? `Wait ${rateLimitStatus.retryAfterSeconds}s`
                : 'Refresh Memes & Quotes'}
            </span>
          </button>
        </div>
      </div>

      {refreshMessage && (
        <div className="mb-5 px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/35 text-xs text-amber-200">
          {refreshMessage}
        </div>
      )}

      {/* Loading / Error / Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="h-7 w-7 text-red-500 animate-spin" />
          <p className="text-sm text-zinc-300">
            Loading community memes and iconic episode banter...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/40 bg-[#101017] p-6 text-center space-y-3">
          <p className="text-sm text-zinc-300">{error}</p>
          <button
            type="button"
            onClick={loadCommunityFeed}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION A: Pure Social Media Memes & Fan Posts (No Ugly Overlaid Text) */}
          {(activeFeed === 'ALL' || activeFeed === 'MEMES') && visibleMemes.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Trending on r/TheMentalist (Social Media Memes &amp; Fan Art)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {visibleMemes.map((meme) => {
                  const isLiked = Boolean(likedIds[meme.id]);
                  return (
                    <article
                      key={meme.id}
                      className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Clean Meme Image (Click to expand in full lightbox, ZERO overlaid captions!) */}
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxItem({
                              imageUrl: meme.imageUrl,
                              title: meme.title,
                              subtitle: `Posted by u/${meme.author} on r/${meme.subreddit}`,
                              postLink: meme.postLink,
                            })
                          }
                          className="relative h-56 w-full bg-[#09090e] overflow-hidden flex items-center justify-center group cursor-pointer"
                        >
                          <img
                            src={meme.imageUrl}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
                          />
                          <img
                            src={meme.imageUrl}
                            alt={meme.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenMemeIds((prev) => ({ ...prev, [meme.id]: true }))
                            }
                            className="relative z-10 h-full w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-black/75 border border-white/15 text-zinc-200 group-hover:text-red-400">
                            <Maximize2 className="h-3.5 w-3.5" />
                          </span>
                          {meme.isGif && (
                            <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white uppercase">
                              GIF
                            </span>
                          )}
                        </button>

                        {/* Post Title & Author */}
                        <div className="p-4">
                          <h4 className="text-sm font-bold text-[#f5f5f5] line-clamp-2 leading-snug">
                            {meme.title}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            by <span className="text-zinc-200">u/{meme.author}</span> • r/
                            {meme.subreddit}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setLikedIds((prev) => ({
                              ...prev,
                              [meme.id]: !prev[meme.id],
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                            isLiked
                              ? 'bg-red-600/20 border-red-500 text-red-300'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{meme.upvotes + (isLiked ? 1 : 0)}</span>
                        </button>

                        <a
                          href={meme.postLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
                        >
                          <span>View Post</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: Iconic Episode Quotes (Unique Episode Stills, Clean Text Below Photo) */}
          {(activeFeed === 'ALL' || activeFeed === 'QUOTES') && uniqueQuoteCards.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4" />
                  <span>
                    Iconic Series Banter &amp; Quotes — Season {banterSeason} (Unique Episode
                    Scenes)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {uniqueQuoteCards.map((scene) => {
                  const isLiked = Boolean(likedIds[scene.id]);
                  return (
                    <article
                      key={scene.id}
                      className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Clean Unobstructed Episode Still (Aligned & Framed Like Social Memes, Click to Zoom) */}
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxItem({
                              imageUrl: scene.imageUrl,
                              title: `S${String(scene.season).padStart(2, '0')}E${String(
                                scene.episodeNumber
                              ).padStart(2, '0')} • ${scene.episodeTitle}`,
                              subtitle: 'Iconic Episode Scene',
                              postLink: null,
                            })
                          }
                          className="relative h-56 w-full bg-[#09090e] overflow-hidden flex items-center justify-center group cursor-pointer"
                        >
                          <img
                            src={scene.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
                          />
                          <img
                            src={scene.imageUrl}
                            alt={scene.episodeTitle}
                            loading="lazy"
                            className="relative z-10 h-full w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-14 z-10 bg-gradient-to-t from-[#0b0b10] to-transparent pointer-events-none" />
                          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-red-300">
                            S{String(scene.season).padStart(2, '0')}E
                            {String(scene.episodeNumber).padStart(2, '0')} • {scene.episodeTitle}
                          </span>
                          <span className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/75 border border-white/15 text-zinc-200 group-hover:text-red-400">
                            <Maximize2 className="h-3.5 w-3.5" />
                          </span>
                        </button>

                        {/* Clean Readable Dialogue Block Below the Photo */}
                        <div className="p-5 space-y-2">
                          {scene.dialogue.map((line, i) => (
                            <p
                              key={i}
                              className="text-base text-zinc-200 leading-[1.5] max-w-[65ch]"
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setLikedIds((prev) => ({
                              ...prev,
                              [scene.id]: !prev[scene.id],
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                            isLiked
                              ? 'bg-red-600/20 border-red-500 text-red-300'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              isLiked ? 'fill-red-400 text-red-400' : ''
                            }`}
                          />
                          <span>{isLiked ? 'Liked Quote' : 'Like Quote'}</span>
                        </button>

                        <Link
                          to={`/episodes/${scene.episode.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-red-400 hover:text-red-300"
                        >
                          <span>Inspect Episode</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Size Meme Lightbox Modal (Rendered in document.body Portal for true viewport centering) */}
      {lightboxItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxItem(null)}
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-slide"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full max-h-[90vh] flex flex-col glass-panel rounded-3xl p-4 sm:p-6 border border-red-500/40 shadow-[0_0_80px_rgba(0,0,0,0.95)]"
            >
              <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-white/10 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#f5f5f5] truncate">
                    {lightboxItem.title}
                  </h3>
                  <span className="text-xs text-zinc-400 block">{lightboxItem.subtitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  aria-label="Close preview"
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-300 hover:text-white border border-white/10 cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 flex items-center justify-center bg-[#07070b] rounded-2xl overflow-hidden p-2">
                <img
                  src={lightboxItem.imageUrl}
                  alt={lightboxItem.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[68vh] max-w-full w-auto h-auto object-contain rounded-lg"
                />
              </div>

              {lightboxItem.postLink && (
                <div className="mt-4 flex justify-end shrink-0">
                  <a
                    href={lightboxItem.postLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                  >
                    <span>Open Original Social Post</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
