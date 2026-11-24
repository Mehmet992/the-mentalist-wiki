import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Secret Red John Smiley Pop-Up triggered when the user favorites Season 6, Episode 8 ("Red John").
 * Displays strictly the iconic painted crimson Red John smiley face with zero text or UI hints,
 * and automatically closes after 5 seconds.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the 5-second smiley pop-up is active
 * @param {Function} props.onClose - Callback invoked after 5 seconds or on Escape/click dismissal
 */
export default function RedJohnSmileyFlash({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Automatically close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Red John Smiley"
      onClick={onClose}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-slide select-none cursor-pointer"
    >
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-red-600/25 blur-3xl animate-pulse" />

        <svg
          viewBox="0 0 240 260"
          className="relative z-10 w-full h-full drop-shadow-[0_0_35px_rgba(220,38,38,0.9)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Painted Blood Circle */}
          <circle
            cx="120"
            cy="112"
            r="86"
            stroke="#dc2626"
            strokeWidth="11"
            strokeLinecap="round"
            className="rj-draw-circle"
          />

          {/* Left & Right Painted Eyes */}
          <ellipse
            cx="90"
            cy="88"
            rx="10.5"
            ry="16.5"
            fill="#ef4444"
            className="rj-draw-eye-left"
          />
          <ellipse
            cx="150"
            cy="88"
            rx="10.5"
            ry="16.5"
            fill="#ef4444"
            className="rj-draw-eye-right"
          />

          {/* Painted Curved Smile */}
          <path
            d="M72 128 C90 164, 150 164, 168 128"
            stroke="#ef4444"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
            className="rj-draw-smile"
          />

          {/* Paint Drips Running Down */}
          <path
            d="M84 192 L84 242"
            stroke="#b91c1c"
            strokeWidth="6"
            strokeLinecap="round"
            className="rj-draw-drip"
          />
          <path
            d="M122 198 L122 254"
            stroke="#dc2626"
            strokeWidth="7"
            strokeLinecap="round"
            className="rj-draw-drip"
          />
          <path
            d="M154 190 L154 232"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
            className="rj-draw-drip"
          />
        </svg>
      </div>
    </div>,
    document.body
  );
}
