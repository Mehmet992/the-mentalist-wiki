import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Repeat, Shield, User } from 'lucide-react';

/**
 * Reusable Dual-Identity Character & Actor Card displaying both the in-series
 * character identity and the real-world actor identity fetched from the TVmaze API.
 * When switched to a single photo (Character or Actor), centers the full portrait
 * with object-contain over a soft ambient backdrop so faces are never cropped.
 *
 * @param {Object} props
 * @param {Object} props.castItem - Cast item pairing { person, character } from TVmaze
 * @param {string} [props.roleBadge] - Optional badge indicating Main Cast vs Guest Cast
 */
export default function CharacterCard({ castItem, roleBadge = 'Main Series Cast' }) {
  const [viewMode, setViewMode] = useState('BOTH'); // 'BOTH', 'CHARACTER', 'ACTOR'
  const person = castItem?.person;
  const character = castItem?.character;

  if (!person || !character) return null;

  const charImage =
    character.image?.medium ||
    character.image?.original ||
    person.image?.medium ||
    person.image?.original;
  const actorImage =
    person.image?.medium ||
    person.image?.original ||
    charImage;

  const singlePhotoSrc = viewMode === 'ACTOR' ? actorImage : charImage;
  const singlePhotoAlt = viewMode === 'ACTOR' ? person.name : character.name;

  return (
    <article className="glass-card-interactive group rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        {/* Portrait Header: Either Split 2-Column View or Properly Centered Single Portrait */}
        <div className="relative h-60 w-full bg-[#101017] overflow-hidden">
          {viewMode === 'BOTH' ? (
            <div className="grid grid-cols-2 h-full w-full">
              <div className="relative h-full overflow-hidden border-r border-white/10">
                {charImage ? (
                  <img
                    src={charImage}
                    alt={`${character.name} character portrait`}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                    No Image
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-red-600/90 text-xs font-semibold text-white uppercase">
                  Character
                </span>
              </div>

              <div className="relative h-full overflow-hidden">
                {actorImage ? (
                  <img
                    src={actorImage}
                    alt={`${person.name} actor portrait`}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                    No Image
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-zinc-900/90 border border-white/15 text-xs font-semibold text-zinc-100 uppercase">
                  Real Actor
                </span>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-[#0d0d13]">
              {/* Soft Blurred Ambient Backdrop so wide container has zero awkward empty space */}
              {singlePhotoSrc && (
                <img
                  src={singlePhotoSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover object-center blur-xl opacity-35 scale-110 pointer-events-none"
                />
              )}

              {/* Crisp Centered Full Portrait (object-contain prevents forehead cropping!) */}
              {singlePhotoSrc ? (
                <img
                  src={singlePhotoSrc}
                  alt={singlePhotoAlt}
                  className="relative z-10 h-full w-auto max-w-full object-contain py-1.5 drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-xs text-zinc-500">No Image</div>
              )}

              <span className="absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded bg-red-600/90 text-xs font-semibold text-white uppercase">
                {viewMode === 'ACTOR' ? 'Real Actor Photo' : 'Character Photo'}
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0b0b10] to-transparent pointer-events-none z-10" />

          {/* Switch View Button */}
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) =>
                prev === 'BOTH' ? 'CHARACTER' : prev === 'CHARACTER' ? 'ACTOR' : 'BOTH'
              )
            }
            className="absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-red-600 border border-white/15 text-xs font-medium text-zinc-100 transition cursor-pointer"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>
              {viewMode === 'BOTH'
                ? 'Photo: Split'
                : viewMode === 'CHARACTER'
                ? 'Photo: Character'
                : 'Photo: Actor'}
            </span>
          </button>
        </div>

        {/* Compact Dual Identity Details (Left-Aligned per UI/UX Slide 7 & 21) */}
        <div className="p-4 space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/30 text-xs font-medium text-red-300 truncate">
              {roleBadge}
            </span>
            {person.country?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-300 shrink-0">
                <Globe className="h-3.5 w-3.5 text-red-400" />
                <span>{person.country.name}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            {/* Character Identity Pill */}
            <div className="rounded-xl bg-[#111118] border border-white/10 p-3">
              <div className="flex items-center gap-1 text-xs font-medium uppercase text-red-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Character</span>
              </div>
              <h3 className="text-base font-bold text-[#f5f5f5] font-serif-title truncate mt-1">
                {character.name}
              </h3>
            </div>

            {/* Real Actor Identity Pill */}
            <div className="rounded-xl bg-[#111118] border border-white/10 p-3">
              <div className="flex items-center gap-1 text-xs font-medium uppercase text-zinc-300">
                <User className="h-3.5 w-3.5 text-red-400" />
                <span>Real Actor</span>
              </div>
              <p className="text-base font-bold text-[#f5f5f5] truncate mt-1">
                {person.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Link to Character/Actor Detail Page */}
      <div className="px-4 pb-4 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {person.birthday ? `Born ${person.birthday}` : 'Cast Profile'}
        </span>
        <Link
          to={`/characters/${person.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 group-hover:text-red-300 transition"
        >
          <span>Open Dossier</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
