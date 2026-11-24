/**
 * API Service Layer for The Mentalist Wiki
 *
 * Includes a 3-Layer Rate-Limit & Caching Protection System:
 * 1. Dual Cache (In-Memory Map + Persistent localStorage with 24h TTL + Cookie tracking)
 * 2. In-Flight Request Deduplication (prevents duplicate concurrent fetches)
 * 3. HTTP 429 Rate-Limit Detection, Auto-Retry Backoff & Stale-Cache Fallback
 */

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
const MENTALIST_SHOW_ID = 116;
const FANDOM_API_URL = 'https://thementalist.fandom.com/api.php';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKIQUOTE_API_URL = 'https://en.wikiquote.org/w/api.php';

// Cache configuration constants
const STORAGE_PREFIX = 'mentalist_api_cache_v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours persistent TTL

// Layer 1: Fast in-memory session cache
const memoryCache = new Map();

// In-memory session cache for interactive Investigation Lab state (not stored permanently in localStorage)
const sessionInvestigationCache = {
  scoreStats: { correct: 0, total: 0, streak: 0 },
  suspectStatuses: {},
  memoryPalace: {
    solvedIds: [],
    pinnedIds: [],
  },
};

/**
 * Returns the active session's Memory Palace state (solved and pinned episode IDs).
 */
export function getMemoryPalaceState() {
  return sessionInvestigationCache.memoryPalace;
}

/**
 * Toggles an episode ID as solved/watched in Patrick Jane's Memory Palace session cache.
 */
export function toggleMemoryPalaceSolved(episodeId) {
  const numId = Number(episodeId);
  const current = sessionInvestigationCache.memoryPalace.solvedIds;
  const exists = current.includes(numId);
  sessionInvestigationCache.memoryPalace = {
    ...sessionInvestigationCache.memoryPalace,
    solvedIds: exists ? current.filter((id) => id !== numId) : [...current, numId],
  };
  return sessionInvestigationCache.memoryPalace;
}

/**
 * Toggles an episode ID as pinned/bookmarked in Patrick Jane's Memory Palace session cache.
 */
export function toggleMemoryPalacePinned(episodeId) {
  const numId = Number(episodeId);
  const current = sessionInvestigationCache.memoryPalace.pinnedIds;
  const exists = current.includes(numId);
  sessionInvestigationCache.memoryPalace = {
    ...sessionInvestigationCache.memoryPalace,
    pinnedIds: exists ? current.filter((id) => id !== numId) : [...current, numId],
  };
  return sessionInvestigationCache.memoryPalace;
}

/**
 * Reads or updates the in-memory cached Observation Test score & streak for the active session.
 */
export function getCachedQuizScore() {
  return sessionInvestigationCache.scoreStats;
}

export function setCachedQuizScore(nextStats) {
  sessionInvestigationCache.scoreStats = nextStats;
  return sessionInvestigationCache.scoreStats;
}

/**
 * Reads or updates the in-memory cached Red John Suspect Board markings for the active session.
 */
export function getCachedSuspectStatuses() {
  return sessionInvestigationCache.suspectStatuses;
}

export function setCachedSuspectStatuses(nextStatuses) {
  sessionInvestigationCache.suspectStatuses = nextStatuses;
  return sessionInvestigationCache.suspectStatuses;
}

// Layer 2: In-flight Promise map to deduplicate simultaneous identical requests
const inFlightRequests = new Map();

/**
 * Sets a lightweight browser cookie recording the active API cache session status
 * and last-updated timestamp so the browser tracks rate-limit protection state.
 */
function updateCacheSessionCookie(status = 'PROTECTED') {
  try {
    const expires = new Date(Date.now() + CACHE_TTL_MS).toUTCString();
    document.cookie = `mentalist_api_guard=${status}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie write errors in restricted environments
  }
}

/**
 * Reads a cached API response from persistent localStorage if it exists.
 * Returns { data, isExpired } so callers can use fresh data immediately
 * or fall back to stale data if the remote API hits a 429 rate limit.
 */
function readPersistentCache(url) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${url}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') return null;

    const age = Date.now() - parsed.timestamp;
    return {
      data: parsed.data,
      isExpired: age > CACHE_TTL_MS,
    };
  } catch {
    return null;
  }
}

/**
 * Saves a valid API response into persistent localStorage and updates the session cookie.
 */
function writePersistentCache(url, data) {
  try {
    const payload = JSON.stringify({
      timestamp: Date.now(),
      data,
    });
    localStorage.setItem(`${STORAGE_PREFIX}${url}`, payload);
    updateCacheSessionCookie('ACTIVE_CACHE');
  } catch {
    // If localStorage quota is full, evict older cache entries and retry
    try {
      clearPersistentStorageOnly();
      localStorage.setItem(
        `${STORAGE_PREFIX}${url}`,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
}

/**
 * Helper to remove only cached API items from localStorage.
 */
function clearPersistentStorageOnly() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage access errors
  }
}

/**
 * Clears both the in-memory cache and persistent localStorage cache
 * when the user clicks "Retry API Connection".
 */
export function clearApiCache() {
  memoryCache.clear();
  inFlightRequests.clear();
  clearPersistentStorageOnly();
  updateCacheSessionCookie('RESET');
}

/**
 * Waits for a specified number of milliseconds (used for HTTP 429 rate-limit backoff).
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Core JSON fetcher with 3-layer protection:
 * 1. Checks in-memory Map and persistent localStorage (zero network calls if cached).
 * 2. Deduplicates concurrent identical requests via inFlightRequests Map.
 * 3. Handles HTTP 429 (Rate Limit Exceeded) with automatic retry backoff and stale-cache fallback.
 */
async function fetchJsonWithCache(url, useCache = true) {
  // 1. Check fast in-memory Map cache first
  if (useCache && memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  // 2. Check persistent localStorage cache (survives F5 page refreshes!)
  const storedEntry = useCache ? readPersistentCache(url) : null;
  if (storedEntry && !storedEntry.isExpired) {
    memoryCache.set(url, storedEntry.data);
    return storedEntry.data;
  }

  // 3. Deduplicate if an identical request is already in flight
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const requestPromise = (async () => {
    let response;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        response = await fetch(url);
      } catch {
        // Network offline: fall back to expired persistent cache if available!
        if (storedEntry?.data) {
          memoryCache.set(url, storedEntry.data);
          return storedEntry.data;
        }
        const error = new Error(
          `Network error: Unable to reach the API server (${url}). Please check your internet connection.`
        );
        error.endpoint = url;
        error.status = 'NETWORK_OFFLINE';
        throw error;
      }

      // Check specifically for HTTP 429 (Too Many Requests / Rate Limit Exceeded)
      if (response.status === 429) {
        updateCacheSessionCookie('RATE_LIMITED_429');

        // Wait and retry once with backoff
        if (attempt < maxAttempts) {
          const retryAfterHeader = Number(response.headers.get('Retry-After'));
          const backoffMs =
            !Number.isNaN(retryAfterHeader) && retryAfterHeader > 0
              ? Math.min(retryAfterHeader * 1000, 3000)
              : 1200;
          await delay(backoffMs);
          continue;
        }

        // If still rate-limited on retry, serve stale cached copy from localStorage if available
        if (storedEntry?.data) {
          memoryCache.set(url, storedEntry.data);
          return storedEntry.data;
        }

        const rateError = new Error(
          `API Rate Limit Reached (HTTP 429 Too Many Requests) at ${url}. Please wait a few seconds and retry.`
        );
        rateError.endpoint = url;
        rateError.status = 429;
        rateError.isRateLimit = true;
        throw rateError;
      }

      // Break out of retry loop for normal responses
      break;
    }

    if (!response.ok) {
      // Fall back to stale cache if server has a temporary 5xx error
      if (storedEntry?.data && response.status >= 500) {
        memoryCache.set(url, storedEntry.data);
        return storedEntry.data;
      }

      const error = new Error(
        `API request failed with status ${response.status} (${response.statusText}) at ${url}`
      );
      error.endpoint = url;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (useCache) {
      memoryCache.set(url, data);
      writePersistentCache(url, data);
    }
    return data;
  })();

  inFlightRequests.set(url, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(url);
  }
}

/**
 * Strips HTML tags (such as <p>, <b>, <i>) returned inside TVmaze summary strings.
 */
export function stripHtmlTags(htmlString) {
  if (!htmlString) return '';
  return htmlString
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches the main show overview for The Mentalist (Show ID: 116) from TVmaze.
 */
export async function fetchShowOverview() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}`);
}

/**
 * Fetches the main cast list (pairing real-world actors with series characters) from TVmaze.
 */
export async function fetchShowCast() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}/cast`);
}

/**
 * Fetches all 151 episodes across all 7 seasons of The Mentalist from TVmaze.
 */
export async function fetchShowEpisodes() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}/episodes`);
}

/**
 * Fetches a single episode by ID along with embedded guest cast and guest crew (directors/writers).
 */
export async function fetchEpisodeDetails(episodeId) {
  return fetchJsonWithCache(
    `${TVMAZE_BASE_URL}/episodes/${episodeId}?embed[]=guestcast&embed[]=guestcrew`
  );
}

/**
 * Fetches all 7 seasons metadata (premiere date, end date, episode order, poster) from TVmaze.
 */
export async function fetchShowSeasons() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}/seasons`);
}

/**
 * Fetches episodes for a specific season ID with embedded guest cast.
 */
export async function fetchSeasonEpisodes(seasonId) {
  return fetchJsonWithCache(
    `${TVMAZE_BASE_URL}/seasons/${seasonId}/episodes?embed=guestcast`
  );
}

/**
 * Fetches the production crew (creators, producers, writers, directors) from TVmaze.
 */
export async function fetchShowCrew() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}/crew`);
}

/**
 * Fetches official show posters, banners, and background artwork from TVmaze.
 */
export async function fetchShowImages() {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/shows/${MENTALIST_SHOW_ID}/images`);
}

/**
 * Fetches a specific actor/person profile by their TVmaze person ID.
 */
export async function fetchPersonDetails(personId) {
  return fetchJsonWithCache(`${TVMAZE_BASE_URL}/people/${personId}?embed=castcredits`);
}

/**
 * Searches TVmaze for a person by name and returns the top matching actor object.
 */
export async function searchTvMazePerson(actorName) {
  if (!actorName) return null;
  const cleanName = actorName.split(',')[0].replace(/\(.*\)/g, '').trim();
  const url = `${TVMAZE_BASE_URL}/search/people?q=${encodeURIComponent(cleanName)}`;
  try {
    const results = await fetchJsonWithCache(url);
    return results?.[0]?.person || null;
  } catch {
    return null;
  }
}

/**
 * Fetches live Fandom Wiki page thumbnails for a list of article titles in one batch call,
 * automatically following MediaWiki redirects (e.g. "Raymond Haffner" -> "Ray Haffner").
 */
export async function fetchFandomPageThumbnails(titles = []) {
  if (!titles.length) return {};
  const joined = titles.map((t) => t.trim().replace(/\s+/g, '_')).join('|');
  const url = `${FANDOM_API_URL}?action=query&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=420&titles=${encodeURIComponent(
    joined
  )}&format=json&origin=*`;
  try {
    const data = await fetchJsonWithCache(url);
    const pages = data?.query?.pages || {};
    const redirects = data?.query?.redirects || [];
    const thumbMap = {};
    Object.values(pages).forEach((p) => {
      if (p?.title && p?.thumbnail?.source) {
        thumbMap[p.title.toLowerCase()] = p.thumbnail.source;
      }
    });
    // Also map original pre-redirect titles to the resolved thumbnail URL
    redirects.forEach((r) => {
      const targetThumb = thumbMap[(r.to || '').toLowerCase()];
      if (targetThumb && r.from) {
        thumbMap[r.from.toLowerCase()] = targetThumb;
      }
    });
    return thumbMap;
  } catch {
    return {};
  }
}

/**
 * Dynamically fetches the live Fandom Wiki dossiers and TVmaze actor portraits
 * for Patrick Jane's 7 final Red John suspects from Season 5/6.
 * Prioritizes reliable TVmaze portraits (static.tvmaze.com) with Fandom thumbnails as fallback
 * so suspect photos never break due to hotlink restrictions.
 */
export async function fetchRedJohnSuspectsBoard() {
  const suspectNames = [
    'Bret Stiles',
    'Gale Bertram',
    'Raymond Haffner',
    'Reede Smith',
    'Bob Kirkland',
    'Brett Partridge',
    'Thomas McAllister',
  ];

  const [thumbMap, articles] = await Promise.all([
    fetchFandomPageThumbnails(suspectNames),
    Promise.all(suspectNames.map((name) => fetchFandomWikiArticle(name))),
  ]);

  const enrichedSuspects = await Promise.all(
    suspectNames.map(async (name, index) => {
      const article = articles[index];
      const actorName = article?.infobox?.Actor || article?.infobox?.actor || '';
      const tvMazeActor = await searchTvMazePerson(actorName);
      const fandomThumb =
        thumbMap[name.toLowerCase()] ||
        thumbMap[(article?.title || '').toLowerCase()] ||
        null;
      const tvMazePhoto =
        tvMazeActor?.image?.original || tvMazeActor?.image?.medium || null;

      const isTrueRedJohn =
        name.toLowerCase().includes('mcallister') ||
        (article?.overview || '').toLowerCase().includes('revealed to be red john');

      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        actorName: tvMazeActor?.name || actorName || 'Guest Actor',
        actorPersonId: tvMazeActor?.id || null,
        characterImage: tvMazePhoto || fandomThumb || null,
        fallbackImage: fandomThumb || tvMazePhoto || null,
        actorImage: tvMazePhoto || fandomThumb || null,
        job: article?.infobox?.Job || 'Suspect on Patrick Jane’s Final 7 List',
        status: article?.infobox?.Status || 'Investigated in Season 6',
        overview:
          article?.overview ||
          'Identified by Patrick Jane as one of the seven final suspects who shook his hand and matched the Red John profile.',
        wikiUrl: article?.wikiUrl || null,
        isTrueRedJohn,
      };
    })
  );

  return enrichedSuspects;
}

const PULLPUSH_MEMES_URL =
  'https://api.pullpush.io/reddit/search/submission/?subreddit=TheMentalist&size=80&sort=desc&sort_type=score';
const MEMES_API_URL = 'https://meme-api.com/gimme/TheMentalist/20';
const ACTIVE_MEMES_BATCH_KEY = `${STORAGE_PREFIX}active_memes_batch`;
const ACTIVE_BANTER_BATCH_KEY = `${STORAGE_PREFIX}active_banter_batch`;
const MEME_REFRESH_LOG_KEY = 'mentalist_meme_refresh_log_v1';
export const MEME_REFRESH_COOLDOWN_MS = 15 * 1000; // Minimum 15 seconds between manual refreshes
export const MEME_REFRESH_WINDOW_MS = 60 * 1000; // Rolling 1-minute window
export const MEME_REFRESH_MAX_PER_MINUTE = 3; // Maximum 3 manual refreshes per minute

let memeRefreshTimestampsMemory = [];

/**
 * Reads recent manual meme refresh timestamps from memory and persistent localStorage
 * so rate-limit protection holds even if the user reloads the page.
 */
function readMemeRefreshTimestamps(now = Date.now()) {
  let stored = memeRefreshTimestampsMemory;
  try {
    const raw = localStorage.getItem(MEME_REFRESH_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed;
      }
    }
  } catch {
    // Fallback to in-memory log when localStorage is unavailable
  }

  const pruned = stored.filter(
    (ts) => typeof ts === 'number' && now - ts < MEME_REFRESH_WINDOW_MS
  );
  memeRefreshTimestampsMemory = pruned;
  return pruned;
}

/**
 * Persists updated manual meme refresh timestamps into memory and localStorage.
 */
function writeMemeRefreshTimestamps(timestamps) {
  memeRefreshTimestampsMemory = timestamps;
  try {
    localStorage.setItem(MEME_REFRESH_LOG_KEY, JSON.stringify(timestamps));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Checks whether the user is currently allowed to trigger a manual meme refresh.
 * Enforces both a 15-second cooldown between clicks and a max of 3 refreshes per minute.
 *
 * @param {number} [now] - Current timestamp in ms
 * @returns {{ allowed: boolean, retryAfterSeconds: number, remainingInWindow: number }}
 */
export function getMemeRefreshRateLimitStatus(now = Date.now()) {
  const recent = readMemeRefreshTimestamps(now);
  const remainingInWindow = Math.max(0, MEME_REFRESH_MAX_PER_MINUTE - recent.length);

  if (recent.length > 0) {
    const lastRefresh = recent[recent.length - 1];
    const sinceLast = now - lastRefresh;
    if (sinceLast < MEME_REFRESH_COOLDOWN_MS) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((MEME_REFRESH_COOLDOWN_MS - sinceLast) / 1000),
        remainingInWindow,
      };
    }
  }

  if (recent.length >= MEME_REFRESH_MAX_PER_MINUTE) {
    const oldestInWindow = recent[0];
    const waitMs = Math.max(1000, MEME_REFRESH_WINDOW_MS - (now - oldestInWindow));
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(waitMs / 1000),
      remainingInWindow: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingInWindow,
  };
}

/**
 * Records a manual meme refresh timestamp into the rate-limit window.
 */
export function recordMemeRefreshAttempt(now = Date.now()) {
  const recent = readMemeRefreshTimestamps(now);
  const updated = [...recent, now];
  writeMemeRefreshTimestamps(updated);
  return getMemeRefreshRateLimitStatus(now);
}

/**
 * Resets the manual meme refresh rate-limit log (used in automated unit tests).
 */
export function resetMemeRefreshRateLimit() {
  memeRefreshTimestampsMemory = [];
  try {
    localStorage.removeItem(MEME_REFRESH_LOG_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reads the persisted active Iconic Banter selection ({ season, sceneIds }) from localStorage.
 */
export function getSavedBanterSelection() {
  try {
    const raw = localStorage.getItem(ACTIVE_BANTER_BATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.season === 'number' && Array.isArray(parsed.sceneIds)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves the active Iconic Banter selection ({ season, sceneIds }) into localStorage
 * so closing and reopening the tab keeps the user's current banter batch.
 */
export function saveBanterSelection(selection) {
  try {
    localStorage.setItem(ACTIVE_BANTER_BATCH_KEY, JSON.stringify(selection));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Helper to shuffle an array cleanly without mutating the input.
 */
function shuffleList(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Normalizes live image/GIF posts from both Pullpush (65+ top-scoring r/TheMentalist posts)
 * and meme-api.com into a single deduplicated community meme pool.
 */
function normalizeCombinedMemePool(pullpushData, memeApiData) {
  const combined = [];
  const seenUrls = new Set();
  const imageExtRegex = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i;

  const pushUnique = (item) => {
    if (!item || !item.imageUrl || seenUrls.has(item.imageUrl)) return;
    seenUrls.add(item.imageUrl);
    combined.push(item);
  };

  // 1. Primary live pool: Pullpush archive of top-scoring r/TheMentalist image & GIF posts
  const pullpushPosts = Array.isArray(pullpushData?.data) ? pullpushData.data : [];
  for (const post of pullpushPosts) {
    const url = post?.url || '';
    if (!url || post.over_18 || !imageExtRegex.test(url)) continue;
    if (post.author === '[deleted]' || post.removed_by_category) continue;
    const permalink = post.permalink
      ? `https://www.reddit.com${post.permalink}`
      : post.full_link || `https://www.reddit.com/r/TheMentalist/comments/${post.id}`;
    pushUnique({
      id: post.id ? `pp-${post.id}` : url,
      title:
        post.title && post.title.trim() !== '.'
          ? post.title.trim()
          : 'The Mentalist Community Post',
      imageUrl: url,
      author: post.author || 'Mentalist Fan',
      upvotes: typeof post.score === 'number' ? post.score : 0,
      postLink: permalink,
      subreddit: post.subreddit || 'TheMentalist',
      isGif: /\.gif($|\?)/i.test(url),
      spoiler: Boolean(post.spoiler),
    });
  }

  // 2. Secondary live pool: meme-api.com current hot posts from r/TheMentalist
  const hotMemes = Array.isArray(memeApiData?.memes) ? memeApiData.memes : [];
  for (const m of hotMemes) {
    if (!m || !m.url || m.nsfw) continue;
    pushUnique({
      id: m.postLink || m.url,
      title: m.title && m.title.trim() !== '.' ? m.title.trim() : 'The Mentalist Community Post',
      imageUrl: m.url,
      author: m.author || 'Mentalist Fan',
      upvotes: m.ups || 0,
      postLink: m.postLink,
      subreddit: m.subreddit || 'TheMentalist',
      isGif: /\.gif($|\?)/i.test(m.url),
      spoiler: Boolean(m.spoiler),
    });
  }

  return combined;
}

/**
 * Fetches live social media memes, fan creations, and GIFs from a 65+ post live pool
 * (Pullpush r/TheMentalist top archive + meme-api.com).
 * The active batch stays persisted in localStorage across reloads; manual refresh enforces
 * cooldown & per-minute limits and selects a brand-new non-repeating batch excluding current IDs.
 *
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh] - When true, enforces rate limit and rotates to a fresh batch
 * @param {Array<string>} [options.excludeIds] - Currently displayed meme IDs to exclude on refresh
 * @param {number} [options.batchSize] - Number of memes to return per batch (default: 8)
 */
export async function fetchMentalistCommunityMemes({
  forceRefresh = false,
  excludeIds = [],
  batchSize = 8,
} = {}) {
  // 1. On normal page loads, serve the user's saved active batch from localStorage immediately
  if (!forceRefresh) {
    try {
      const savedRaw = localStorage.getItem(ACTIVE_MEMES_BATCH_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (
          parsed &&
          Array.isArray(parsed.items) &&
          parsed.items.length > 0 &&
          Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS
        ) {
          return parsed.items;
        }
      }
    } catch {
      // Proceed to live fetch if storage is unavailable
    }
  } else {
    // 2. On manual refresh, enforce 15s cooldown & 3-per-minute rate limit
    const limitStatus = getMemeRefreshRateLimitStatus();
    if (!limitStatus.allowed) {
      const throttleError = new Error(
        `Please wait ${limitStatus.retryAfterSeconds}s before refreshing again.`
      );
      throttleError.isRateLimit = true;
      throttleError.retryAfterSeconds = limitStatus.retryAfterSeconds;
      throw throttleError;
    }
  }

  // Fetch both live sources in parallel (pool itself is cached for 24h in localStorage; hot endpoint refreshes on demand)
  if (forceRefresh) {
    memoryCache.delete(MEMES_API_URL);
  }
  const [pullpushRes, memeApiRes] = await Promise.allSettled([
    fetchJsonWithCache(PULLPUSH_MEMES_URL, true),
    fetchJsonWithCache(MEMES_API_URL, !forceRefresh),
  ]);

  const pullpushData = pullpushRes.status === 'fulfilled' ? pullpushRes.value : null;
  const memeApiData = memeApiRes.status === 'fulfilled' ? memeApiRes.value : null;

  if (forceRefresh && memeApiData) {
    memoryCache.set(MEMES_API_URL, memeApiData);
    writePersistentCache(MEMES_API_URL, memeApiData);
  }

  const fullPool = normalizeCombinedMemePool(pullpushData, memeApiData);
  if (fullPool.length === 0) {
    return [];
  }

  // Pick a fresh batch strictly excluding the currently visible meme IDs whenever enough unseen memes exist
  const excludedSet = new Set(excludeIds);
  const freshCandidates = shuffleList(fullPool.filter((m) => !excludedSet.has(m.id)));
  const fallbackCandidates = shuffleList(fullPool.filter((m) => excludedSet.has(m.id)));
  const nextBatch = [...freshCandidates, ...fallbackCandidates].slice(0, batchSize);

  // Persist the active batch in localStorage so closing and reopening the tab preserves it
  try {
    localStorage.setItem(
      ACTIVE_MEMES_BATCH_KEY,
      JSON.stringify({ timestamp: Date.now(), items: nextBatch })
    );
  } catch {
    // Ignore storage errors
  }

  if (forceRefresh) {
    recordMemeRefreshAttempt();
  }

  return nextBatch;
}

/**
 * Returns true if the given episode is Season 6, Episode 8 ("Red John") —
 * the climax of the Red John arc.
 */
export function isRedJohnShowdownEpisode(episode) {
  return Boolean(episode && Number(episode.season) === 6 && Number(episode.number) === 8);
}

/**
 * Fetches an encyclopedic biography/summary from the public Wikipedia REST API
 * for a given actor or character name (e.g. "Simon Baker" or "Patrick Jane").
 */
export async function fetchWikipediaSummary(pageTitle) {
  if (!pageTitle) return null;
  const formattedTitle = encodeURIComponent(pageTitle.trim().replace(/\s+/g, '_'));
  const url = `${WIKIPEDIA_SUMMARY_URL}/${formattedTitle}`;
  try {
    const data = await fetchJsonWithCache(url);
    return {
      title: data.title,
      description: data.description || '',
      extract: data.extract || '',
      pageUrl: data.content_urls?.desktop?.page || null,
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

/**
 * Cleans MediaWiki markup (links, templates, files, bold/italic markers) into clean readable prose.
 */
function cleanWikitextSegment(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\[\[File:[^\]]+\]\]/gi, '')
    .replace(/\[\[Image:[^\]]+\]\]/gi, '')
    .replace(/\[\[Category:[^\]]+\]\]/gi, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1')
    .replace(/''([^']+)''/g, '$1')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<small>([^<]*)<\/small>/gi, '($1)')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^/]*\/>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses MediaWiki wikitext returned by The Mentalist Fandom API into structured fields.
 */
function parseFandomWikitext(wikitext) {
  if (!wikitext) return null;

  let quote = null;
  const quoteMatch = wikitext.match(/\{\{Quote\|([^|}]+)(?:\|([^|}]+))?(?:\|([^|}]+))?\}\}/i);
  if (quoteMatch) {
    quote = {
      text: cleanWikitextSegment(quoteMatch[1]),
      speaker: cleanWikitextSegment(quoteMatch[2] || ''),
      source: cleanWikitextSegment(quoteMatch[3] || ''),
    };
  }

  const infobox = {};
  const infoboxRegex = /^\s*\|\s*([A-Za-z0-9_]+)\s*=\s*(.+)$/gm;
  let match;
  while ((match = infoboxRegex.exec(wikitext)) !== null) {
    const key = match[1].trim();
    const cleanedVal = cleanWikitextSegment(match[2]);
    if (cleanedVal && !['Image', 'ImageSize', 'Title'].includes(key)) {
      infobox[key] = cleanedVal;
    }
  }

  const bodyWithoutTemplates = wikitext
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/\{\|[\s\S]*?\|\}/g, '');

  const sections = {};
  let currentSection = 'overview';
  sections[currentSection] = [];

  const lines = bodyWithoutTemplates.split('\n');
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^==+\s*([^=]+?)\s*==+$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim().toLowerCase();
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      continue;
    }

    if (trimmed.startsWith('*') || trimmed.startsWith('|') || trimmed.startsWith('!')) {
      continue;
    }

    const cleanedParagraph = cleanWikitextSegment(trimmed);
    if (cleanedParagraph.length > 35) {
      sections[currentSection].push(cleanedParagraph);
    }
  }

  const overviewParagraphs = sections.overview || [];
  const recapParagraphs = [
    ...(sections.recap || []),
    ...(sections.biography || []),
    ...(sections.background || []),
    ...(sections['early life'] || []),
    ...(sections['season 1'] || []),
    ...(sections.plot || []),
    ...(sections.summary || []),
  ];

  return {
    quote,
    infobox,
    overview: overviewParagraphs.slice(0, 3).join('\n\n'),
    recap: recapParagraphs.slice(0, 5).join('\n\n'),
  };
}

/**
 * Fetches and parses an in-universe character or episode article live from
 * The Mentalist Fandom MediaWiki API with automatic redirect resolution (&redirects=1).
 */
export async function fetchFandomWikiArticle(pageTitle) {
  if (!pageTitle) return null;
  const url = `${FANDOM_API_URL}?action=query&redirects=1&prop=revisions&titles=${encodeURIComponent(
    pageTitle.trim()
  )}&rvprop=content&rvslots=main&format=json&origin=*`;

  try {
    const data = await fetchJsonWithCache(url);
    const pages = data?.query?.pages;
    if (!pages) return null;
    const firstPage = Object.values(pages)[0];
    if (!firstPage || firstPage.missing !== undefined) return null;

    const wikitext = firstPage?.revisions?.[0]?.slots?.main?.['*'];
    if (!wikitext) return null;

    return {
      title: firstPage.title,
      pageId: firstPage.pageid,
      wikiUrl: `https://thementalist.fandom.com/wiki/${encodeURIComponent(
        firstPage.title.replace(/\s+/g, '_')
      )}`,
      ...parseFandomWikitext(wikitext),
    };
  } catch {
    return null;
  }
}

/**
 * Determines which narrative Act of The Mentalist an episode belongs to:
 * - Act I ("RED_JOHN_ACT"): Season 1 Episode 1 ("Pilot") through Season 6 Episode 8 ("Red John")
 * - Act II ("FBI_ACT"): Season 6 Episode 9 ("My Blue Heaven") through Season 7 Episode 13 ("White Orchids")
 */
export function getEpisodeAct(episode) {
  if (!episode) return 'RED_JOHN_ACT';
  if (episode.season < 6) return 'RED_JOHN_ACT';
  if (episode.season === 6 && episode.number <= 8) return 'RED_JOHN_ACT';
  return 'FBI_ACT';
}

/**
 * Classifies an episode's title color motif based on the live episode title from the API.
 */
export function getEpisodeColorMotif(episode) {
  const title = (episode?.name || '').toLowerCase();
  const redWords = [
    'red', 'crimson', 'scarlet', 'blood', 'flame', 'fire', 'rose', 'roses',
    'ruby', 'cherry', 'carmine', 'maroon', 'rust', 'russet', 'strawberries',
    'blush', 'claret', 'magenta', 'pink', 'ginger', 'coral', 'garnet', 'henna',
    'burgundy', 'vermilion', 'terracotta', 'carnelian', 'sangria'
  ];
  const postRedColorWords = [
    'blue', 'green', 'white', 'black', 'gold', 'golden', 'silver',
    'copper', 'grey', 'gray', 'yellow', 'orange', 'brown', 'violets', 'orchids'
  ];

  if (redWords.some((word) => title.includes(word))) {
    return 'RED_MOTIF';
  }
  if (postRedColorWords.some((word) => title.includes(word))) {
    return 'COLOR_SHIFT_MOTIF';
  }
  return 'SPECIAL_PILOT';
}

/**
 * Evaluates whether an episode is a key Story / Timeline Milestone by analyzing
 * its live API summary, title, and season premiere/finale position.
 */
export function analyzeEpisodeMilestone(episode) {
  const summaryText = stripHtmlTags(episode?.summary || '');
  const lowerSummary = summaryText.toLowerCase();
  const lowerTitle = (episode?.name || '').toLowerCase();
  const act = getEpisodeAct(episode);

  const isPilot = episode.season === 1 && episode.number === 1;
  const isRedJohnShowdown = episode.season === 6 && episode.number === 8;
  const isFbiBeginning = episode.season === 6 && episode.number === 9;
  const isSeriesFinale = episode.season === 7 && episode.number === 13;

  const mentionsRedJohn =
    lowerSummary.includes('red john') ||
    lowerTitle.includes('red john') ||
    (isPilot && lowerSummary.includes('serial killer'));

  const mentionsLoreleiOrSuspects =
    lowerSummary.includes('lorelei') ||
    (lowerSummary.includes('suspect') && lowerSummary.includes('list')) ||
    lowerSummary.includes('tattoo') ||
    lowerSummary.includes('tyger') ||
    lowerSummary.includes('blake') ||
    lowerSummary.includes('bosco') ||
    lowerSummary.includes('kristina frye') ||
    lowerSummary.includes('panzer');

  const isSeasonPremiereOrFinale =
    episode.number === 1 ||
    (episode.season <= 2 && episode.number === 23) ||
    ((episode.season === 3 || episode.season === 4) && episode.number === 24) ||
    ((episode.season === 5 || episode.season === 6) && episode.number === 22) ||
    (episode.season === 7 && episode.number === 13);

  const isHighImpactFbiEpisode =
    act === 'FBI_ACT' &&
    (isFbiBeginning ||
      isSeriesFinale ||
      isSeasonPremiereOrFinale ||
      lowerSummary.includes('lisbon') ||
      lowerSummary.includes('fbi') ||
      lowerSummary.includes('vega') ||
      lowerSummary.includes('lazarus') ||
      (episode.rating?.average || 0) >= 8.4);

  const isMilestone =
    isPilot ||
    isRedJohnShowdown ||
    isFbiBeginning ||
    isSeriesFinale ||
    mentionsRedJohn ||
    mentionsLoreleiOrSuspects ||
    isHighImpactFbiEpisode ||
    isSeasonPremiereOrFinale;

  let milestoneTag = 'Case File';
  if (isPilot) {
    milestoneTag = 'Where It All Began • Series Premiere';
  } else if (isRedJohnShowdown) {
    milestoneTag = 'The Final Reckoning • End of Red John Arc';
  } else if (isFbiBeginning) {
    milestoneTag = 'New Dawn • Two Years Later (FBI Act Begins)';
  } else if (isSeriesFinale) {
    milestoneTag = 'Series Finale • Jane & Lisbon';
  } else if (mentionsRedJohn) {
    milestoneTag = 'Core Red John Investigation';
  } else if (mentionsLoreleiOrSuspects) {
    milestoneTag = 'Key Red John Lead & Mythology';
  } else if (act === 'FBI_ACT') {
    milestoneTag = isSeasonPremiereOrFinale
      ? 'FBI Era Chapter Milestone'
      : 'Major FBI Operation & Team Arc';
  } else if (isSeasonPremiereOrFinale) {
    milestoneTag =
      episode.number === 1
        ? `Season ${episode.season} Premiere`
        : `Season ${episode.season} Finale`;
  }

  return {
    isMilestone,
    milestoneTag,
    mentionsRedJohn,
    act,
    cleanSummary: summaryText,
  };
}

/**
 * Searches and ranks episodes by relevance score so exact title matches
 * (such as Season 6 Episode 8 "Red John" when searching "Red John") always
 * appear at the very top (#1) before partial title or summary matches.
 *
 * @param {Array} episodes - Full array of 151 episode objects from TVmaze API
 * @param {string} rawQuery - User's search query string
 * @returns {Array} Sorted array of matching episodes ranked by relevance score
 */
export function searchAndRankEpisodes(episodes = [], rawQuery = '') {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return episodes;

  const scored = [];

  for (const ep of episodes) {
    const titleLower = (ep.name || '').toLowerCase();
    const summaryLower = stripHtmlTags(ep.summary || '').toLowerCase();
    const sPad = String(ep.season).padStart(2, '0');
    const ePad = String(ep.number).padStart(2, '0');
    const codeA = `s${sPad}e${ePad}`;
    const codeB = `s${ep.season}e${ep.number}`;
    const codeC = `${ep.season}x${ePad}`;
    const seasonEpPhrase = `season ${ep.season} episode ${ep.number}`;
    const milestone = analyzeEpisodeMilestone(ep);

    let score = 0;

    // 1. Exact title match (e.g. "red john" -> S06E08 "Red John")
    if (titleLower === q) {
      score += 1000;
    } else if (titleLower.startsWith(q)) {
      // 2. Title starts with query (e.g. "Red John's Footsteps", "Red John's Rules")
      score += 600;
    } else if (titleLower.includes(q)) {
      // 3. Title contains query anywhere
      score += 350;
    }

    // 4. Episode code or "season X episode Y" match
    if (
      codeA.includes(q) ||
      codeB.includes(q) ||
      codeC.includes(q) ||
      seasonEpPhrase.includes(q)
    ) {
      score += 500;
    }

    // 5. Special boost for the S06E08 Red John showdown when query mentions red john
    if (q.includes('red john') && ep.season === 6 && ep.number === 8) {
      score += 450;
    }

    // 6. Milestone tag match
    if (milestone.milestoneTag.toLowerCase().includes(q)) {
      score += 140;
    }

    // 7. Plot summary match
    if (summaryLower.includes(q)) {
      score += 60;
    }

    if (score > 0) {
      scored.push({ episode: ep, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.episode.rating?.average || 0) - (a.episode.rating?.average || 0);
  });

  return scored.map((item) => item.episode);
}

/**
 * Fetches live episode dialogue, humorous exchanges, and fan-favorite quotes for
 * a given season (1-6) of The Mentalist directly from the public Wikiquote MediaWiki API
 * (https://en.wikiquote.org/w/api.php) with zero hardcoded quotes.
 *
 * @param {number} seasonNumber - Season number (1 to 6)
 * @returns {Promise<Array>} Array of parsed scene quote objects linked to episode numbers
 */
export async function fetchWikiquoteSeasonScenes(seasonNumber = 1) {
  const pageTitle = `The_Mentalist_(season_${seasonNumber})`;
  const url = `${WIKIQUOTE_API_URL}?action=query&prop=revisions&titles=${encodeURIComponent(
    pageTitle
  )}&rvprop=content&rvslots=main&format=json&origin=*`;

  const data = await fetchJsonWithCache(url);
  const pages = data?.query?.pages || {};
  const firstPage = Object.values(pages)[0];
  const wikitext = firstPage?.revisions?.[0]?.slots?.main?.['*'];
  if (!wikitext) return [];

  const scenes = [];
  // Split by episode sections: === ''Episode Title'' [1.01] ===
  const episodeRegex = /===\s*''([^']+)''\s*\[(\d+)\.(\d+)\]\s*===/g;
  const matches = [...wikitext.matchAll(episodeRegex)];

  for (let i = 0; i < matches.length; i += 1) {
    const epTitle = cleanWikitextSegment(matches[i][1]);
    const sNum = Number(matches[i][2]);
    const epNum = Number(matches[i][3]);
    const startIdx = matches[i].index + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : wikitext.length;
    const sectionBody = wikitext.slice(startIdx, endIdx);

    // Each scene exchange is separated by <hr.../>
    const rawBlocks = sectionBody.split(/<hr[^>]*\/?>/i);
    for (let bIndex = 0; bIndex < rawBlocks.length; bIndex += 1) {
      const rawBlock = rawBlocks[bIndex];
      const rawLines = rawBlock
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith(':'));

      if (rawLines.length === 0) continue;

      const dialogueLines = [];
      let contextNote = '';

      for (const line of rawLines) {
        const cleanedLine = cleanWikitextSegment(line.replace(/^:+/, '').trim());
        if (!cleanedLine) continue;
        if (cleanedLine.startsWith('[') && cleanedLine.endsWith(']')) {
          contextNote = cleanedLine.slice(1, -1).trim();
        } else {
          dialogueLines.push(cleanedLine);
        }
      }

      if (dialogueLines.length >= 1) {
        const topLine = dialogueLines[0];
        const bottomLine =
          dialogueLines.length > 1
            ? dialogueLines[dialogueLines.length - 1]
            : contextNote || epTitle;

        scenes.push({
          id: `s${sNum}e${epNum}-scene-${bIndex}`,
          season: sNum,
          episodeNumber: epNum,
          episodeTitle: epTitle,
          contextNote,
          topLine,
          bottomLine,
          fullDialogue: dialogueLines,
          sourceUrl: `https://en.wikiquote.org/wiki/${encodeURIComponent(pageTitle)}`,
        });
      }
    }
  }

  return scenes;
}

const RECENT_VISITS_KEY = 'mentalist_recent_visits_v1';

/**
 * Records a recently visited episode or character in localStorage
 * to support Nielsen's Heuristic #6 (Recognition Over Recall — Slide 26).
 */
export function recordRecentVisit(visitItem) {
  if (!visitItem || !visitItem.path || !visitItem.title) return;
  try {
    const raw = localStorage.getItem(RECENT_VISITS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.path !== visitItem.path);
    const updated = [visitItem, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_VISITS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves the list of recently visited dossiers from localStorage.
 */
export function getRecentVisits() {
  try {
    const raw = localStorage.getItem(RECENT_VISITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

