import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Edit3,
  ExternalLink,
  Heart,
  Loader2,
  Minimize2,
  RefreshCw,
  Smile,
} from 'lucide-react';
import { fetchWikiquoteSeasonScenes } from '../../services/api';

/**
 * Fan-community section on the Home Page ("The Mentalist Memes & Iconic Moments").
 * Pulls 100% live episode banter, humorous exchanges, and scene quotes from the
 * public Wikiquote MediaWiki API (en.wikiquote.org/w/api.php) and pairs each scene
 * dynamically with its matching episode screenshot and character portraits from TVmaze.
 * Zero hardcoded meme captions or dialogue text.
 *
 * @param {Object} props
 * @param {Array} props.castList - Main cast array from /shows/116/cast
 * @param {Array} props.episodesList - All 151 episodes from /shows/116/episodes
 */
export default function MentalistMemesSection({ castList = [], episodesList = [] }) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [scenes, setScenes] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [miniModeByCard, setMiniModeByCard] = useState({});
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [customCaptions, setCustomCaptions] = useState({});
  const [likedIds, setLikedIds] = useState({});

  /**
   * Fetches live humorous exchanges & scene quotes for the selected season from Wikiquote API.
   */
  const loadLiveScenes = useCallback(async (seasonNum) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWikiquoteSeasonScenes(seasonNum);
      setScenes(data);
      setVisibleCount(4);
      setLoading(false);
    } catch (err) {
      setError(err?.message || 'Unable to load scenes from Wikiquote API.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveScenes(selectedSeason);
  }, [selectedSeason, loadLiveScenes]);

  // Match each Wikiquote scene with its real TVmaze episode record and speaking character portrait
  const enrichedScenes = useMemo(() => {
    return scenes.map((scene) => {
      const matchedEpisode = episodesList.find(
        (ep) =>
          ep.season === scene.season &&
          (ep.number === scene.episodeNumber ||
            ep.name.toLowerCase() === scene.episodeTitle.toLowerCase())
      );

      // Identify speaking characters mentioned in the live dialogue lines
      const combinedText = scene.fullDialogue.join(' ').toLowerCase();
      const matchedCastMembers = castList.filter((c) => {
        const fullCharName = (c.character?.name || '').toLowerCase();
        const firstOrLast = fullCharName.split(' ');
        return firstOrLast.some((part) => part.length > 2 && combinedText.includes(part));
      });

      const primaryImage =
        matchedEpisode?.image?.original ||
        matchedEpisode?.image?.medium ||
        matchedCastMembers[0]?.character?.image?.original ||
        matchedCastMembers[0]?.character?.image?.medium ||
        castList[0]?.character?.image?.medium;

      return {
        ...scene,
        matchedEpisode,
        matchedCastMembers:
          matchedCastMembers.length > 0 ? matchedCastMembers : castList.slice(0, 3),
        primaryImage,
      };
    });
  }, [scenes, episodesList, castList]);

  const displayedScenes = enrichedScenes.slice(0, visibleCount);

  return (
    <section className="mt-16 glass-panel rounded-3xl p-6 sm:p-8 text-left">
      {/* Header & Season Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold uppercase mb-2">
            <Smile className="h-3.5 w-3.5" />
            <span>The Mentalist Memes &amp; Iconic Banter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] font-serif-title">
            Viral Scene Moments &amp; Meme Studio
          </h2>
          <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
            Every dialogue exchange and scene below is pulled live from the public{' '}
            <strong className="text-white">Wikiquote &amp; TVmaze</strong> archives. Toggle the
            Pocket-Sized Squad effect or customize any scene into your own meme.
          </p>
        </div>

        {/* Season Picker for Live Wikiquote Scenes */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center shrink-0">
          {[1, 2, 3, 4, 5, 6].map((sNum) => (
            <button
              key={sNum}
              type="button"
              onClick={() => setSelectedSeason(sNum)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedSeason === sNum
                  ? 'bg-red-600 text-white border-red-400 shadow'
                  : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-white'
              }`}
            >
              Season {sNum}
            </button>
          ))}
        </div>
      </div>

      {/* Loading or Error States */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="h-7 w-7 text-red-500 animate-spin" />
          <p className="text-sm text-zinc-300">
            Fetching Season {selectedSeason} iconic scenes and quotes from Wikiquote...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/40 bg-[#101017] p-6 text-center space-y-3">
          <p className="text-sm text-zinc-300">{error}</p>
          <button
            type="button"
            onClick={() => loadLiveScenes(selectedSeason)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Fetching Scenes</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedScenes.map((scene) => {
              const topText = customCaptions[scene.id]?.top ?? scene.topLine;
              const bottomText = customCaptions[scene.id]?.bottom ?? scene.bottomLine;
              const isEditing = editingSceneId === scene.id;
              const isMiniMode = Boolean(miniModeByCard[scene.id]);
              const isLiked = Boolean(likedIds[scene.id]);

              return (
                <article
                  key={scene.id}
                  className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Top Card Bar */}
                    <div className="px-4 py-3 border-b border-white/10 bg-[#0d0d14] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-red-600/20 border border-red-500/40 text-xs font-mono-code font-bold text-red-300 shrink-0">
                          S{String(scene.season).padStart(2, '0')}E
                          {String(scene.episodeNumber).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold text-[#f5f5f5] truncate">
                          {scene.episodeTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setMiniModeByCard((prev) => ({
                              ...prev,
                              [scene.id]: !prev[scene.id],
                            }))
                          }
                          title="Toggle Pocket-Sized Mini Character Lineup"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                            isMiniMode
                              ? 'bg-red-600/25 border-red-500 text-red-200'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
                          }`}
                        >
                          <Minimize2 className="h-3 w-3 text-red-400" />
                          <span>{isMiniMode ? 'Mini Squad' : 'Scene Photo'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSceneId(isEditing ? null : scene.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3 text-red-400" />
                          <span>{isEditing ? 'Done' : 'Edit Meme'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Meme Image / Pocket-Sized Squad Stage */}
                    <div className="relative h-64 w-full bg-[#09090e] overflow-hidden flex items-center justify-center select-none">
                      {isMiniMode ? (
                        <div className="relative w-full h-full flex items-end justify-center gap-3 px-4 pb-10 pt-10 bg-gradient-to-t from-red-950/40 via-[#0d0d14] to-[#09090e]">
                          {scene.matchedCastMembers.slice(0, 5).map((member, idx) => {
                            const img =
                              member.character?.image?.medium ||
                              member.person?.image?.medium;
                            return (
                              <div
                                key={member.person?.id || idx}
                                className="flex flex-col items-center scale-y-[0.72] scale-x-[0.94] translate-y-3 transition-transform"
                              >
                                <div className="w-16 h-34 rounded-xl overflow-hidden border-2 border-red-500/60 shadow-lg bg-black">
                                  {img && (
                                    <img
                                      src={img}
                                      alt={member.character?.name}
                                      className="w-full h-full object-cover object-top"
                                    />
                                  )}
                                </div>
                                <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-zinc-200 truncate max-w-[70px]">
                                  {member.character?.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <>
                          {scene.primaryImage && (
                            <img
                              src={scene.primaryImage}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110"
                            />
                          )}
                          {scene.primaryImage && (
                            <img
                              src={scene.primaryImage}
                              alt={scene.episodeTitle}
                              className="relative z-10 h-full w-auto max-w-full object-contain"
                            />
                          )}
                        </>
                      )}

                      {/* Top Meme Text Banner (From Live Wikiquote Line 1) */}
                      <div className="absolute top-2.5 inset-x-3 z-20 text-center pointer-events-none">
                        <span className="inline-block px-3 py-1 rounded-lg bg-black/85 backdrop-blur-sm border border-white/15 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg line-clamp-2">
                          {topText}
                        </span>
                      </div>

                      {/* Bottom Meme Text Banner (From Live Wikiquote Punchline) */}
                      {scene.fullDialogue.length > 1 && (
                        <div className="absolute bottom-2.5 inset-x-3 z-20 text-center pointer-events-none">
                          <span className="inline-block px-3 py-1 rounded-lg bg-black/85 backdrop-blur-sm border border-red-500/40 text-xs font-extrabold uppercase tracking-wider text-red-200 shadow-lg line-clamp-2">
                            {bottomText}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Meme Caption Editor */}
                    {isEditing && (
                      <div className="p-4 bg-[#0d0d13] border-t border-white/10 space-y-2.5 animate-fade-slide">
                        <div>
                          <label
                            htmlFor={`meme-top-${scene.id}`}
                            className="block text-xs font-semibold text-zinc-300 mb-1"
                          >
                            Top Meme Caption
                          </label>
                          <input
                            id={`meme-top-${scene.id}`}
                            type="text"
                            value={topText}
                            onChange={(e) =>
                              setCustomCaptions((prev) => ({
                                ...prev,
                                [scene.id]: {
                                  top: e.target.value,
                                  bottom: bottomText,
                                },
                              }))
                            }
                            className="w-full h-9 rounded-lg bg-black border border-white/15 px-3 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`meme-bottom-${scene.id}`}
                            className="block text-xs font-semibold text-zinc-300 mb-1"
                          >
                            Bottom Meme Caption
                          </label>
                          <input
                            id={`meme-bottom-${scene.id}`}
                            type="text"
                            value={bottomText}
                            onChange={(e) =>
                              setCustomCaptions((prev) => ({
                                ...prev,
                                [scene.id]: {
                                  top: topText,
                                  bottom: e.target.value,
                                },
                              }))
                            }
                            className="w-full h-9 rounded-lg bg-black border border-white/15 px-3 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Full Live Dialogue Transcript from Wikiquote */}
                    <div className="p-4 space-y-1.5">
                      {scene.contextNote && (
                        <span className="text-xs italic text-red-300 block">
                          [{scene.contextNote}]
                        </span>
                      )}
                      {scene.fullDialogue.slice(0, 4).map((line, idx) => (
                        <p key={idx} className="text-sm text-zinc-200 leading-[1.5]">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLikedIds((prev) => ({
                            ...prev,
                            [scene.id]: !prev[scene.id],
                          }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-semibold transition cursor-pointer ${
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
                        <span>{isLiked ? 'Liked Scene' : 'Like Scene'}</span>
                      </button>

                      <a
                        href={scene.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                      >
                        <span>Wikiquote</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {scene.matchedEpisode && (
                      <Link
                        to={`/episodes/${scene.matchedEpisode.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-red-400 hover:text-red-300"
                      >
                        <span>Open Episode</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {visibleCount < enrichedScenes.length && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition cursor-pointer"
              >
                Load More Season {selectedSeason} Scenes ({enrichedScenes.length - visibleCount}{' '}
                remaining)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
