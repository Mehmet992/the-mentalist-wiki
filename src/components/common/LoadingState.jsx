import React from 'react';
import { Loader2, Radio } from 'lucide-react';

/**
 * Displays a themed Red & Black loading screen while waiting for live API responses.
 * @param {Object} props
 * @param {string} [props.message] - Custom loading status text
 * @param {string} [props.endpointHint] - Optional indication of which API endpoint is being queried
 */
export default function LoadingState({
  message = 'Retrieving live dossier data from API...',
  endpointHint = 'api.tvmaze.com/shows/116',
}) {
  return (
    <div className="min-h-[380px] w-full flex flex-col items-center justify-center p-8 rounded-2xl border border-red-900/30 bg-gradient-to-br from-black via-zinc-950 to-red-950/30 text-center">
      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-16 w-16 rounded-full bg-red-600/20 animate-ping" />
        <div className="relative h-14 w-14 rounded-full border border-red-500/50 bg-black/80 flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.45)]">
          <Loader2 className="h-7 w-7 text-red-500 animate-spin" />
        </div>
      </div>

      <p className="text-lg font-semibold text-zinc-100 tracking-wide mb-1">
        {message}
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-800/40 text-xs font-mono-code text-red-300 mt-2">
        <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />
        <span>GET https://{endpointHint}</span>
      </div>
    </div>
  );
}
