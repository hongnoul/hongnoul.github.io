// Build resume artifacts from resume.data.json + resume.typ.
//
// 1. Compile resume.typ → resume.pdf and resume.svg via Typst CLI.
// 2. Read resume.svg and the JSON content.
// 3. Inject the SVG and a hidden semantic-HTML mirror into resume/index.html
//    between sentinel comment pairs (BUILD:SVG / BUILD:MIRROR), so the shell
//    HTML can be re-built idempotently.
//
// Requires: `typst` on PATH. On Arch: `pacman -S typst`. On macOS: `brew install typst`.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const dir = join(root, "resume");

const TYP = join(dir, "resume.typ");
const PDF = join(dir, "resume.pdf");
const SVG = join(dir, "resume.svg");
const DATA = join(dir, "resume.data.json");
const HTML = join(dir, "index.html");

function compile(out) {
  console.log(`compile → ${out.replace(root + "/", "")}`);
  execFileSync("typst", ["compile", TYP, out], { stdio: "inherit" });
}

compile(PDF);
compile(SVG);

// Strip the XML prolog so the SVG is safe to inline directly in HTML.
let svg = readFileSync(SVG, "utf8");
svg = svg.replace(/^<\?xml[^?]*\?>\s*/, "");
svg = svg.replace(/<!DOCTYPE[^>]*>\s*/, "");

const data = JSON.parse(readFileSync(DATA, "utf8"));
const mirror = buildMirror(data);

let html = readFileSync(HTML, "utf8");
html = replaceBetween(html, "BUILD:SVG", svg);
html = replaceBetween(html, "BUILD:MIRROR", mirror);
writeFileSync(HTML, html, "utf8");

console.log("done.");

// - helpers --------------------------------------

function replaceBetween(source, sentinel, body) {
  const start = `<!-- ${sentinel}:START -->`;
  const end = `<!-- ${sentinel}:END -->`;
  const i = source.indexOf(start);
  const j = source.indexOf(end);
  if (i === -1 || j === -1 || j < i) {
    throw new Error(`sentinel pair ${sentinel} not found in ${HTML}`);
  }
  return source.slice(0, i + start.length) + "\n" + body + "\n" + source.slice(j);
}

function buildMirror(data) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  // *bold* → <strong>bold</strong>, -- → en-dash. Matches the typeset output.
  const inline = (s) =>
    esc(s).replace(/\*([^*]+)\*/g, "<strong>$1</strong>").replace(/--/g, "–");

  const contact = data.contact
    .map((c) =>
      c.href ? `<a href="${esc(c.href)}">${esc(c.text)}</a>` : esc(c.text),
    )
    .join(" | ");

  const sections = data.sections
    .map((sec) => {
      const inner = sec.entries
        ? sec.entries
            .map((e) => {
              const meta = [];
              if (e.role) meta.push(`<em>${esc(e.role)}</em>`);
              if (e.date) meta.push(`<em>${inline(e.date)}</em>`);
              const bullets = (e.bullets || [])
                .map((b) => `<li>${inline(b)}</li>`)
                .join("");
              return `<article>
  <h3>${esc(e.org)}${e.loc ? ` <span>${esc(e.loc)}</span>` : ""}</h3>
  ${meta.length ? `<p>${meta.join(" · ")}</p>` : ""}
  ${bullets ? `<ul>${bullets}</ul>` : ""}
</article>`;
            })
            .join("\n")
        : `<ul>${sec.list.map((s) => `<li>${inline(s)}</li>`).join("")}</ul>`;
      return `<section><h2>${esc(sec.title)}</h2>\n${inner}\n</section>`;
    })
    .join("\n");

  return `<section class="sr-only" aria-label="Resume (plain text)">
<h1>${esc(data.name)}</h1>
<address>${contact}</address>
${sections}
</section>`;
}
