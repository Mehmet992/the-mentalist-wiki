import test from 'node:test';
import assert from 'node:assert/strict';
import { searchAndRankEpisodes } from '../src/services/api.js';

const SAMPLE_EPISODES = [
  {
    id: 8878,
    season: 1,
    number: 1,
    name: 'Pilot',
    rating: { average: 7.9 },
    summary: '<p>Patrick Jane hunts Red John in Palm Springs.</p>',
  },
  {
    id: 8888,
    season: 1,
    number: 11,
    name: "Red John's Friends",
    rating: { average: 8.3 },
    summary: '<p>A convicted murderer promises a clue about Red John.</p>',
  },
  {
    id: 8900,
    season: 1,
    number: 23,
    name: "Red John's Footsteps",
    rating: { average: 8.8 },
    summary: '<p>Red John sets a trap for Jane and the CBI team.</p>',
  },
  {
    id: 9012,
    season: 6,
    number: 8,
    name: 'Red John',
    rating: { average: 9.1 },
    summary: '<p>Patrick Jane finally confronts and kills Red John.</p>',
  },
  {
    id: 9013,
    season: 6,
    number: 9,
    name: 'My Blue Heaven',
    rating: { average: 8.5 },
    summary: '<p>Two years after the Red John case, Jane meets the FBI.</p>',
  },
];

/**
 * Unit test suite verifying that searchAndRankEpisodes prioritizes exact title
 * matches (such as Season 6 Episode 8 "Red John") above earlier Season 1 summary matches.
 */
test('searchAndRankEpisodes ranks Season 6 Episode 8 "Red John" #1 when searching "Red John"', () => {
  const results = searchAndRankEpisodes(SAMPLE_EPISODES, 'Red John');
  assert.ok(results.length >= 4);
  assert.equal(results[0].id, 9012);
  assert.equal(results[0].name, 'Red John');
  assert.equal(results[0].season, 6);
  assert.equal(results[0].number, 8);
});

test('searchAndRankEpisodes matches episode codes like S06E08 or 6x08', () => {
  const resultsByCode = searchAndRankEpisodes(SAMPLE_EPISODES, 'S06E08');
  assert.equal(resultsByCode.length, 1);
  assert.equal(resultsByCode[0].name, 'Red John');
});

test('searchAndRankEpisodes finds episodes by plot summary keywords', () => {
  const results = searchAndRankEpisodes(SAMPLE_EPISODES, 'Palm Springs');
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Pilot');
});
