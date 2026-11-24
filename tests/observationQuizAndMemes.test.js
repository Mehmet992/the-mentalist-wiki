import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  MEME_REFRESH_COOLDOWN_MS,
  MEME_REFRESH_MAX_PER_MINUTE,
  MEME_REFRESH_WINDOW_MS,
  clearApiCache,
  fetchMentalistCommunityMemes,
  getMemeRefreshRateLimitStatus,
  getSavedBanterSelection,
  isRedJohnShowdownEpisode,
  recordMemeRefreshAttempt,
  resetMemeRefreshRateLimit,
  saveBanterSelection,
} from '../src/services/api.js';
import { generateNextUniqueObservationQuestion } from '../src/utils/quizHelpers.js';

/**
 * Installs a clean in-memory localStorage mock for Node unit tests.
 */
function installMockLocalStorage() {
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
  return store;
}

const SAMPLE_EPISODES = Array.from({ length: 10 }, (_, idx) => ({
  id: 1000 + idx,
  season: idx < 6 ? 1 : 6,
  number: idx === 0 ? 1 : idx < 6 ? idx + 1 : idx + 3,
  name: idx < 6 ? `Crimson Clue ${idx + 1}` : `Blue Horizon ${idx + 1}`,
  airdate: `201${idx % 5}-10-0${(idx % 9) + 1}`,
  runtime: 60,
  rating: { average: 8.1 + (idx % 5) * 0.2 },
  summary: `<p>Patrick Jane investigates unique case number ${idx + 1}.</p>`,
  image: { medium: `https://static.tvmaze.com/ep-${idx}.jpg` },
}));

const SAMPLE_CAST = [
  { person: { id: 1, name: 'Simon Baker', birthday: '1969-07-30' }, character: { name: 'Patrick Jane' } },
  { person: { id: 2, name: 'Robin Tunney', birthday: '1972-06-19' }, character: { name: 'Teresa Lisbon' } },
  { person: { id: 3, name: 'Tim Kang', birthday: '1973-03-16' }, character: { name: 'Kimball Cho' } },
  { person: { id: 4, name: 'Owain Yeoman', birthday: '1978-07-02' }, character: { name: 'Wayne Rigsby' } },
  { person: { id: 5, name: 'Amanda Righetti', birthday: '1983-04-04' }, character: { name: 'Grace Van Pelt' } },
];

/**
 * Unit test suite verifying:
 * 1. Zero repeating questions in the Mentalist Observation Test across a full pool exhaustion.
 * 2. Persistent localStorage caching + cooldown & per-minute rate limiting on Refresh Memes.
 * 3. Season 6 Episode 8 ("Red John") favorite easter egg trigger and 5-second smiley-only pop-up.
 */
test('generateNextUniqueObservationQuestion produces zero duplicate questions until the full pool is exhausted', () => {
  const askedKeysSet = new Set();
  // Pool size: 10 synopsis + 9 act (excluding S01E01 Pilot) + 5 cast = 24 unique questions
  const expectedUniqueCount = 10 + 9 + 5;
  const seenKeys = new Set();
  let lastType = null;

  for (let i = 0; i < expectedUniqueCount; i += 1) {
    const result = generateNextUniqueObservationQuestion({
      episodes: SAMPLE_EPISODES,
      cast: SAMPLE_CAST,
      askedKeysSet,
      lastType,
    });

    assert.ok(result && result.question, `Round ${i + 1} must return a question`);
    assert.equal(
      seenKeys.has(result.question.key),
      false,
      `Duplicate question detected at round ${i + 1}: ${result.question.key}`
    );
    seenKeys.add(result.question.key);
    lastType = result.questionType;

    // Every generated question must have exactly 1 correct answer option
    const correctCount = result.question.options.filter((o) => o.isCorrect).length;
    assert.equal(correctCount, 1, `Question ${result.question.key} must have exactly 1 correct option`);
  }

  assert.equal(seenKeys.size, expectedUniqueCount);
});

test('Meme refresh rate limiter enforces 15s cooldown and max 3 refreshes per rolling minute', () => {
  installMockLocalStorage();
  resetMemeRefreshRateLimit();

  const t0 = 1_700_000_000_000;
  assert.equal(getMemeRefreshRateLimitStatus(t0).allowed, true);
  assert.equal(getMemeRefreshRateLimitStatus(t0).remainingInWindow, MEME_REFRESH_MAX_PER_MINUTE);

  // Refresh #1 at t0 -> immediately triggers 15s cooldown
  recordMemeRefreshAttempt(t0);
  const rightAfterFirst = getMemeRefreshRateLimitStatus(t0 + 2000);
  assert.equal(rightAfterFirst.allowed, false);
  assert.ok(rightAfterFirst.retryAfterSeconds >= 13);

  // After 15s cooldown, Refresh #2 is allowed
  const t1 = t0 + MEME_REFRESH_COOLDOWN_MS + 100;
  assert.equal(getMemeRefreshRateLimitStatus(t1).allowed, true);
  recordMemeRefreshAttempt(t1);

  // After another 15s cooldown, Refresh #3 is allowed (reaches max 3/min)
  const t2 = t1 + MEME_REFRESH_COOLDOWN_MS + 100;
  assert.equal(getMemeRefreshRateLimitStatus(t2).allowed, true);
  recordMemeRefreshAttempt(t2);

  // Even after waiting 16s after Refresh #3 (total ~46s), per-minute cap of 3 still blocks Refresh #4
  const t3 = t2 + MEME_REFRESH_COOLDOWN_MS + 1000;
  const cappedStatus = getMemeRefreshRateLimitStatus(t3);
  assert.equal(cappedStatus.allowed, false);
  assert.equal(cappedStatus.remainingInWindow, 0);

  // Once 60s have elapsed since Refresh #1, the rolling window frees a slot
  const t4 = t0 + MEME_REFRESH_WINDOW_MS + 1000;
  assert.equal(getMemeRefreshRateLimitStatus(t4).allowed, true);
});

test('fetchMentalistCommunityMemes persists active batch in localStorage, rotates to unseen memes on refresh, and blocks rapid spam', async () => {
  const store = installMockLocalStorage();
  clearApiCache();
  resetMemeRefreshRateLimit();

  const mockPullpushData = Array.from({ length: 16 }, (_, i) => ({
    id: `post${i + 1}`,
    subreddit: 'TheMentalist',
    title: `Top Mentalist Meme #${i + 1}`,
    url: `https://i.redd.it/meme-${i + 1}.jpg`,
    permalink: `/r/TheMentalist/comments/post${i + 1}/`,
    over_18: false,
    author: 'cbi_fan',
    score: 500 + i * 10,
  }));

  let networkCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    networkCalls += 1;
    if (String(url).includes('pullpush.io')) {
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ data: mockPullpushData }),
      };
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        memes: [
          {
            postLink: 'https://redd.it/hot1',
            subreddit: 'TheMentalist',
            title: 'Live Hot Meme',
            url: 'https://i.redd.it/hot1.jpg',
            nsfw: false,
            author: 'jane_fan',
            ups: 240,
          },
        ],
      }),
    };
  };

  try {
    // 1. First load fetches live pool and persists the active 8-meme batch in localStorage
    const firstBatch = await fetchMentalistCommunityMemes({ batchSize: 8 });
    assert.equal(firstBatch.length, 8);
    const callsAfterFirstLoad = networkCalls;
    assert.ok(
      Array.from(store.keys()).some((k) => k.includes('active_memes_batch')),
      'Active memes batch must be persisted in localStorage'
    );

    // 2. Subsequent normal load serves the exact saved batch from localStorage with zero network calls
    const persistedBatch = await fetchMentalistCommunityMemes({ batchSize: 8 });
    assert.equal(networkCalls, callsAfterFirstLoad);
    assert.deepEqual(
      persistedBatch.map((m) => m.id),
      firstBatch.map((m) => m.id)
    );

    // 3. Manual refresh excludes currently displayed IDs and returns 8 brand-new memes
    const firstIds = firstBatch.map((m) => m.id);
    const refreshedBatch = await fetchMentalistCommunityMemes({
      forceRefresh: true,
      excludeIds: firstIds,
      batchSize: 8,
    });
    assert.equal(refreshedBatch.length, 8);
    const overlap = refreshedBatch.filter((m) => firstIds.includes(m.id));
    assert.equal(overlap.length, 0, 'Refreshed batch should contain 8 completely unseen memes');

    // 4. Reopening the tab serves the newly refreshed batch from localStorage
    const afterRefreshReload = await fetchMentalistCommunityMemes({ batchSize: 8 });
    assert.deepEqual(
      afterRefreshReload.map((m) => m.id),
      refreshedBatch.map((m) => m.id)
    );

    // 5. Immediate second Refresh click is blocked by rate limiter
    await assert.rejects(
      () => fetchMentalistCommunityMemes({ forceRefresh: true, excludeIds: refreshedBatch.map((m) => m.id) }),
      (err) => Boolean(err.isRateLimit && err.retryAfterSeconds > 0)
    );

    // 6. Banter season selection also persists cleanly in localStorage
    saveBanterSelection({ season: 3, sceneIds: ['s3e1-scene-0', 's3e2-scene-1'] });
    assert.deepEqual(getSavedBanterSelection(), {
      season: 3,
      sceneIds: ['s3e1-scene-0', 's3e2-scene-1'],
    });
  } finally {
    globalThis.fetch = originalFetch;
    resetMemeRefreshRateLimit();
  }
});

test('isRedJohnShowdownEpisode matches strictly Season 6 Episode 8 and RedJohnSmileyFlash auto-closes in 5s', () => {
  assert.equal(isRedJohnShowdownEpisode({ season: 6, number: 8, name: 'Red John' }), true);
  assert.equal(isRedJohnShowdownEpisode({ season: 6, number: 9, name: 'My Blue Heaven' }), false);
  assert.equal(isRedJohnShowdownEpisode({ season: 1, number: 1, name: 'Pilot' }), false);
  assert.equal(isRedJohnShowdownEpisode(null), false);

  const flashSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/common/RedJohnSmileyFlash.jsx'),
    'utf8'
  );
  assert.match(flashSource, /5000/);
  assert.match(flashSource, /createPortal/);
  assert.doesNotMatch(flashSource, /Tyger|Blake Association|Easter Egg/i);
});
