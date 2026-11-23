import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Repeat, Shield, User } from 'lucide-react';

/**
 * Reusable Dual-Identity Character & Actor Card displaying both the in-series
 * character identity and the real-world actor identity fetched from the TVmaze API.
 * Uses compact visual rows (Progressive Disclosure) and Rule 6/7 glass-card-interactive elevation.
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

  return (
    <article className="glass-card-interactive group rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        {/* Dual Portrait Header showing Character & Real Actor side by side */}
        <div className="relative h-52 w-full bg-zinc-950 overflow-hidden">
          {viewMode === 'BOTH' ? (
            <div className="grid grid-cols-2 h-full w-full">
              <div className="relative h-full overflow-hidden border-r border-white/10">
                {charImage ? (
                  <img
                    src={charImage}
                    alt={character.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-zinc-600">
                    No Image
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-red-600/90 text-[10px] font-mono-code text-white uppercase font-semibold">
                  Character
                </span>
              </div>

              <div className="relative h-full overflow-hidden">
                {actorImage ? (
                  <img
                    src={actorImage}
                    alt={person.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-zinc-600">
                    No Image
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 border border-white/15 text-[10px] font-mono-code text-zinc-200 uppercase font-semibold">
                  Real Actor
                </span>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <img
                src={viewMode === 'ACTOR' ? actorImage : charImage}
                alt={viewMode === 'ACTOR' ? person.name : character.name}
                className="h-full w-full object-cover object-top"
              />
              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-red-600/90 text-[10px] font-mono-code text-white uppercase font-semibold">
                {viewMode === 'ACTOR' ? 'Real Actor Photo' : 'Character Photo'}
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Switch View Button */}
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) =>
                prev === 'BOTH' ? 'CHARACTER' : prev === 'CHARACTER' ? 'ACTOR' : 'BOTH'
              )
            }
            className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-red-600 border border-white/15 text-[10px] font-mono-code text-zinc-200 transition cursor-pointer"
          >
            <Repeat className="h-3 w-3" />
            <span>
              {viewMode === 'BOTH'
                ? 'Split'
                : viewMode === 'CHARACTER'
                ? 'Character'
                : 'Actor'}
            </span>
          </button>
        </div>

        {/* Compact Dual Identity Details */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/30 text-[10px] font-mono-code text-red-400 uppercase truncate max-w-[200px]">
              {roleBadge}
            </span>
            {person.country?.name && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <Globe className="h-3 w-3 text-red-400" />
                <span>{person.country.name}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Character Identity Pill */}
            <div className="rounded-xl bg-black/60 border border-white/10 p-2.5">
              <div className="flex items-center gap-1 text-[10px] font-mono-code uppercase text-red-400">
                <Shield className="h-3 w-3" />
                <span>Character</span>
              </div>
              <h3 className="text-sm font-bold text-white font-serif-title truncate mt-0.5">
                {character.name}
              </h3>
            </div>

            {/* Real Actor Identity Pill */}
            <div className="rounded-xl bg-black/60 border border-white/10 p-2.5">
              <div className="flex items-center gap-1 text-[10px] font-mono-code uppercase text-zinc-400">
                <User className="h-3 w-3 text-red-400" />
                <span>Real Actor</span>
              </div>
              <h4 className="text-sm font-bold text-zinc-100 truncate mt-0.5">
                {person.name}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Link to Character/Actor Detail Page */}
      <div className="px-4 pb-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-mono-code text-zinc-500">
          {person.birthday || 'TVmaze Profile'}
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
