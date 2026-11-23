import React from 'react';
import { AlertTriangle, Clock, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';
import { clearApiCache } from '../../services/api';

/**
 * Displays a dedicated full-layout diagnostic error view when the public API or backend
 * server is unreachable, offline, or hits an HTTP 429 Rate Limit.
 *
 * @param {Object} props
 * @param {Error|Object|string} props.error - The caught error object or message from fetch
 * @param {Function} [props.onRetry] - Callback function triggered when the user clicks Retry
 * @param {string} [props.title] - Optional custom heading for the error layout
 */
export default function ApiErrorState({
  error,
  onRetry,
  title,
}) {
  const isRateLimit = error?.status === 429 || error?.isRateLimit;
  const computedTitle =
    title ||
    (isRateLimit
      ? 'API Rate Limit Reached (HTTP 429 — Too Many Requests)'
      : 'API / Backend Server Not Available Right Now');

  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'Unable to establish connection with the remote public API endpoint.';
  const endpointUrl = error?.endpoint || 'https://api.tvmaze.com/shows/116';
  const statusCode = error?.status || 'CONNECTION_FAILED';

  /**
   * Clears cached failed responses and triggers the parent's retry callback.
   */
  const handleRetryClick = () => {
    clearApiCache();
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[420px] w-full flex items-center justify-center p-6 my-4">
      <div className="max-w-2xl w-full glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            {isRateLimit ? <Clock className="h-7 w-7" /> : <ServerCrash className="h-7 w-7" />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-900/50 border border-red-500/40 text-red-200 text-xs font-mono-code uppercase mb-2">
              <WifiOff className="h-3 w-3" />
              <span>Status: {statusCode}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-title">
              {computedTitle}
            </h2>
          </div>
        </div>

        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-5">
          {isRateLimit ? (
            <>
              The public API server temporarily throttled requests due to rate limiting (
              <strong className="text-red-400">HTTP 429</strong>). Wait a few seconds and click
              retry—future responses are automatically persisted in browser{' '}
              <code className="text-red-300">localStorage</code> and tracked via session cookie
              to prevent repeat rate-limit hits.
            </>
          ) : (
            <>
              This Wiki dynamically retrieves all series, actor, character, and episode
              information directly from live public APIs with{' '}
              <strong className="text-red-400">no hardcoded fallback data</strong>. The remote
              API server could not be reached at this moment.
            </>
          )}
        </p>

        <div className="rounded-xl bg-black/80 border border-white/10 p-4 mb-6 font-mono-code text-xs space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>DIAGNOSTIC REPORT</span>
          </div>
          <div className="text-zinc-400 break-all">
            <span className="text-zinc-500">Target Endpoint: </span>
            <span className="text-red-300">{endpointUrl}</span>
          </div>
          <div className="text-zinc-300">
            <span className="text-zinc-500">Server Details: </span>
            <span>{errorMessage}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            Verify your network connection or click retry to query the API server again.
          </span>
          <button
            type="button"
            onClick={handleRetryClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-950/50 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry API Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
}
