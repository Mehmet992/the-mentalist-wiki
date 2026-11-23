import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeEpisodeMilestone,
  getEpisodeAct,
  getEpisodeColorMotif,
  stripHtmlTags,
} from '../src/services/api.js';

/**
 * Unit test suite verifying episode narrative Act classification (Act I vs. Act II),
 * episode title color motif detection, HTML stripping, and milestone tagging.
 */
test('stripHtmlTags removes HTML markup and normalizes whitespace', () => {
  const rawHtml = '<p>Consultant <b>Patrick Jane</b> &amp; Lisbon investigate.</p>';
  const cleaned = stripHtmlTags(rawHtml);
  assert.equal(cleaned, 'Consultant Patrick Jane & Lisbon investigate.');
});

test('getEpisodeAct classifies S01E01 through S06E08 as RED_JOHN_ACT and S06E09+ as FBI_ACT', () => {
  assert.equal(getEpisodeAct({ season: 1, number: 1, name: 'Pilot' }), 'RED_JOHN_ACT');
  assert.equal(getEpisodeAct({ season: 6, number: 8, name: 'Red John' }), 'RED_JOHN_ACT');
  assert.equal(getEpisodeAct({ season: 6, number: 9, name: 'My Blue Heaven' }), 'FBI_ACT');
  assert.equal(getEpisodeAct({ season: 7, number: 13, name: 'White Orchids' }), 'FBI_ACT');
});

test('getEpisodeColorMotif distinguishes Red John crimson titles from FBI color-shift titles', () => {
  assert.equal(
    getEpisodeColorMotif({ name: 'Red Hair and Silver Tape' }),
    'RED_MOTIF'
  );
  assert.equal(
    getEpisodeColorMotif({ name: 'Strawberries and Cream' }),
    'RED_MOTIF'
  );
  assert.equal(
    getEpisodeColorMotif({ name: 'My Blue Heaven' }),
    'COLOR_SHIFT_MOTIF'
  );
  assert.equal(
    getEpisodeColorMotif({ name: 'White Orchids' }),
    'COLOR_SHIFT_MOTIF'
  );
});

test('analyzeEpisodeMilestone identifies key series turning points from API fields', () => {
  const pilotAnalysis = analyzeEpisodeMilestone({
    season: 1,
    number: 1,
    name: 'Pilot',
    summary: '<p>A serial killer with a personal connection to Jane.</p>',
  });
  assert.equal(pilotAnalysis.isMilestone, true);
  assert.equal(pilotAnalysis.mentionsRedJohn, true);
  assert.match(pilotAnalysis.milestoneTag, /Series Premiere/);

  const showdownAnalysis = analyzeEpisodeMilestone({
    season: 6,
    number: 8,
    name: 'Red John',
    summary: '<p>Patrick Jane finally comes face-to-face with Red John.</p>',
  });
  assert.equal(showdownAnalysis.isMilestone, true);
  assert.match(showdownAnalysis.milestoneTag, /End of Red John Arc/);
});
