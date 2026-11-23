import React, { useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

/**
 * ============================================================================
 * INSTRUCTOR NOTE — RED JOHN CALLING CARD EASTER EGG:
 * This hidden Easter Egg is triggered in two ways:
 * 1. Clicking the Red John Smiley favicon emblem at the top-left of the Navbar.
 * 2. Typing "tyger" or "tyger, tyger" into any search bar across the website.
 * When activated, it live-paints Red John's signature crimson smiley face
 * stroke-by-stroke across the screen using SVG path animations.
 * ============================================================================
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the Easter egg overlay is active
 * @param {Function} props.onClose - Callback to dismiss the Easter egg
 */
export default function RedJohnEasterEgg({ isOpen, onClose }) {
  // Allow closing the Easter Egg overlay with the Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-slide select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full rounded-3xl border border-red-600/50 bg-gradient-to-b from-zinc-950 via-black to-red-950/40 p-8 text-center shadow-[0_0_90px_rgba(220,38,38,0.45)]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Easter Egg"
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900/80 hover:bg-red-950 text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Classified Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[11px] font-mono-code uppercase tracking-widest text-red-400 mb-4">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Red John Calling Card • Blake Association</span>
        </div>

        {/* Live Stroke-by-Stroke Painted Red John Smiley SVG */}
        <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-red-600/20 blur-3xl animate-pulse" />

          <svg
            viewBox="0 0 240 260"
            className="w-full h-full drop-shadow-[0_0_25px_rgba(220,38,38,0.85)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Painted Blood Circle */}
            <circle
              cx="120"
              cy="112"
              r="86"
              stroke="#dc2626"
              strokeWidth="10"
              strokeLinecap="round"
              className="rj-draw-circle"
            />

            {/* Left & Right Painted Eyes */}
            <ellipse
              cx="90"
              cy="88"
              rx="10"
              ry="16"
              fill="#ef4444"
              className="rj-draw-eye-left"
            />
            <ellipse
              cx="150"
              cy="88"
              rx="10"
              ry="16"
              fill="#ef4444"
              className="rj-draw-eye-right"
            />

            {/* Painted Curved Smile */}
            <path
              d="M72 128 C90 164, 150 164, 168 128"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              className="rj-draw-smile"
            />

            {/* Paint Drips Running Down */}
            <path
              d="M84 192 L84 242"
              stroke="#b91c1c"
              strokeWidth="5.5"
              strokeLinecap="round"
              className="rj-draw-drip"
            />
            <path
              d="M122 198 L122 254"
              stroke="#dc2626"
              strokeWidth="6.5"
              strokeLinecap="round"
              className="rj-draw-drip"
            />
            <path
              d="M154 190 L154 232"
              stroke="#ef4444"
              strokeWidth="4.5"
              strokeLinecap="round"
              className="rj-draw-drip"
            />
          </svg>
        </div>

        {/* Blake Association Password Quote */}
        <blockquote className="mt-2 space-y-1">
          <p className="text-lg sm:text-xl font-serif-title italic text-red-400 font-bold tracking-wide">
            &ldquo;Tyger Tyger, burning bright, In the forests of the night...&rdquo;
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed pt-1">
            &ldquo;You always see his face on the wall first. That&apos;s how you know Red John was
            here.&rdquo; — Patrick Jane
          </p>
        </blockquote>

        {/* Single Clean Dismiss Button */}
        <div className="mt-6 pt-5 border-t border-white/10 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-zinc-200 hover:text-white transition cursor-pointer"
          >
            Dismiss Calling Card (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
