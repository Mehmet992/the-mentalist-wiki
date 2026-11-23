import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Clock,
  Film,
  Layers,
  Menu,
  Search,
  Users,
  X,
} from 'lucide-react';
import GlobalSearchModal from '../common/GlobalSearchModal';
import RedJohnEasterEgg from '../common/RedJohnEasterEgg';

/**
 * Top navigation bar component with a balanced 3-zone grid layout:
 * Left: Brand Emblem (Clicking the Red John Smiley favicon triggers the Easter Egg)
 * Center: Symmetrically aligned pill dock for page navigation buttons
 * Right: Ctrl+K Instant Spotlight Search trigger
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home', icon: BookOpen },
    { to: '/timeline', label: 'Timeline', icon: Clock },
    { to: '/episodes', label: 'Episodes', icon: Film },
    { to: '/characters', label: 'Actors & Cast', icon: Users },
    { to: '/seasons', label: 'Seasons', icon: Layers },
    { to: '/investigation', label: 'RJ Board & Quiz', icon: Brain },
  ];

  // Global listener for Ctrl+K Spotlight Search AND typing "tyger, tyger" into any search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };

    const handleSearchInputEasterEgg = (e) => {
      const target = e.target;
      if (target && target.tagName === 'INPUT') {
        const val = (target.value || '').trim().toLowerCase();
        if (val === 'tyger' || val === 'tyger, tyger' || val === 'tyger tyger') {
          setSearchModalOpen(false);
          setEasterEggOpen(true);
          target.value = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('input', handleSearchInputEasterEgg);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('input', handleSearchInputEasterEgg);
    };
  }, []);

  /**
   * Computes uniform, aligned pill classes for active vs. inactive NavLink buttons.
   */
  const getLinkClasses = ({ isActive }) =>
    `inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
      isActive
        ? 'bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.5)]'
        : 'text-zinc-300 hover:text-white hover:bg-white/10'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left Zone: Red John Smiley Favicon (Triggers Easter Egg) + Brand Title Link */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setEasterEggOpen(true)}
              title="Click to reveal Red John's Calling Card"
              className="relative group cursor-pointer rounded-xl focus:outline-none"
            >
              <img
                src="/favicon.svg"
                alt="Red John Smiley Emblem"
                className="h-10 w-10 rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.55)] group-hover:scale-110 group-hover:shadow-[0_0_26px_rgba(239,68,68,0.9)] transition-all"
              />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif-title text-base sm:text-lg font-bold tracking-wider text-white whitespace-nowrap hover:text-red-400 transition">
                THE MENTALIST
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono-code uppercase tracking-widest rounded-md bg-red-600/20 border border-red-500/40 text-red-400">
                WIKI
              </span>
            </Link>
          </div>

          {/* Center Zone: Cleanly Aligned Page Navigation Pill Dock */}
          <nav className="hidden lg:flex items-center justify-center p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 gap-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={getLinkClasses}
                >
                  <IconComponent className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Zone: Ctrl+K Instant Spotlight Search */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-red-500/50 text-xs font-medium text-zinc-200 transition cursor-pointer"
            >
              <Search className="h-4 w-4 text-red-400" />
              <span className="hidden sm:inline">Search Archive</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono-code rounded bg-black border border-white/10 text-zinc-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-200 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black/95 px-4 pt-3 pb-5 grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-900/80 text-zinc-300 hover:bg-white/10'
                    }`
                  }
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Instant Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Red John Live-Painted Smiley Easter Egg Overlay */}
      <RedJohnEasterEgg
        isOpen={easterEggOpen}
        onClose={() => setEasterEggOpen(false)}
      />
    </>
  );
}
