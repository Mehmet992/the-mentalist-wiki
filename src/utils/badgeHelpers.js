/**
 * Pure helper functions and series-accurate templates for the CBI / FBI Credential Badge Studio.
 * Extracted into a dedicated module so badge configuration, filename sanitization,
 * and aspect-preserving portrait cropping are directly unit-testable.
 */

export const BADGE_PRESETS = {
  CBI: {
    style: 'CBI',
    department: 'STATE OF CALIFORNIA • DEPARTMENT OF JUSTICE',
    agency: 'CALIFORNIA BUREAU OF INVESTIGATION',
    acronym: 'C.B.I.',
    rank: 'INDEPENDENT CONSULTANT',
    specialty: 'Cold Reading, Behavioral Profiling & Homicide',
    office: 'Sacramento HQ — Serious Crimes Unit',
    badgeNumber: 'CBI-0492-CA',
    clearance: 'AUTHORIZED CRIME SCENE ACCESS',
  },
  FBI: {
    style: 'FBI',
    department: 'UNITED STATES DEPARTMENT OF JUSTICE',
    agency: 'FEDERAL BUREAU OF INVESTIGATION',
    acronym: 'F.B.I.',
    rank: 'SPECIAL AGENT',
    specialty: 'Major Crimes & Behavioral Analysis',
    office: 'Austin Field Division — Texas',
    badgeNumber: 'FBI-8841-US',
    clearance: 'FEDERAL LAW ENFORCEMENT COMMISSION',
  },
};

/**
 * Builds a complete, sanitized badge configuration by merging user overrides
 * onto the selected CBI or FBI preset template.
 *
 * @param {'CBI'|'FBI'} presetKey - Agency template key
 * @param {Object} [overrides] - Custom user fields (agentName, agency, acronym, rank, specialty, office, badgeNumber)
 * @returns {Object} Normalized badge configuration object
 */
export function buildBadgeConfig(presetKey = 'CBI', overrides = {}) {
  const base = BADGE_PRESETS[presetKey] || BADGE_PRESETS.CBI;
  return {
    style: base.style,
    agentName: (overrides.agentName ?? 'Patrick Jane').trim() || 'Patrick Jane',
    department: (overrides.department ?? base.department).trim() || base.department,
    agency: (overrides.agency ?? base.agency).trim() || base.agency,
    acronym: (overrides.acronym ?? base.acronym).trim().slice(0, 8) || base.acronym,
    rank: (overrides.rank ?? base.rank).trim() || base.rank,
    specialty: (overrides.specialty ?? base.specialty).trim() || base.specialty,
    office: (overrides.office ?? base.office).trim() || base.office,
    badgeNumber: (overrides.badgeNumber ?? base.badgeNumber).trim() || base.badgeNumber,
  };
}

/**
 * Returns true if the credential holder's rank should use the crimson Consultant banner
 * (matching Patrick Jane's CBI consultant credential) instead of the blue Special Agent banner.
 *
 * @param {string} rank - Rank / Title string
 * @returns {boolean}
 */
export function isConsultantRole(rank = '') {
  return String(rank).toLowerCase().includes('consultant');
}

/**
 * Generates a safe, lowercase PNG filename for a downloaded agent badge.
 *
 * @param {string} agentName - Credential holder's name
 * @param {string} badgeStyle - 'CBI' or 'FBI'
 * @returns {string} Sanitized filename ending with .png
 */
export function formatBadgeFilename(agentName = 'agent', badgeStyle = 'CBI') {
  const safeName =
    String(agentName || 'agent')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'agent';
  const safeStyle = String(badgeStyle || 'cbi').trim().toLowerCase();
  return `${safeName}-${safeStyle}-badge.png`;
}

/**
 * Computes source-crop coordinates (sx, sy, sw, sh) so an image of any natural aspect ratio
 * fills a target rectangle (destWidth x destHeight) cleanly without stretching or cutting off
 * the top of a person's head (top-biased center crop matching CSS object-cover object-top).
 *
 * @param {number} naturalWidth - Source image width in pixels
 * @param {number} naturalHeight - Source image height in pixels
 * @param {number} destWidth - Destination box width on canvas
 * @param {number} destHeight - Destination box height on canvas
 * @returns {{ sx: number, sy: number, sw: number, sh: number }}
 */
export function computeCoverCropRect(naturalWidth, naturalHeight, destWidth, destHeight) {
  if (!naturalWidth || !naturalHeight || !destWidth || !destHeight) {
    return { sx: 0, sy: 0, sw: naturalWidth || 0, sh: naturalHeight || 0 };
  }

  const srcRatio = naturalWidth / naturalHeight;
  const destRatio = destWidth / destHeight;

  if (srcRatio > destRatio) {
    // Source is wider than target box: crop evenly from left and right
    const sw = naturalHeight * destRatio;
    const sx = (naturalWidth - sw) / 2;
    return { sx, sy: 0, sw, sh: naturalHeight };
  }

  // Source is taller than target box: keep top-biased crop so heads/faces are never sliced off
  const sh = naturalWidth / destRatio;
  const sy = Math.min(naturalHeight - sh, (naturalHeight - sh) * 0.15);
  return { sx: 0, sy: Math.max(0, sy), sw: naturalWidth, sh };
}
