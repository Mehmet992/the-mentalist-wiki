import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Quote,
  Shield,
  User,
} from 'lucide-react';
import {
  fetchFandomWikiArticle,
  fetchPersonDetails,
  fetchShowCast,
  fetchWikipediaSummary,
  recordRecentVisit,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';

/**
 * Dynamic Character & Real Actor Detail Page (/characters/:id) required by Section 3c of the PDF.
 * Applies Progressive Disclosure, 16px body text readability (Slides 10-12),
 * and records the visit for Recognition Over Recall (Slide 26).
 */
export default function CharacterDetailPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [character, setCharacter] = useState(null);
  const [actorWiki, setActorWiki] = useState(null);
  const [characterWiki, setCharacterWiki] = useState(null);
  const [fandomArticle, setFandomArticle] = useState(null);

  const [expandCharBio, setExpandCharBio] = useState(false);
  const [expandActorBio, setExpandActorBio] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads the actor and character data across TVmaze, Wikipedia, and Fandom APIs.
   */
  const loadCharacterAndActorDossier = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandCharBio(false);
    setExpandActorBio(false);
    try {
      const [personData, mainCastList] = await Promise.all([
        fetchPersonDetails(id),
        fetchShowCast(),
      ]);

      const matchedCastEntry = mainCastList.find(
        (c) => String(c.person?.id) === String(id)
      );
      const matchedCharacter = matchedCastEntry?.character || null;

      const [actorSummary, charSummary, fandomData] = await Promise.all([
        fetchWikipediaSummary(personData.name),
        matchedCharacter ? fetchWikipediaSummary(matchedCharacter.name) : Promise.resolve(null),
        matchedCharacter ? fetchFandomWikiArticle(matchedCharacter.name) : Promise.resolve(null),
      ]);

      setPerson(personData);
      setCharacter(matchedCharacter);
      setActorWiki(actorSummary);
      setCharacterWiki(charSummary);
      setFandomArticle(fandomData);

      // Record visit for Recognition Over Recall in Ctrl+K Search
      recordRecentVisit({
        path: `/characters/${personData.id}`,
        badge: matchedCharacter ? 'Character' : 'Actor',
        title: matchedCharacter
          ? `${matchedCharacter.name} (${personData.name})`
          : personData.name,
      });

      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCharacterAndActorDossier();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadCharacterAndActorDossier]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message={`Fetching real actor & series character dossier for ID #${id}...`}
          endpointHint={`api.tvmaze.com/people/${id}`}
        />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadCharacterAndActorDossier} />
      </div>
    );
  }

  const infobox = fandomArticle?.infobox || {};
  const fullCharacterNarrative = [
    fandomArticle?.overview || characterWiki?.extract,
    fandomArticle?.recap,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to="/characters"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition"
        >
          <ArrowLeft className="h-4 w-4 text-red-400" />
          <span>Back to Actors &amp; Characters Directory</span>
        </Link>
      </div>

      {/* Dual Identity Master Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN (6 cols): SERIES CHARACTER IDENTITY */}
        <section className="lg:col-span-6 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-xs font-semibold uppercase text-red-300">
                <Shield className="h-3.5 w-3.5 text-red-400" />
                <span>In-Series Character Identity</span>
              </span>
              {character && (
                <span className="text-xs font-mono-code text-zinc-400">
                  ID #{character.id}
                </span>
              )}
            </div>

            {character ? (
              <>
                <div className="flex flex-col sm:flex-row gap-5 items-start mb-6">
                  {character.image?.original || character.image?.medium ? (
                    <img
                      src={character.image.original || character.image.medium}
                      alt={character.name}
                      className="w-36 h-48 object-cover object-top rounded-2xl border border-red-500/50 shadow-lg shrink-0"
                    />
                  ) : null}

                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-[#f5f5f5] font-serif-title">
                      {character.name}
                    </h1>
                    <p className="text-sm text-red-300 font-medium">
                      {infobox.Job || characterWiki?.description || 'The Mentalist Series Character'}
                    </p>

                    {fandomArticle?.quote?.text && (
                      <div className="mt-3 rounded-xl bg-[#101017] border-l-3 border-red-500 p-3 text-sm italic text-zinc-200 flex items-start gap-2">
                        <Quote className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <span>&ldquo;{fandomArticle.quote.text}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Metadata Grid (No Debut field, just Status & Affiliation) */}
                <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                  <div className="rounded-xl bg-[#101017] border border-white/10 p-3">
                    <span className="text-zinc-400 uppercase block">Affiliation / Role</span>
                    <span className="text-[#f5f5f5] font-semibold mt-0.5 block truncate">
                      {infobox.Job || 'CBI & FBI Consultant / Agent'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#101017] border border-white/10 p-3">
                    <span className="text-zinc-400 uppercase block">Character Status</span>
                    <span className="text-red-400 font-semibold mt-0.5 block truncate">
                      {infobox.Status || 'Main Series Cast'}
                    </span>
                  </div>
                </div>

                {/* Progressive Disclosure Character Biography (16px base body text, 1.5 line-height, 65ch measure) */}
                <div className="rounded-2xl bg-[#101017] border border-white/10 p-5 space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">
                    Character Story Summary (Live Wiki API)
                  </h2>
                  <p
                    className={`text-base text-zinc-200 leading-[1.5] max-w-[65ch] whitespace-pre-line ${
                      expandCharBio ? '' : 'line-clamp-3'
                    }`}
                  >
                    {fullCharacterNarrative ||
                      'Character profile retrieved from TVmaze cast database.'}
                  </p>
                  {fullCharacterNarrative.length > 180 && (
                    <button
                      type="button"
                      onClick={() => setExpandCharBio((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <span>{expandCharBio ? 'Show Less' : 'Read Full Character Story'}</span>
                      {expandCharBio ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-base text-zinc-200">
                <p>
                  <strong className="text-white">{person.name}</strong> appeared as a guest actor
                  in The Mentalist. Inspect their real-world actor dossier on the right panel.
                </p>
              </div>
            )}
          </div>

          {fandomArticle?.wikiUrl && (
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <a
                href={fandomArticle.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 underline-offset-4 hover:underline"
              >
                <span>Fandom Wiki Source</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN (6 cols): REAL ACTOR IDENTITY */}
        <section className="lg:col-span-6 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/15 text-xs font-semibold uppercase text-zinc-200">
                <User className="h-3.5 w-3.5 text-red-400" />
                <span>Real-World Actor Identity</span>
              </span>
              <span className="text-xs font-mono-code text-zinc-400">
                Person ID #{person.id}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start mb-6">
              {person.image?.original || person.image?.medium ? (
                <img
                  src={person.image.original || person.image.medium}
                  alt={person.name}
                  className="w-36 h-48 object-cover object-top rounded-2xl border border-white/15 shadow-lg shrink-0"
                />
              ) : null}

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-[#f5f5f5] font-serif-title">
                  {person.name}
                </h2>
                <p className="text-sm text-zinc-300">
                  {actorWiki?.description || 'Television & Film Actor'}
                </p>

                <div className="pt-2 space-y-1.5 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-red-400" />
                    <span>
                      Country:{' '}
                      <strong className="text-[#f5f5f5]">
                        {person.country?.name || 'Not specified'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-400" />
                    <span>
                      Birthday:{' '}
                      <strong className="text-[#f5f5f5]">
                        {person.birthday || 'Not specified'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progressive Disclosure Real Actor Biography (16px base body text, 1.5 line-height, 65ch measure) */}
            <div className="rounded-2xl bg-[#101017] border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">
                Real Actor Career Bio (Wikipedia REST API)
              </h3>
              <p
                className={`text-base text-zinc-200 leading-[1.5] max-w-[65ch] whitespace-pre-line ${
                  expandActorBio ? '' : 'line-clamp-3'
                }`}
              >
                {actorWiki?.extract ||
                  `${person.name} is an international actor credited in The Mentalist (TVmaze Person ID #${person.id}).`}
              </p>
              {(actorWiki?.extract?.length || 0) > 180 && (
                <button
                  type="button"
                  onClick={() => setExpandActorBio((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <span>{expandActorBio ? 'Show Less' : 'Read Full Actor Bio'}</span>
                  {expandActorBio ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <a
              href={person.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-zinc-300 hover:text-white underline-offset-4 hover:underline"
            >
              <span>TVmaze Record</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {actorWiki?.pageUrl && (
              <a
                href={actorWiki.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-red-400 hover:text-red-300 underline-offset-4 hover:underline"
              >
                <span>Wikipedia Article</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
