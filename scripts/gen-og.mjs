import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');
const out   = join(root, 'og');
mkdirSync(out, { recursive: true });

const W = 1200, H = 630;

const PAGES = [
  {
    file: 'index.svg',
    title: 'Justin Hong',
    sub: 'Founding Engineer · TrustAI',
    desc: 'Writing on UI/UX and software.',
  },
  {
    file: 'torus.svg',
    title: 'T(p,q)',
    sub: 'Torus Knots',
    desc: 'The T(p,q) family, parametric form, and an\ninteractive silhouette text-wrap specimen.',
  },
  {
    file: 'sprites.svg',
    title: 'Sprites',
    sub: 'CSS Sprite Sheets',
    desc: 'McMaster-Carr\'s sub-300ms load times and a\npixel character spun off from Claude Code\'s clawd.',
  },
];

function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeSvg({ title, sub, desc }) {
  const descLines = desc.includes('\n') ? desc.split('\n') : wrap(desc, 52);
  const descY0 = 390;
  const descLineH = 44;

  const descTspans = descLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : descLineH}">${escXml(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#000"/>
  <!-- top rule -->
  <line x1="80" y1="80" x2="${W - 80}" y2="80" stroke="#222" stroke-width="1"/>
  <!-- bottom rule -->
  <line x1="80" y1="${H - 80}" x2="${W - 80}" y2="${H - 80}" stroke="#222" stroke-width="1"/>
  <!-- title -->
  <text x="80" y="230"
    font-family="'Courier New', Courier, monospace"
    font-size="96" font-weight="700"
    fill="#f0f0f0" letter-spacing="-2">${escXml(title)}</text>
  <!-- sub -->
  <text x="80" y="310"
    font-family="'Courier New', Courier, monospace"
    font-size="28" font-weight="400"
    fill="#555">${escXml(sub)}</text>
  <!-- rule between sub and desc -->
  <line x1="80" y1="350" x2="320" y2="350" stroke="#333" stroke-width="1"/>
  <!-- desc -->
  <text x="80" y="${descY0}"
    font-family="'Courier New', Courier, monospace"
    font-size="28" font-weight="400"
    fill="#949494">${descTspans}</text>
  <!-- domain -->
  <text x="${W - 80}" y="${H - 100}"
    font-family="'Courier New', Courier, monospace"
    font-size="22" font-weight="400" text-anchor="end"
    fill="#333">hongnoul.github.io</text>
</svg>`;
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

for (const page of PAGES) {
  const svg = makeSvg(page);
  const dest = join(out, page.file);
  writeFileSync(dest, svg, 'utf8');
  console.log('wrote', dest);
}
