import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  Star,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  getEpisodeColorMotif,
} from '../../services/api';

/**
 * Reusable card component displaying an episode's summary, season/episode badge,
 * airdate, rating, and clear "Watched" & "Favorite" user controls.
 *
 * @param {Object} props
 * @param {Object} props.episode - Episode object from TVmaze (/shows/116/episodes)
 * @param {boolean} [props.isSolved] - Whether this episode is marked as Watched
 * @param {boolean} [props.isPinned] - Whether this episode is marked as a Favorite
 * @param {Function} [props.onToggleSolved] - Callback to toggle Watched status
 * @param {Function} [props.onTogglePinned] - Callback to toggle Favorite status
 */
export default function EpisodeCard({
  episode,
  isSolved = false,
  isPinned = false,
  onToggleSolved,
  onTogglePinned,
}) {
  const { cleanSummary, milestoneTag, act, mentionsRedJohn } =
    analyzeEpisodeMilestone(episode);
  const colorMotif = getEpisodeColorMotif(episode);

  return (
    <article
      className={`glass-card-interactive group rounded-2xl overflow-hidden flex flex-col justify-between text-left ${
        isPinned
          ? 'border-red-400/70'
          : isSolved
          ? 'border-emerald-500/50'
          : ''
      }`}
    >
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

          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-black/25 to-transparent" />

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
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                act === 'RED_JOHN_ACT'
                  ? 'bg-red-600/90 text-white'
                  : 'bg-zinc-900/90 border border-white/15 text-zinc-200'
              }`}
            >
              {act === 'RED_JOHN_ACT' ? 'Act I: Red John Era' : 'Act II: FBI Era'}
            </span>

            {mentionsRedJohn && (
              <span className="px-2 py-0.5 rounded bg-black/85 border border-red-500 text-[10px] text-red-400 font-bold">
                Red John Case
              </span>
            )}
          </div>
        </div>

        {/* Episode Text Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-red-400" />
              <span>{episode.airdate || 'TBA'}</span>
            </span>
            <span className="text-red-400/90 font-medium">
              {colorMotif === 'RED_MOTIF'
                ? 'Crimson Title'
                : colorMotif === 'COLOR_SHIFT_MOTIF'
                ? 'Color Shift Title'
                : milestoneTag}
            </span>
          </div>

          <h2 className="text-lg font-bold text-[#f5f5f5] font-serif-title group-hover:text-red-400 transition line-clamp-1">
            {episode.name}
          </h2>

          <p className="text-base text-zinc-200 leading-[1.5] mt-1.5 line-clamp-2">
            {cleanSummary || 'No summary available.'}
          </p>
        </div>
      </div>

      {/* Bottom Action Bar: Clear Favorite & Watched Buttons + Detail Link */}
      <div className="px-4 sm:px-5 pb-4 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {onTogglePinned && (
            <button
              type="button"
              onClick={() => onTogglePinned(episode.id)}
              title={isPinned ? 'Remove from Favorites' : 'Save to Favorites'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                isPinned
                  ? 'bg-red-600/20 border-red-400 text-red-300'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-300'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isPinned ? 'fill-red-400 text-red-400' : ''}`} />
              <span>{isPinned ? 'Favorited' : 'Favorite'}</span>
            </button>
          )}

          {onToggleSolved && (
            <button
              type="button"
              onClick={() => onToggleSolved(episode.id)}
              title={isSolved ? 'Unmark as Watched' : 'Mark Episode as Watched'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                isSolved
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSolved ? 'Watched' : 'Mark Watched'}</span>
            </button>
          )}
        </div>

        <Link
          to={`/episodes/${episode.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 group-hover:text-red-300 transition shrink-0"
        >
          <span>Inspect Case</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
