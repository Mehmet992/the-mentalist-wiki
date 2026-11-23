import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Film,
  Globe,
  Loader2,
  PauseCircle,
  Quote,
  Shield,
  User,
} from 'lucide-react';
import {
  fetchFandomWikiArticle,
  fetchWikipediaSummary,
} from '../../services/api';

/**
 * Displays the synchronized Dual-Identity Dossier for the currently active card
 * on the Home Page. When the user clicks "Read More Bio Text" (expandBios = true),
 * notifies the parent HomePage so the 3D card deck automatically pauses its timer
 * while the user reads the full biography.
 *
 * @param {Object} props
 * @param {Object} props.activeCastItem - Currently active cast object from TVmaze (/shows/116/cast)
 * @param {boolean} props.expandBios - Whether full biographies are expanded
 * @param {Function} props.onToggleExpandBios - Callback to toggle biography expansion
 */
export default function DualIdentityPanel({
  activeCastItem,
  expandBios = false,
  onToggleExpandBios,
}) {
  const [enrichment, setEnrichment] = useState({
    loading: false,
    actorWiki: null,
    characterWiki: null,
    fandomCharacter: null,
  });

  const person = activeCastItem?.person;
  const character = activeCastItem?.character;

  // Fetch live actor & character biography details whenever the top card changes
  useEffect(() => {
    let isMounted = true;
    if (!person || !character) return undefined;

    async function loadLiveBiographies() {
      setEnrichment((prev) => ({ ...prev, loading: true }));
      const [actorWiki, characterWiki, fandomCharacter] = await Promise.all([
        fetchWikipediaSummary(person.name),
        fetchWikipediaSummary(character.name),
        fetchFandomWikiArticle(character.name),
      ]);

      if (isMounted) {
        setEnrichment({
          loading: false,
          actorWiki,
          characterWiki,
          fandomCharacter,
        });
      }
    }

    loadLiveBiographies();
    return () => {
      isMounted = false;
    };
  }, [person, character]);

  if (!person || !character) return null;

  const { loading, actorWiki, characterWiki, fandomCharacter } = enrichment;
  const infobox = fandomCharacter?.infobox || {};

  const characterBioText =
    fandomCharacter?.overview ||
    characterWiki?.extract ||
    `Live character record retrieved from TVmaze API (Character ID #${character.id}).`;

  const actorBioText =
    actorWiki?.extract ||
    `Live actor record retrieved from TVmaze API (Person ID #${person.id}).`;

  return (
    <div
      key={person.id}
      className="glass-panel rounded-3xl p-5 sm:p-7 flex flex-col justify-between animate-fade-slide text-left"
    >
      <div>
        {/* Top Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-semibold uppercase">
              Active Deck Spotlight
            </span>
            {expandBios && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <PauseCircle className="h-3.5 w-3.5" />
                <span>Card Timer Paused While Reading</span>
              </span>
            )}
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                <span>Syncing API...</span>
              </span>
            )}
          </div>

          <Link
            to={`/characters/${person.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition underline-offset-4 hover:underline"
          >
            <span>Full Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Short Signature Quote Pill */}
        {fandomCharacter?.quote?.text && (
          <div className="mb-4 rounded-xl bg-[#12121a] border-l-3 border-red-500 px-3.5 py-2.5 flex items-center gap-2.5">
            <Quote className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm italic text-zinc-200 truncate">
              &ldquo;{fandomCharacter.quote.text}&rdquo;
            </p>
          </div>
        )}

        {/* Two Visual Identity Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: In-Series Character Identity */}
          <div className="rounded-2xl border border-white/10 bg-[#101017]/90 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Series Character</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-xs text-zinc-300">
                  {infobox.Status || 'Main Cast'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-3">
                {character.image?.medium && (
                  <img
                    src={character.image.medium}
                    alt={character.name}
                    className="h-14 w-14 rounded-xl object-cover object-top border border-red-500/50 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title truncate">
                    {character.name}
                  </h2>
                  <p className="text-xs text-red-300 truncate mt-0.5">
                    {infobox.Job || characterWiki?.description || 'CBI / FBI Consultant & Agent'}
                  </p>
                </div>
              </div>

              {/* 16px body text (text-base) with 1.5 line-height and 65ch max measure */}
              <p
                className={`text-base text-zinc-200 leading-[1.5] max-w-[65ch] ${
                  expandBios ? '' : 'line-clamp-2'
                }`}
              >
                {characterBioText}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span>Role: CBI / FBI Series Lead</span>
              <span className="font-mono-code">ID #{character.id}</span>
            </div>
          </div>

          {/* Card 2: Real-World Actor Identity */}
          <div className="rounded-2xl border border-white/10 bg-[#101017]/90 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  <User className="h-3.5 w-3.5 text-red-400" />
                  <span>Real Actor Identity</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-xs text-zinc-300">
                  {person.gender || 'Actor'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-3">
                {person.image?.medium && (
                  <img
                    src={person.image.medium}
                    alt={person.name}
                    className="h-14 w-14 rounded-xl object-cover object-top border border-zinc-700 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#f5f5f5] font-serif-title truncate">
                    {person.name}
                  </h2>
                  <p className="text-xs text-zinc-300 truncate mt-0.5">
                    {actorWiki?.description || `Portrays ${character.name}`}
                  </p>
                </div>
              </div>

              {/* 16px body text (text-base) with 1.5 line-height and 65ch max measure */}
              <p
                className={`text-base text-zinc-200 leading-[1.5] max-w-[65ch] ${
                  expandBios ? '' : 'line-clamp-2'
                }`}
              >
                {actorBioText}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-red-400" />
                <span>{person.country?.name || 'International'}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-red-400" />
                <span>{person.birthday || 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleExpandBios}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            expandBios
              ? 'bg-red-600/20 border-red-500/50 text-red-200'
              : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-200'
          }`}
        >
          <span>
            {expandBios ? 'Collapse Bio & Resume Deck Timer' : 'Read More Bio Text (Pauses Deck)'}
          </span>
          {expandBios ? (
            <ChevronUp className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-red-400" />
          )}
        </button>

        <Link
          to={`/characters/${person.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition"
        >
          <Film className="h-3.5 w-3.5" />
          <span>Inspect {character.name}</span>
        </Link>
      </div>
    </div>
  );
}
