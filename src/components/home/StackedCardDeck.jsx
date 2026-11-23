import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCw, Sparkles, UserCheck } from 'lucide-react';

/**
 * Renders a 3D Fanned Stacked Card Deck on the left side of the Home Page.
 * Applies Rule 6 (Depth & Ambient Spotlight) and Rule 7 (Micro-interaction progress bar
 * and smooth 3D cubic-bezier transitions as the top card cycles to the back).
 *
 * @param {Object} props
 * @param {Array} props.castList - Array of cast items from TVmaze (/shows/116/cast)
 * @param {number} props.activeIndex - Index of the currently active front card
 * @param {Function} props.onSelectIndex - Callback to update the active card index
 */
export default function StackedCardDeck({ castList = [], activeIndex = 0, onSelectIndex }) {
  const [isPaused, setIsPaused] = useState(false);
  const [showActorPhoto, setShowActorPhoto] = useState(false);

  const totalCards = castList.length;

  /**
   * Advances the front card to the back of the stack and brings the next card to the top.
   */
  const cycleNextCard = () => {
    if (totalCards === 0) return;
    onSelectIndex((activeIndex + 1) % totalCards);
  };

  // Automatic card rotation timer (every 4.8 seconds unless paused by user)
  useEffect(() => {
    if (isPaused || totalCards <= 1) return undefined;
    const timer = setInterval(() => {
      onSelectIndex((prevIndex) => (prevIndex + 1) % totalCards);
    }, 4800);

    return () => clearInterval(timer);
  }, [isPaused, totalCards, onSelectIndex]);

  if (totalCards === 0) return null;

  /**
   * Computes 3D transform, z-index, and visual depth for each card based on its
   * queue position relative to the front card (offset 0 = front, offset 1..4 = visible stack behind).
   */
  const getCardStackStyle = (relativeOffset) => {
    if (relativeOffset === 0) {
      return {
        transform: 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1)',
        zIndex: 50,
        opacity: 1,
        filter: 'brightness(1)',
      };
    }
    if (relativeOffset === 1) {
      return {
        transform: 'translate3d(34px, 14px, -35px) rotate(4deg) scale(0.94)',
        zIndex: 40,
        opacity: 0.92,
        filter: 'brightness(0.75)',
      };
    }
    if (relativeOffset === 2) {
      return {
        transform: 'translate3d(66px, 28px, -70px) rotate(8deg) scale(0.88)',
        zIndex: 30,
        opacity: 0.76,
        filter: 'brightness(0.58)',
      };
    }
    if (relativeOffset === 3) {
      return {
        transform: 'translate3d(94px, 42px, -105px) rotate(12deg) scale(0.82)',
        zIndex: 20,
        opacity: 0.56,
        filter: 'brightness(0.45)',
      };
    }
    if (relativeOffset === 4) {
      return {
        transform: 'translate3d(118px, 54px, -140px) rotate(15deg) scale(0.76)',
        zIndex: 10,
        opacity: 0.36,
        filter: 'brightness(0.35)',
      };
    }
    return {
      transform: 'translate3d(125px, 60px, -170px) rotate(17deg) scale(0.72)',
      zIndex: 5,
      opacity: 0,
      pointerEvents: 'none',
    };
  };

  return (
    <div
      className="relative flex flex-col items-center lg:items-start select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Rule 6: Ambient Crimson Spotlight behind the 3D Card Stack */}
      <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />

      {/* Top Deck Status & Controls */}
      <div className="relative z-10 w-full max-w-[360px] flex items-center justify-between mb-3 px-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-mono-code text-zinc-200">
          <Sparkles className="h-3.5 w-3.5 text-red-500" />
          <span>
            CARD <strong className="text-red-400">{activeIndex + 1}</strong> / {totalCards}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowActorPhoto((prev) => !prev)}
            title="Switch portrait between Character and Real Actor"
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-red-500/50 text-[11px] font-mono-code text-zinc-200 transition cursor-pointer"
          >
            {showActorPhoto ? 'View: Real Actor' : 'View: Character'}
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? 'Resume Auto-Cycle' : 'Pause Auto-Cycle'}
            className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-red-500/50 text-zinc-200 transition cursor-pointer"
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Pause className="h-3.5 w-3.5 text-zinc-300" />
            )}
          </button>
        </div>
      </div>

      {/* 3D Stacked Card Container */}
      <div className="relative w-[275px] sm:w-[305px] h-[410px] sm:h-[435px] deck-perspective mr-16 sm:mr-24 my-1">
        {castList.map((castItem, index) => {
          const relativeOffset = (index - activeIndex + totalCards) % totalCards;
          const style = getCardStackStyle(relativeOffset);
          const isFrontCard = relativeOffset === 0;

          const characterImg =
            castItem.character?.image?.original ||
            castItem.character?.image?.medium ||
            castItem.person?.image?.original ||
            castItem.person?.image?.medium;
          const actorImg =
            castItem.person?.image?.original ||
            castItem.person?.image?.medium ||
            characterImg;

          const displayedImage = showActorPhoto ? actorImg : characterImg;

          return (
            <div
              key={`${castItem.person?.id}-${castItem.character?.id}`}
              style={style}
              onClick={() => {
                if (isFrontCard) {
                  cycleNextCard();
                } else {
                  onSelectIndex(index);
                }
              }}
              className={`card-stack-transition absolute inset-0 rounded-2xl overflow-hidden cursor-pointer border ${
                isFrontCard
                  ? 'border-red-500/90 shadow-[0_18px_50px_rgba(220,38,38,0.38)]'
                  : 'border-white/15 shadow-[0_10px_25px_rgba(0,0,0,0.85)] hover:border-red-500/60'
              } bg-zinc-950`}
            >
              {/* Portrait Image from API */}
              <div className="relative h-full w-full">
                {displayedImage ? (
                  <img
                    src={displayedImage}
                    alt={`${castItem.character?.name} (${castItem.person?.name})`}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-950 text-zinc-600">
                    No API Image
                  </div>
                )}

                {/* Clean Dark Gradient Overlay (60-30-10 Rule) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Top Corner Queue Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-mono-code font-bold text-zinc-200">
                  #{index + 1}
                </div>

                {/* Top-Left Live API Tag (10% Crimson Accent) */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-[10px] font-mono-code uppercase tracking-wider text-white font-semibold shadow">
                  {showActorPhoto ? 'Real Actor' : 'Character'}
                </div>

                {/* Bottom Card Identity Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono-code text-red-400 mb-0.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{castItem.person?.name}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white font-serif-title leading-tight">
                    {castItem.character?.name}
                  </h3>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-300">
                    <span>{castItem.person?.country?.name || 'Main Cast'}</span>
                    <span className="text-red-400 font-mono-code">
                      {isFrontCard ? 'Click → Next' : 'Click → Focus'}
                    </span>
                  </div>
                </div>

                {/* Rule 7: Live Animated Timer Progress Bar at the bottom edge of the active card */}
                {isFrontCard && !isPaused && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-900/80 overflow-hidden">
                    <div
                      key={`timer-${activeIndex}`}
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 animate-deck-progress"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Manual Deck Cycle Controls & Quick Dots */}
      <div className="relative z-10 w-full max-w-[360px] mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={cycleNextCard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/60 transition cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Next Card</span>
        </button>

        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {castList.map((item, idx) => (
            <button
              key={item.person?.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              title={`${item.character?.name} (${item.person?.name})`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-6 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                  : 'w-2 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
