#!/usr/bin/env bun
/* Export daily jcode token usage to work/tokens.json.
 *
 * Reads ~/.jcode/sessions/*.json, sums each message's token_usage into
 * local-date buckets, and writes a static JSON blob the dashboard at
 * /work/tokens.html renders. Only dates and counts are exported, never
 * session content.
 *
 * Run: bun archive/scripts/export-tokens.mjs
 * A per-file mtime cache at ~/.cache/jcode-tokens-export.json keeps
 * re-exports fast (only changed sessions are re-parsed).
 */
import { readdir, readFile, writeFile, mkdir, stat, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SESSIONS = join(homedir(), ".jcode", "sessions");
const CACHE = join(homedir(), ".cache", "jcode-tokens-export.json");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "work", "tokens.json");

const FIELDS = [
  "input_tokens",
  "output_tokens",
  "cache_read_input_tokens",
  "cache_creation_input_tokens",
];

// Local calendar date for an ISO timestamp.
function localDay(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// {isoDate: [input, output, cacheRead, cacheWrite]} for one session file.
function scanSession(data) {
  const days = {};
  for (const msg of data.messages ?? []) {
    const u = msg.token_usage;
    if (!u) continue;
    const day = localDay(msg.timestamp ?? "");
    if (!day) continue;
    const bucket = (days[day] ??= [0, 0, 0, 0]);
    FIELDS.forEach((f, i) => (bucket[i] += u[f] ?? 0));
  }
  return days;
}

let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE, "utf8"));
} catch {}

const fresh = {};
for (const name of await readdir(SESSIONS)) {
  if (!name.endsWith(".json")) continue;
  const path = join(SESSIONS, name);
  let mtime;
  try {
    mtime = (await stat(path)).mtimeMs;
  } catch {
    continue;
  }
  const hit = cache[name];
  if (hit && hit.mtime === mtime) {
    fresh[name] = hit;
    continue;
  }
  try {
    fresh[name] = { mtime, days: scanSession(JSON.parse(await readFile(path, "utf8"))) };
  } catch {
    // unreadable / partial write: skip, retry next run
  }
}

await mkdir(dirname(CACHE), { recursive: true });
await writeFile(CACHE + ".tmp", JSON.stringify(fresh));
await rename(CACHE + ".tmp", CACHE);

// Merge per-session day buckets into the export shape.
const days = {};
for (const entry of Object.values(fresh)) {
  for (const [day, vals] of Object.entries(entry.days)) {
    const b = (days[day] ??= [0, 0, 0, 0]);
    vals.forEach((v, i) => (b[i] += v));
  }
}

const sorted = Object.keys(days).sort();
const out = {
  updated: new Date().toISOString(),
  fields: ["input", "output", "cache_read", "cache_write"],
  days: Object.fromEntries(sorted.map((d) => [d, days[d]])),
};

await writeFile(OUT + ".tmp", JSON.stringify(out));
await rename(OUT + ".tmp", OUT);

/* ---- card thumbnail: a mini heatmap + today's number, regenerated on
   every export so the homepage card is itself live data ---- */
const THUMB = join(dirname(OUT), "..", "tokens_thumb.svg");
const human = (n) =>
  n >= 1e9 ? (n / 1e9).toFixed(2) + "B"
  : n >= 1e6 ? (n / 1e6).toFixed(1) + "M"
  : n >= 1e3 ? (n / 1e3).toFixed(1) + "k"
  : String(n);
const dayTotal = (d) => (days[d] ?? [0, 0, 0, 0]).reduce((a, b) => a + b, 0);
const total = Object.values(days).reduce((a, b) => a + b.reduce((x, y) => x + y, 0), 0);

{
  const W = 1980, H = 1080;
  const RAMP = ["#232323", "#5a2018", "#a03322", "#e0492d", "#ff2400"];
  const CELL = 88, GAP = 22, STEP = CELL + GAP;
  const COLS = 14, ROWS = 4; // last 8 weeks, newest bottom-right
  const gridW = COLS * STEP - GAP;
  const x0 = (W - gridW) / 2, y0 = 150;

  const end = new Date(); end.setHours(0, 0, 0, 0);
  const max = Math.max(1, ...Object.keys(days).map(dayTotal));
  const level = (v) =>
    v <= 0 ? 0 : 1 + Math.min(3, Math.floor((Math.log(v + 1) / Math.log(max + 1)) * 4));

  let cells = "";
  for (let i = COLS * ROWS - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const iso = localDay(d.toISOString());
    // fill column-major, newest column on the right
    const idx = COLS * ROWS - 1 - i;
    const c = Math.floor(idx / ROWS), r = idx % ROWS;
    cells += `<rect x="${x0 + c * STEP}" y="${y0 + r * STEP}" width="${CELL}" height="${CELL}" rx="16" fill="${RAMP[level(dayTotal(iso))]}"/>`;
  }

  const today = localDay(new Date().toISOString());
  const latest = days[today] ? today : sorted[sorted.length - 1];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui, sans-serif">
<rect width="${W}" height="${H}" fill="#111111"/>
${cells}
<text x="${x0}" y="${y0 + ROWS * STEP + 150}" font-size="150" font-weight="600" fill="#ff2400">\u{1f525} ${human(dayTotal(latest))}</text>
<text x="${x0}" y="${y0 + ROWS * STEP + 240}" font-size="56" fill="#9a9a9a">tokens burned ${latest === today ? "today" : "on " + latest} \u00b7 ${human(total)} all-time</text>
</svg>\n`;
  await writeFile(THUMB, svg);
}

console.log(
  `exported ${sorted.length} days (${sorted[0]} → ${sorted[sorted.length - 1]}), ` +
    `${total.toLocaleString()} tokens all-time → ${OUT}`,
);
