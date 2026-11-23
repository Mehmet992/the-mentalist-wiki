import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Star } from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  getEpisodeColorMotif,
} from '../../services/api';

/**
 * Reusable card component displaying an episode's summary, season/episode badge,
 * airdate, and rating. Applies Progressive Disclosure (strict 2-line teaser)
 * and Rule 6 & 7 (glass-card-interactive hover elevation).
 *
 * @param {Object} props
 * @param {Object} props.episode - Episode object from TVmaze (/shows/116/episodes)
 */
export default function EpisodeCard({ episode }) {
  const { cleanSummary, milestoneTag, act, mentionsRedJohn } =
    analyzeEpisodeMilestone(episode);
  const colorMotif = getEpisodeColorMotif(episode);

  return (
    <article className="glass-card-interactive group rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        {/* Episode Thumbnail Image */}
        <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
          {episode.image?.medium || episode.image?.original ? (
            <img
              src={episode.image.medium || episode.image.original}
              alt={episode.name}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xs">
              No Episode Still
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

          {/* Season & Episode Code Pill */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-white">
            S{String(episode.season).padStart(2, '0')}E
            {String(episode.number).padStart(2, '0')}
          </div>

          {/* Rating Pill */}
          {episode.rating?.average && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/30 text-xs font-mono-code font-semibold text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>{episode.rating.average}</span>
            </div>
          )}

          {/* Narrative Act & Red John Indicator */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono-code uppercase font-semibold ${
                act === 'RED_JOHN_ACT'
                  ? 'bg-red-600/90 text-white'
                  : 'bg-zinc-900/90 border border-white/15 text-zinc-200'
              }`}
            >
              {act === 'RED_JOHN_ACT' ? 'Act I: Red John Era' : 'Act II: FBI Era'}
            </span>

            {mentionsRedJohn && (
              <span className="px-2 py-0.5 rounded bg-black/85 border border-red-500 text-[10px] font-mono-code text-red-400 font-bold">
                Red John Case
              </span>
            )}
          </div>
        </div>

        {/* Episode Text Content (Compact 2-line progressive disclosure) */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-[11px] font-mono-code text-zinc-400 mb-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-red-400" />
              <span>{episode.airdate || 'TBA'}</span>
            </span>
            <span className="text-red-400/90">
              {colorMotif === 'RED_MOTIF'
                ? 'Crimson Title'
                : colorMotif === 'COLOR_SHIFT_MOTIF'
                ? 'Color Shift Title'
                : 'Special'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white font-serif-title group-hover:text-red-400 transition line-clamp-1">
            {episode.name}
          </h3>

          <p className="text-xs text-zinc-300 leading-relaxed mt-1.5 line-clamp-2">
            {cleanSummary || 'No summary provided by API.'}
          </p>
        </div>
      </div>

      {/* Bottom Link to Detail Page */}
      <div className="px-4 sm:px-5 pb-4 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-mono-code text-zinc-500 truncate max-w-[170px]">
          {milestoneTag}
        </span>
        <Link
          to={`/episodes/${episode.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 group-hover:text-red-300 transition"
        >
          <span>Inspect Case</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
