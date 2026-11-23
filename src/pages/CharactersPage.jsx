import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, Users } from 'lucide-react';
import {
  fetchSeasonEpisodes,
  fetchShowCast,
  fetchShowSeasons,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';
import CharacterCard from '../components/cards/CharacterCard';
import AgentBadgeGenerator from '../components/cards/AgentBadgeGenerator';
import Pagination from '../components/common/Pagination';

const ITEMS_PER_PAGE = 9;

/**
 * Characters & Actors Listing Page (/characters) displaying both the Real Actor
 * identity and the in-series Character identity fetched from TVmaze API.
 * Supports searching by actor or character name, filtering between Main Cast and
 * Season Guest Stars, gender filtering, and pagination.
 */
export default function CharactersPage() {
  const [mainCast, setMainCast] = useState([]);
  const [guestCast, setGuestCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [castScope, setCastScope] = useState('ALL'); // 'ALL', 'MAIN', 'GUEST'
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetches the main series cast and season guest cast records from TVmaze API.
   */
  const loadCastDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [castData, seasonsData] = await Promise.all([
        fetchShowCast(),
        fetchShowSeasons(),
      ]);

      // Deduplicate main cast by person ID
      const seenIds = new Set();
      const uniqueMain = [];
      for (const item of castData) {
        const pid = item.person?.id;
        if (pid && !seenIds.has(pid)) {
          seenIds.add(pid);
          uniqueMain.push({
            ...item,
            roleBadge: 'Main Series Cast',
            scope: 'MAIN',
          });
        }
      }

      // Also fetch Season 1 guest cast from API so users can browse dozens of guest suspects & recurring figures
      let extractedGuests = [];
      if (seasonsData.length > 0) {
        try {
          const seasonOneEpisodes = await fetchSeasonEpisodes(seasonsData[0].id);
          for (const ep of seasonOneEpisodes) {
            const epGuests = ep._embedded?.guestcast || [];
            for (const g of epGuests) {
              const pid = g.person?.id;
              if (pid && !seenIds.has(pid)) {
                seenIds.add(pid);
                extractedGuests.push({
                  ...g,
                  roleBadge: `Guest • S${ep.season}E${ep.number} (${ep.name})`,
                  scope: 'GUEST',
                });
              }
            }
          }
        } catch {
          // If guest cast embed is unavailable, continue cleanly with main cast
          extractedGuests = [];
        }
      }

      setMainCast(uniqueMain);
      setGuestCast(extractedGuests);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCastDirectory();
  }, [loadCastDirectory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, castScope, genderFilter]);

  const combinedDirectory = useMemo(
    () => [...mainCast, ...guestCast],
    [mainCast, guestCast]
  );

  // Filter cast members reactively by actor name, character name, scope, and gender
  const filteredCast = useMemo(() => {
    return combinedDirectory.filter((item) => {
      if (castScope !== 'ALL' && item.scope !== castScope) return false;
      if (
        genderFilter !== 'ALL' &&
        (item.person?.gender || '').toLowerCase() !== genderFilter.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorName = (item.person?.name || '').toLowerCase();
        const charName = (item.character?.name || '').toLowerCase();
        const country = (item.person?.country?.name || '').toLowerCase();
        return actorName.includes(q) || charName.includes(q) || country.includes(q);
      }

      return true;
    });
  }, [combinedDirectory, castScope, genderFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCast.length / ITEMS_PER_PAGE));
  const paginatedCast = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCast.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCast, currentPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Fetching real actor identities and series character records from API..."
          endpointHint="api.tvmaze.com/shows/116/cast"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadCastDirectory} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Filter Panel */}
      <div className="rounded-3xl border border-red-800/50 bg-gradient-to-br from-black via-zinc-950 to-red-950/60 p-6 sm:p-8 mb-8 shadow-[0_0_50px_rgba(220,38,38,0.18)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-red-900/50">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-mono-code uppercase mb-2">
              <Users className="h-3.5 w-3.5" />
              <span>Cast &amp; Character Directory • {combinedDirectory.length} Profiles</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-title">
              Actors &amp; Series Characters
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Explore the starring cast and guest stars of The Mentalist—comparing each actor&apos;s real-world identity with their in-universe character role.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCastScope('ALL');
              setGenderFilter('ALL');
            }}
            className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-red-800/50 text-xs font-mono-code text-zinc-200 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-red-400" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Search & Filter Controls with Visible Sticking Labels (UI/UX Slide 6 & 37) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 text-left">
          <div className="sm:col-span-6">
            <label
              htmlFor="characters-search-input"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Search Character Name, Real Actor, or Country
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="characters-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Patrick Jane, Simon Baker, Robin Tunney..."
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 pl-10 pr-4 text-sm text-[#f5f5f5] placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="characters-scope-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Cast Category
            </label>
            <select
              id="characters-scope-select"
              value={castScope}
              onChange={(e) => setCastScope(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3.5 text-sm text-zinc-200"
            >
              <option value="ALL">All Cast ({combinedDirectory.length})</option>
              <option value="MAIN">Main Series Cast ({mainCast.length})</option>
              <option value="GUEST">Episode Guest Cast ({guestCast.length})</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="characters-gender-select"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Actor Gender
            </label>
            <select
              id="characters-gender-select"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3.5 text-sm text-zinc-200"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male Actors</option>
              <option value="Female">Female Actresses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive CBI / FBI Agent ID Badge Generator Studio */}
      <AgentBadgeGenerator castList={mainCast} />

      {/* Cast Cards Grid */}
      {paginatedCast.length === 0 ? (
        <div className="rounded-2xl border border-red-900/40 bg-zinc-950/70 p-12 text-center">
          <p className="text-lg font-semibold text-white mb-2">
            No Actor or Character matches your search
          </p>
          <p className="text-xs text-zinc-400">
            Try searching for &ldquo;Simon Baker&rdquo;, &ldquo;Patrick Jane&rdquo;, &ldquo;Teresa Lisbon&rdquo;, or &ldquo;Kimball Cho&rdquo;.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCast.map((item) => (
              <CharacterCard
                key={`${item.person?.id}-${item.character?.id}`}
                castItem={item}
                roleBadge={item.roleBadge}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCast.length}
            visibleCount={paginatedCast.length}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
