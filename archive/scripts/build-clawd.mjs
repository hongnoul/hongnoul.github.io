#!/usr/bin/env bun
// Scans ~/.claude/projects/<flat-cwd>/<session>.jsonl and emits archive/clawd/index.json
// Output is just the prompts YOU typed (string-content user messages), grouped by session.
//
// Redaction:
//   - $HOME → ~
//   - emails → [email]
//   - bearer tokens / sk-... → [redacted]
//
// Skip:
//   - tool_result entries (message.content is an array, not a string)
//   - slash commands that wrap meta (<command-name>...</command-name>)
//   - duplicate prompts within a session (Claude Code retry loops)

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HOME = homedir();
const PROJECTS = join(HOME, '.claude', 'projects');
const OUT_DIR  = join(import.meta.dir, '..', 'clawd');
const OUT_FILE = join(OUT_DIR, 'index.json');

const REDACT = (s) =>
  s.replaceAll(HOME, '~')
   .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
   .replace(/sk-[A-Za-z0-9_\-]{20,}/g, '[redacted-key]')
   .replace(/ghp_[A-Za-z0-9]{20,}/g, '[redacted-token]')
   .replace(/Bearer\s+[A-Za-z0-9._\-]{20,}/gi, 'Bearer [redacted]');

// Flat dirname like "-home-hongnoul-git-hongnoul-github-io" → "/home/hongnoul/git/hongnoul.github.io"
const unflatten = (d) => d.startsWith('-') ? d.replaceAll('-', '/') : d;
// Short label: last path segment
const shortProject = (cwd) => cwd.split('/').filter(Boolean).pop() || cwd;

function extractPrompt(line) {
  let row;
  try { row = JSON.parse(line); } catch { return null; }
  if (row.type !== 'user') return null;
  // message is sometimes a JSON string of a python-repr-ish dict; sometimes already an obj.
  let msg = row.message;
  if (typeof msg === 'string') {
    // Claude Code writes python-style single-quoted dicts. Try JSON first, then a loose eval.
    try { msg = JSON.parse(msg); }
    catch {
      // Fallback: yank content via regex - only accept if content is a quoted string.
      const m = msg.match(/'content':\s*'((?:[^'\\]|\\.)*)'/);
      if (!m) return null;
      return m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n');
    }
  }
  if (!msg || typeof msg !== 'object') return null;
  if (typeof msg.content !== 'string') return null; // arrays = tool_result
  return msg.content;
}

const sessions = [];

for (const projDir of readdirSync(PROJECTS)) {
  const projPath = join(PROJECTS, projDir);
  if (!statSync(projPath).isDirectory()) continue;
  const cwd = unflatten(projDir);
  const project = shortProject(cwd);

  for (const fname of readdirSync(projPath)) {
    if (!fname.endsWith('.jsonl')) continue;
    const fpath = join(projPath, fname);
    const sessionId = fname.replace('.jsonl', '');
    const raw = readFileSync(fpath, 'utf8');
    const prompts = [];
    const seen = new Set();
    let firstTs = null, lastTs = null;

    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      const text = extractPrompt(line);
      if (!text) continue;
      // skip slash-command meta wrappers, tiny acks
      if (/^<(command-name|local-command-stdout|local-command-caveat|system-reminder|bash-input|user-memory-input)/.test(text)) continue;
      if (text.startsWith('[Request interrupted')) continue;
      if (text.startsWith('Caveat:')) continue;
      if (text.length < 3) continue;
      const clean = REDACT(text).trim();
      if (!clean) continue;
      if (seen.has(clean)) continue;
      seen.add(clean);
      let ts;
      try { ts = JSON.parse(line).timestamp; } catch {}
      if (ts) { if (!firstTs || ts < firstTs) firstTs = ts; if (!lastTs || ts > lastTs) lastTs = ts; }
      prompts.push({ ts, text: clean });
    }

    if (!prompts.length) continue;
    sessions.push({
      sessionId,
      project,
      firstTs,
      lastTs,
      count: prompts.length,
      prompts,
    });
  }
}

sessions.sort((a, b) => (b.lastTs || '').localeCompare(a.lastTs || ''));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify({
  generatedAt: new Date().toISOString(),
  sessionCount: sessions.length,
  promptCount: sessions.reduce((a, s) => a + s.count, 0),
  sessions,
}, null, 0));

console.log(`wrote ${OUT_FILE}: ${sessions.length} sessions, ${sessions.reduce((a,s)=>a+s.count,0)} prompts`);
