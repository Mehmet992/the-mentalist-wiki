import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating "Back to Top" button that appears in the bottom-right corner
 * once the visitor scrolls past 360px on long listing or timeline pages.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /**
     * Checks window vertical scroll offset to toggle button visibility.
     */
    const handleScroll = () => {
      setVisible(window.scrollY > 360);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Smoothly scrolls the viewport back to the top of the page.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-2xl bg-red-600/90 hover:bg-red-500 text-white border border-red-400/50 shadow-[0_0_25px_rgba(220,38,38,0.65)] flex items-center justify-center transition-all hover:-translate-y-1 cursor-pointer animate-fade-slide"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
