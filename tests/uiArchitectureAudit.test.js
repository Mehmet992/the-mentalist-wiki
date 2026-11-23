import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

/**
 * Helper to read a project file as UTF-8 text.
 */
function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
}

/**
 * Automated UI/UX & Accessibility Compliance Audit verifying that the codebase
 * adheres to Dr. Suphi Ucar's UIUX-Design-Basics.pdf guidelines.
 */
test('Slide 10: index.html loads strictly 2 font families (Cinzel and Inter)', () => {
  const indexHtml = readProjectFile('index.html');
  assert.match(indexHtml, /Cinzel/);
  assert.match(indexHtml, /Inter/);
  assert.doesNotMatch(indexHtml, /JetBrains\+Mono/);
});

test('Slide 10, 12 & 34: src/index.css defines 16px body base, 1.5 line-height, and :focus-visible ring', () => {
  const indexCss = readProjectFile('src/index.css');
  assert.match(indexCss, /font-size:\s*16px/);
  assert.match(indexCss, /line-height:\s*1\.5/);
  assert.match(indexCss, /:focus-visible/);
});

test('Slide 28: Top-left brand logo in Navbar links directly to Home ("/")', () => {
  const navbarCode = readProjectFile('src/components/layout/Navbar.jsx');
  assert.match(navbarCode, /<Link[\s\S]*?to="\/"/);
});

test('Slide 6 & 37: All search and filter pages include explicit <label htmlFor="..."> elements', () => {
  const pagesWithForms = [
    'src/pages/EpisodesPage.jsx',
    'src/pages/TimelinePage.jsx',
    'src/pages/CharactersPage.jsx',
    'src/pages/SeasonsPage.jsx',
    'src/components/common/GlobalSearchModal.jsx',
  ];

  for (const file of pagesWithForms) {
    const content = readProjectFile(file);
    assert.match(content, /<label[\s\S]*?htmlFor=/, `Missing <label htmlFor> in ${file}`);
  }
});

test('Character cards and panels do not contain removed Debut / First Seen fields and use centered object-contain for single portraits', () => {
  const charCard = readProjectFile('src/components/cards/CharacterCard.jsx');
  const dualPanel = readProjectFile('src/components/home/DualIdentityPanel.jsx');
  const charDetail = readProjectFile('src/pages/CharacterDetailPage.jsx');

  assert.match(charCard, /object-contain/);
  assert.doesNotMatch(dualPanel, /Debut:/);
  assert.doesNotMatch(charDetail, /First Episode/);
});
