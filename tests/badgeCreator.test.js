import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BADGE_PRESETS,
  buildBadgeConfig,
  computeCoverCropRect,
  formatBadgeFilename,
  isConsultantRole,
} from '../src/utils/badgeHelpers.js';

/**
 * Unit test suite covering the Series-Authentic CBI / FBI Credential Badge Studio:
 * preset templates, free-text customization, consultant vs. agent banner detection,
 * safe PNG filename formatting, aspect-preserving portrait cropping, and custom upload UI.
 */
test('BADGE_PRESETS defines authentic CBI (Seasons 1-6) and FBI (Seasons 6-7) templates', () => {
  assert.equal(BADGE_PRESETS.CBI.acronym, 'C.B.I.');
  assert.match(BADGE_PRESETS.CBI.agency, /CALIFORNIA BUREAU OF INVESTIGATION/i);
  assert.equal(BADGE_PRESETS.FBI.acronym, 'F.B.I.');
  assert.match(BADGE_PRESETS.FBI.agency, /FEDERAL BUREAU OF INVESTIGATION/i);
});

test('buildBadgeConfig merges custom user fields while preserving safe fallbacks', () => {
  const custom = buildBadgeConfig('FBI', {
    agentName: 'Teresa Lisbon',
    agency: 'SPECIAL TASK FORCE',
    acronym: 'S.T.F.123456',
    rank: 'SENIOR SUPERVISOR',
    specialty: 'Interrogation & Tactical Command',
    office: 'Austin Field Office',
    badgeNumber: 'STF-007',
  });

  assert.equal(custom.style, 'FBI');
  assert.equal(custom.agentName, 'Teresa Lisbon');
  assert.equal(custom.agency, 'SPECIAL TASK FORCE');
  assert.equal(custom.acronym, 'S.T.F.12'); // capped at 8 characters
  assert.equal(custom.specialty, 'Interrogation & Tactical Command');

  // Empty whitespace overrides fall back cleanly to preset defaults
  const fallback = buildBadgeConfig('CBI', { agentName: '   ', specialty: '' });
  assert.equal(fallback.agentName, 'Patrick Jane');
  assert.equal(fallback.specialty, BADGE_PRESETS.CBI.specialty);
});

test('isConsultantRole detects consultant ranks for crimson CBI banner styling', () => {
  assert.equal(isConsultantRole('INDEPENDENT CONSULTANT'), true);
  assert.equal(isConsultantRole('Behavioral Consultant'), true);
  assert.equal(isConsultantRole('SPECIAL AGENT'), false);
  assert.equal(isConsultantRole('Supervisory Special Agent'), false);
});

test('formatBadgeFilename sanitizes custom names into safe lowercase PNG filenames', () => {
  assert.equal(formatBadgeFilename('Patrick Jane', 'CBI'), 'patrick-jane-cbi-badge.png');
  assert.equal(formatBadgeFilename('Kimball Cho #1!', 'FBI'), 'kimball-cho-1-fbi-badge.png');
  assert.equal(formatBadgeFilename('   ', 'CBI'), 'agent-cbi-badge.png');
});

test('computeCoverCropRect preserves aspect ratio for both landscape and portrait photos', () => {
  // Landscape 1600x900 photo placed into 175x215 vertical badge frame
  const wideCrop = computeCoverCropRect(1600, 900, 175, 215);
  assert.equal(wideCrop.sy, 0);
  assert.equal(wideCrop.sh, 900);
  assert.ok(wideCrop.sx > 0, 'Wide photos should crop symmetrically from left and right');
  assert.ok(Math.abs(wideCrop.sw / wideCrop.sh - 175 / 215) < 0.001);

  // Tall 600x1400 portrait photo placed into 175x215 badge frame
  const tallCrop = computeCoverCropRect(600, 1400, 175, 215);
  assert.equal(tallCrop.sx, 0);
  assert.equal(tallCrop.sw, 600);
  assert.ok(tallCrop.sy >= 0 && tallCrop.sy < (1400 - tallCrop.sh) / 2, 'Tall photos use top-biased crop');
  assert.ok(Math.abs(tallCrop.sw / tallCrop.sh - 175 / 215) < 0.001);
});

test('AgentBadgeGenerator supports device photo upload and free-text customization inputs', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/components/cards/AgentBadgeGenerator.jsx'),
    'utf8'
  );
  assert.match(source, /type="file"/);
  assert.match(source, /accept="image\/\*"/);
  assert.match(source, /id="badge-agency-input"/);
  assert.match(source, /id="badge-specialty-input"/);
  assert.match(source, /id="badge-office-input"/);
});
