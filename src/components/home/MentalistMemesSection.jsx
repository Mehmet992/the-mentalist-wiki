import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Flower2,
  Heart,
  Minimize2,
  Share2,
  Smile,
  Sparkles,
} from 'lucide-react';

/**
 * Fan-community section on the Home Page showcasing viral social-media memes
 * and cult moments from The Mentalist:
 * 1. Pocket-Sized / Mini CBI Team lineup (with interactive Mini-Squish toggle)
 * 2. Jane & Lisbon "Throwing a Red Rose" dramatic moment
 * 3. Agent Kimball Cho's deadpan 1-word interrogation
 * 4. Lisbon's "Jane, Stay in the Car" daily headache
 * Includes live meme upvote counters and an interactive meme caption customizer.
 *
 * @param {Object} props
 * @param {Array} props.castList - Main cast array from /shows/116/cast
 * @param {Array} props.episodesList - All 151 episodes from /shows/116/episodes
 */
export default function MentalistMemesSection({ castList = [], episodesList = [] }) {
  const [miniModeActive, setMiniModeActive] = useState(true);
  const [editingMemeId, setEditingMemeId] = useState(null);
  const [customCaptions, setCustomCaptions] = useState({});
  const [likes, setLikes] = useState({
    miniTeam: 1420,
    redRose: 985,
    choDeadpan: 1890,
    lisbonCar: 1150,
  });
  const [likedByMe, setLikedByMe] = useState({});

  // Extract character & episode photos dynamically from the loaded data
  const mediaAssets = useMemo(() => {
    const findCast = (nameFragment) =>
      castList.find((c) =>
        (c.character?.name || '').toLowerCase().includes(nameFragment.toLowerCase())
      );

    const findEp = (titleFragment) =>
      episodesList.find((e) =>
        (e.name || '').toLowerCase().includes(titleFragment.toLowerCase())
      );

    const jane = findCast('Jane');
    const lisbon = findCast('Lisbon');
    const cho = findCast('Cho');
    const rigsby = findCast('Rigsby');
    const vanPelt = findCast('Van Pelt');

    const roseEp =
      findEp('Desert Rose') || findEp('Red Roses') || findEp('White Orchids') || episodesList[0];
    const pilotEp = findEp('Pilot') || episodesList[0];

    return {
      cbiTeam: [jane, lisbon, cho, rigsby, vanPelt].filter(Boolean),
      janeImg:
        jane?.character?.image?.original ||
        jane?.character?.image?.medium ||
        jane?.person?.image?.medium,
      lisbonImg:
        lisbon?.character?.image?.original ||
        lisbon?.character?.image?.medium ||
        lisbon?.person?.image?.medium,
      choImg:
        cho?.character?.image?.original ||
        cho?.character?.image?.medium ||
        cho?.person?.image?.medium,
      roseEpImg:
        roseEp?.image?.original ||
        roseEp?.image?.medium ||
        jane?.character?.image?.medium,
      pilotEpImg:
        pilotEp?.image?.original ||
        pilotEp?.image?.medium ||
        lisbon?.character?.image?.medium,
    };
  }, [castList, episodesList]);

  /**
   * Toggles a visitor's upvote on a meme card.
   */
  const handleToggleLike = (memeId) => {
    setLikedByMe((prev) => {
      const alreadyLiked = Boolean(prev[memeId]);
      setLikes((counts) => ({
        ...counts,
        [memeId]: (counts[memeId] || 100) + (alreadyLiked ? -1 : 1),
      }));
      return {
        ...prev,
        [memeId]: !alreadyLiked,
      };
    });
  };

  const memeCards = [
    {
      id: 'miniTeam',
      tag: 'Viral Fan Edit • Pocket-Sized CBI Squad',
      handle: '@CBI_Sacramento_Daily',
      defaultTopText: 'MOM SAID IT IS OUR TURN',
      defaultBottomText: 'TO INTERROGATE THE SUSPECT',
      caption:
        'The entire Serious Crimes Unit standing in the doorway after Patrick Jane locked the suspect in a room with a teacup.',
      isMiniTeamCard: true,
    },
    {
      id: 'redRose',
      tag: 'Iconic Scene • The Red Rose Move',
      handle: '@PatrickJaneMindGames',
      defaultTopText: 'JANE 10 SECONDS AFTER INSULTING THE KILLER:',
      defaultBottomText: 'THROWS A RED ROSE & WALKS OUT TO MAKE TEA 🌹',
      caption:
        'When Jane casually tosses a crimson rose onto the crime scene table, smiles at Lisbon, and leaves the whole room speechless.',
      image: mediaAssets.roseEpImg,
      hasRoseOverlay: true,
    },
    {
      id: 'choDeadpan',
      tag: 'Fan Favorite • The Kimball Cho Stare',
      handle: '@NoBusinessLikeChoBusiness',
      defaultTopText: 'SUSPECT: *GIVES A 15-MINUTE EMOTIONAL ALIBI*',
      defaultBottomText: 'AGENT KIMBALL CHO: "NO."',
      caption:
        'Zero facial expression. Zero small talk. 100% confession rate within 30 seconds.',
      image: mediaAssets.choImg,
    },
    {
      id: 'lisbonCar',
      tag: 'Every Single Episode • Lisbon vs. Jane',
      handle: '@SeniorAgentLisbon',
      defaultTopText: 'LISBON: "JANE, STAY IN THE CAR."',
      defaultBottomText: 'JANE 8 SECONDS LATER: *HAVING TEA IN THE KILLER’S KITCHEN*',
      caption:
        'Seven seasons of Teresa Lisbon trying to follow protocol while Jane is already on the suspect’s couch.',
      image: mediaAssets.pilotEpImg,
    },
  ];

  return (
    <section className="mt-16 glass-panel rounded-3xl p-6 sm:p-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold uppercase mb-2">
            <Smile className="h-3.5 w-3.5" />
            <span>The Mentalist Memes on Social Media</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] font-serif-title">
            Patrick Jane&apos;s Hall of Mischief — Viral Fan Memes
          </h2>
          <p className="text-base text-zinc-300 mt-1 max-w-[65ch]">
            From the pocket-sized CBI team edit and the iconic red rose toss to Agent Cho&apos;s
            deadpan interrogations—explore and customize the fandom&apos;s favorite viral memes.
          </p>
        </div>

        {/* Toggle for the Pocket-Sized Mini Team Effect */}
        <button
          type="button"
          onClick={() => setMiniModeActive((prev) => !prev)}
          className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-red-300 transition cursor-pointer shrink-0"
        >
          <Minimize2 className="h-3.5 w-3.5 text-red-400" />
          <span>
            {miniModeActive ? 'Pocket-Sized Team: ON' : 'Pocket-Sized Team: OFF'}
          </span>
        </button>
      </div>

      {/* 2x2 Viral Meme Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {memeCards.map((meme) => {
          const topText = customCaptions[meme.id]?.top ?? meme.defaultTopText;
          const bottomText = customCaptions[meme.id]?.bottom ?? meme.defaultBottomText;
          const isEditing = editingMemeId === meme.id;
          const isLiked = Boolean(likedByMe[meme.id]);

          return (
            <article
              key={meme.id}
              className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Social Media Post Header Bar */}
                <div className="px-4 py-3 border-b border-white/10 bg-[#0d0d14] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-[#f5f5f5]">{meme.handle}</span>
                    <span className="text-xs text-zinc-400 hidden sm:inline">• {meme.tag}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingMemeId(isEditing ? null : meme.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3 text-red-400" />
                    <span>{isEditing ? 'Done' : 'Edit Caption'}</span>
                  </button>
                </div>

                {/* Meme Visual Canvas */}
                <div className="relative h-64 w-full bg-[#09090e] overflow-hidden flex items-center justify-center select-none">
                  {meme.isMiniTeamCard ? (
                    /* Special Meme #1: Pocket-Sized / Mini CBI Team Lineup */
                    <div className="relative w-full h-full flex items-end justify-center gap-2 sm:gap-3 px-4 pb-8 pt-10 bg-gradient-to-t from-red-950/40 via-[#0d0d14] to-[#09090e]">
                      {mediaAssets.cbiTeam.map((member, idx) => {
                        const img =
                          member.character?.image?.medium ||
                          member.person?.image?.medium;
                        return (
                          <div
                            key={member.person?.id || idx}
                            className={`flex flex-col items-center transition-all duration-500 ${
                              miniModeActive
                                ? 'scale-y-[0.72] scale-x-[0.94] translate-y-4'
                                : 'scale-100'
                            }`}
                          >
                            <div className="w-14 sm:w-16 h-32 sm:h-36 rounded-xl overflow-hidden border-2 border-red-500/60 shadow-[0_8px_20px_rgba(0,0,0,0.85)] bg-black">
                              {img && (
                                <img
                                  src={img}
                                  alt={member.character?.name}
                                  className="w-full h-full object-cover object-top"
                                />
                              )}
                            </div>
                            <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-zinc-200 truncate max-w-[64px]">
                              {member.character?.name?.split(' ').pop()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard Meme Photo Canvas */
                    <>
                      {meme.image && (
                        <img
                          src={meme.image}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110"
                        />
                      )}
                      {meme.image && (
                        <img
                          src={meme.image}
                          alt={meme.tag}
                          className="relative z-10 h-full w-auto max-w-full object-contain"
                        />
                      )}

                      {/* Floating Red Rose Badge for the Red Rose Meme */}
                      {meme.hasRoseOverlay && (
                        <div className="absolute bottom-12 right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 border border-red-300 text-white text-xs font-bold shadow-[0_0_25px_rgba(239,68,68,0.9)] animate-bounce">
                          <Flower2 className="h-4 w-4" />
                          <span>Crimson Rose Tossed</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Classic Bold Impact Meme Top Caption */}
                  <div className="absolute top-2.5 inset-x-3 z-20 text-center pointer-events-none">
                    <span className="inline-block px-3 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-white/15 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-lg">
                      {topText}
                    </span>
                  </div>

                  {/* Classic Bold Impact Meme Bottom Caption */}
                  <div className="absolute bottom-2.5 inset-x-3 z-20 text-center pointer-events-none">
                    <span className="inline-block px-3 py-1 rounded-lg bg-black/85 backdrop-blur-sm border border-red-500/40 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-200 shadow-lg">
                      {bottomText}
                    </span>
                  </div>
                </div>

                {/* Optional Live Caption Editor Drawer */}
                {isEditing && (
                  <div className="p-4 bg-[#0d0d13] border-t border-white/10 space-y-2.5 animate-fade-slide">
                    <div>
                      <label
                        htmlFor={`meme-top-${meme.id}`}
                        className="block text-xs font-semibold text-zinc-300 mb-1"
                      >
                        Top Meme Text
                      </label>
                      <input
                        id={`meme-top-${meme.id}`}
                        type="text"
                        value={topText}
                        onChange={(e) =>
                          setCustomCaptions((prev) => ({
                            ...prev,
                            [meme.id]: {
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
                        htmlFor={`meme-bottom-${meme.id}`}
                        className="block text-xs font-semibold text-zinc-300 mb-1"
                      >
                        Bottom Meme Text
                      </label>
                      <input
                        id={`meme-bottom-${meme.id}`}
                        type="text"
                        value={bottomText}
                        onChange={(e) =>
                          setCustomCaptions((prev) => ({
                            ...prev,
                            [meme.id]: {
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

                {/* Social Post Description */}
                <div className="p-4">
                  <p className="text-base text-zinc-200 leading-[1.5]">
                    {meme.caption}
                  </p>
                </div>
              </div>

              {/* Social Reaction Footer */}
              <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleLike(meme.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
                    isLiked
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-300'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                  <span>{likes[meme.id]} Teacups</span>
                </button>

                <span className="inline-flex items-center gap-1 text-zinc-400 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-red-400" />
                  <span>#TheMentalist #PatrickJane</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
