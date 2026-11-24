import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../../services/api';

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
  const [quoteScenes, setQuoteScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [likedIds, setLikedIds] = useState({});
  const [lightboxItem, setLightboxItem] = useState(null);

  /**
   * Fetches both the live r/TheMentalist social media memes and live Wikiquote banter.
   */
  const loadCommunityFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [memesResult, quotesResult] = await Promise.allSettled([
        fetchMentalistCommunityMemes(),
        fetchWikiquoteSeasonScenes(1),
      ]);

      const loadedMemes =
        memesResult.status === 'fulfilled' ? memesResult.value : [];
      const loadedQuotes =
        quotesResult.status === 'fulfilled' ? quotesResult.value : [];

      if (loadedMemes.length === 0 && loadedQuotes.length === 0) {
        setError('Unable to load community memes and quotes right now.');
      }

      setCommunityMemes(loadedMemes);
      setQuoteScenes(loadedQuotes);
      setLoading(false);
    } catch (err) {
      setError(err?.message || 'Unable to load community feed.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunityFeed();
  }, [loadCommunityFeed]);

  // Select unique-episode quote moments so no two quote cards ever repeat the same episode photo
  const uniqueQuoteCards = useMemo(() => {
    const usedEpisodeIds = new Set();
    const selected = [];

    for (const scene of quoteScenes) {
      const matchedEp = episodesList.find(
        (ep) =>
          ep.season === scene.season &&
          (ep.number === scene.episodeNumber ||
            ep.name.toLowerCase() === scene.episodeTitle.toLowerCase())
      );

      if (!matchedEp || !matchedEp.image?.original || usedEpisodeIds.has(matchedEp.id)) {
        continue;
      }

      usedEpisodeIds.add(matchedEp.id);
      selected.push({
        id: scene.id,
        episode: matchedEp,
        episodeTitle: scene.episodeTitle,
        season: scene.season,
        episodeNumber: scene.episodeNumber,
        imageUrl: matchedEp.image.original || matchedEp.image.medium,
        dialogue: scene.fullDialogue.slice(0, 3),
        sourceUrl: scene.sourceUrl,
      });

      if (selected.length >= 4) break;
    }

    return selected;
  }, [quoteScenes, episodesList]);

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

        {/* Feed Filter Switcher */}
        <div className="inline-flex flex-wrap rounded-xl bg-[#0d0d13] p-1 border border-white/10 self-start lg:self-center shrink-0">
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
            Social Memes ({communityMemes.length})
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
      </div>

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
          {(activeFeed === 'ALL' || activeFeed === 'MEMES') && communityMemes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Trending on r/TheMentalist (Social Media Memes &amp; Fan Art)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {communityMemes.map((meme) => {
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4" />
                  <span>Iconic Series Banter &amp; Quotes (Unique Episode Scenes)</span>
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
                        {/* Clean Unobstructed Episode Still (Zero text blocking faces!) */}
                        <div className="relative h-48 w-full bg-black overflow-hidden">
                          <img
                            src={scene.imageUrl}
                            alt={scene.episodeTitle}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-red-300">
                            S{String(scene.season).padStart(2, '0')}E
                            {String(scene.episodeNumber).padStart(2, '0')} • {scene.episodeTitle}
                          </span>
                        </div>

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

      {/* Full-Size Meme Lightbox Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-slide"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full glass-panel rounded-3xl p-4 sm:p-6 border border-red-500/40"
          >
            <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-white/10">
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

            <div className="flex justify-center bg-black/80 rounded-2xl overflow-hidden max-h-[72vh]">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>

            {lightboxItem.postLink && (
              <div className="mt-4 flex justify-end">
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
        </div>
      )}
    </section>
  );
}
