import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearApiCache,
  getCachedQuizScore,
  getRecentVisits,
  recordRecentVisit,
  setCachedQuizScore,
} from '../src/services/api.js';

/**
 * Unit test suite verifying in-memory session caching for the Observation Test score/streak,
 * localStorage persistence for Recognition Over Recall, and API cache clearing utilities.
 */
test('getCachedQuizScore and setCachedQuizScore store quiz streak in memory cache instead of localStorage', () => {
  const initial = getCachedQuizScore();
  assert.deepEqual(initial, { correct: 0, total: 0, streak: 0 });

  setCachedQuizScore({ correct: 3, total: 4, streak: 2 });
  assert.deepEqual(getCachedQuizScore(), { correct: 3, total: 4, streak: 2 });
});
test('recordRecentVisit and getRecentVisits persist and deduplicate recent dossiers', () => {
  // Provide a minimal in-memory localStorage mock for Node environment
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    key: (i) => Array.from(store.keys())[i] || null,
    get length() {
      return store.size;
    },
  };

  recordRecentVisit({
    path: '/episodes/9012',
    badge: 'S06E08',
    title: 'Red John',
  });
  recordRecentVisit({
    path: '/characters/25260',
    badge: 'Character',
    title: 'Patrick Jane (Simon Baker)',
  });
  // Re-visiting S06E08 should move it to the top without duplicating
  recordRecentVisit({
    path: '/episodes/9012',
    badge: 'S06E08',
    title: 'Red John',
  });

  const visits = getRecentVisits();
  assert.equal(visits.length, 2);
  assert.equal(visits[0].path, '/episodes/9012');
  assert.equal(visits[1].path, '/characters/25260');
});

test('clearApiCache removes cached API entries from localStorage without deleting unrelated keys', () => {
  const store = new Map();
  store.set('mentalist_api_cache_v1:https://api.tvmaze.com/shows/116', '{"data":{}}');
  store.set('mentalist_recent_visits_v1', '[]');

  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    key: (i) => Array.from(store.keys())[i] || null,
    get length() {
      return store.size;
    },
  };

  clearApiCache();

  assert.equal(
    store.has('mentalist_api_cache_v1:https://api.tvmaze.com/shows/116'),
    false
  );
  assert.equal(store.has('mentalist_recent_visits_v1'), true);
});
