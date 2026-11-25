// A small BibTeX reader for bulk-importing publications. It handles braced and quoted values,
// @string macros, "#" concatenation, month macros and the common LaTeX accents, which covers the
// .bib files exported by Google Scholar, Zotero, Mendeley, DBLP and the ACM/IEEE libraries.

import { normalizeDoi } from "./validate";

const MONTHS = { jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June", jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December" };

const ACCENTS = {
  "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃", "=": "̄", ".": "̇",
  u: "̆", v: "̌", H: "̋", c: "̧", k: "̨", r: "̊",
};
const SYMBOLS = { ss: "ß", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", o: "ø", O: "Ø", aa: "å", AA: "Å", l: "ł", L: "Ł", i: "ı", j: "ȷ" };

// Converts LaTeX markup in a field value to plain Unicode text.
export function latexToText(value) {
  let s = String(value);
  s = s.replace(/\\(?:textit|textbf|emph|textsc|texttt|textrm|mathrm|mbox|url|href)\s*\{([^{}]*)\}/g, "$1");
  const accent = (cmd, ch, whole) => ((ch === "i" && whole.includes("\\i") ? "i" : ch) + ACCENTS[cmd]).normalize("NFC");
  // Symbol accents: \'e, \'{e}, \"{\i}
  s = s.replace(/\\([`'^"~=.])\s*\{?\\?([a-zA-Z])\}?/g, (m, cmd, ch) => accent(cmd, ch, m));
  // Letter accents need a brace or a space: \c{c}, \v s (so \url isn't read as \u + "rl").
  s = s.replace(/\\([uvHckr])(?:\s*\{\\?([a-zA-Z])\}|\s+([a-zA-Z]))/g, (m, cmd, a, b) => accent(cmd, a || b, m));
  s = s.replace(/\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)\b\s*/g, (_, sym) => SYMBOLS[sym]);
  s = s.replace(/\\([&%$#_{}])/g, "$1");
  s = s.replace(/---/g, "—").replace(/--/g, "–");
  s = s.replace(/~/g, " ").replace(/[{}]/g, "").replace(/\\[a-zA-Z]+\s*/g, "");
  return s.replace(/\s+/g, " ").trim();
}

// Splits "A and B and {C and D Ltd}" at top-level " and ".
function splitAuthors(raw) {
  const out = [];
  let depth = 0;
  let current = "";
  const words = raw.split(/(\s+and\s+|[{}])/i);
  for (const w of words) {
    if (w === "{") depth++;
    else if (w === "}") depth--;
    if (depth === 0 && /^\s+and\s+$/i.test(w)) {
      out.push(current);
      current = "";
    } else {
      current += w;
    }
  }
  out.push(current);
  return out.map(a => a.trim()).filter(Boolean);
}

// BibTeX names are "Last, First" or "First Last"; the CV stores "First Last".
function toDisplayName(raw) {
  const name = latexToText(raw);
  if (/^others$/i.test(name)) return "";
  const parts = name.split(",").map(p => p.trim());
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`.trim();
  if (parts.length === 3) return `${parts[2]} ${parts[0]} ${parts[1]}`.trim(); // Last, Jr, First
  return name;
}

// ---- Low-level parser -------------------------------------------------------------------------

function readValue(text, pos, macros) {
  const pieces = [];
  for (;;) {
    while (/\s/.test(text[pos])) pos++;
    const ch = text[pos];
    if (ch === "{") {
      let depth = 0;
      const start = pos + 1;
      for (; pos < text.length; pos++) {
        if (text[pos] === "\\") { pos++; continue; }
        if (text[pos] === "{") depth++;
        else if (text[pos] === "}" && --depth === 0) break;
      }
      pieces.push(text.slice(start, pos));
      pos++;
    } else if (ch === '"') {
      let depth = 0;
      const start = ++pos;
      for (; pos < text.length; pos++) {
        if (text[pos] === "\\") { pos++; continue; }
        if (text[pos] === "{") depth++;
        else if (text[pos] === "}") depth--;
        else if (text[pos] === '"' && depth === 0) break;
      }
      pieces.push(text.slice(start, pos));
      pos++;
    } else {
      const m = /^[^\s,#}]+/.exec(text.slice(pos));
      if (!m) break;
      const word = m[0];
      pos += word.length;
      const key = word.toLowerCase();
      pieces.push(/^\d+$/.test(word) ? word : macros[key] ?? MONTHS[key] ?? word);
    }
    while (/\s/.test(text[pos])) pos++;
    if (text[pos] === "#") { pos++; continue; }
    return { value: pieces.join(""), pos };
  }
  return { value: pieces.join(""), pos };
}

function readFields(body, macros) {
  const fields = {};
  let pos = 0;
  while (pos < body.length) {
    const m = /^[\s,]*([A-Za-z][\w:.-]*)\s*=/.exec(body.slice(pos));
    if (!m) break;
    pos += m[0].length;
    const { value, pos: next } = readValue(body, pos, macros);
    fields[m[1].toLowerCase()] = value;
    pos = next;
  }
  return fields;
}

// Finds each @type{...} / @type(...) block, respecting nested braces.
function* entries(text) {
  const re = /@\s*([A-Za-z]+)\s*([{(])/g;
  let m;
  while ((m = re.exec(text))) {
    const close = m[2] === "{" ? "}" : ")";
    let braces = 0;
    let end = -1;
    for (let pos = re.lastIndex; pos < text.length; pos++) {
      const ch = text[pos];
      if (ch === "\\") { pos++; continue; }
      if (ch === "{") braces++;
      else if (ch === "}" && braces > 0) braces--;
      else if (ch === close && braces === 0) { end = pos; break; }
    }
    const type = m[1].toLowerCase();
    if (end === -1) {
      yield { type, body: text.slice(re.lastIndex), complete: false };
      return;
    }
    yield { type, body: text.slice(re.lastIndex, end), complete: true };
    re.lastIndex = end + 1;
  }
}

// ---- Mapping to CV publications ---------------------------------------------------------------

function statusFor(type, f) {
  const note = `${f.note || ""} ${f.pubstate || ""}`.toLowerCase();
  if (/under review|submitted/.test(note)) return "review";
  if (/in preparation|in prep/.test(note)) return "preparation";
  if (type === "article" && !f.journal && (f.eprint || /arxiv/i.test(f.journal || ""))) return "preprint";
  if (type === "article") return /arxiv|biorxiv|medrxiv|ssrn|preprint/i.test(f.journal || "") ? "preprint" : "journal";
  if (["inproceedings", "conference", "proceedings", "incollection"].includes(type)) return "conference";
  if (type === "unpublished") return "preparation";
  if (f.eprint || f.archiveprefix || /arxiv|preprint/i.test(`${f.howpublished || ""} ${f.publisher || ""}`)) return "preprint";
  return "journal";
}

function venueFor(f) {
  const v = f.journal || f.booktitle || f.howpublished || f.publisher || f.school || f.institution || "";
  if (v) return latexToText(v);
  if (f.eprint) return `${f.archiveprefix ? latexToText(f.archiveprefix) : "arXiv"}:${latexToText(f.eprint)}`;
  return "";
}

export function bibEntryToPublication(type, f) {
  const doi = f.doi ? normalizeDoi(latexToText(f.doi)) : "";
  return {
    status: statusFor(type, f),
    authors: splitAuthors(f.author || f.editor || "").map(toDisplayName).filter(Boolean),
    title: latexToText(f.title || ""),
    venue: venueFor(f),
    year: latexToText(f.year || (f.date || "").slice(0, 4)),
    volume: latexToText(f.volume || ""),
    issue: latexToText(f.number || f.issue || ""),
    pages: latexToText(f.pages || "").replace(/\s*[-–]+\s*/g, "–"),
    doi,
    url: doi ? "" : latexToText(f.url || ""),
  };
}

// Returns { publications, skipped } where `skipped` counts entries that couldn't be read.
export function parseBibtex(text) {
  const macros = {};
  const publications = [];
  let skipped = 0;
  for (const { type, body, complete } of entries(String(text ?? ""))) {
    if (type === "comment" || type === "preamble") continue;
    if (!complete) { skipped++; continue; }
    if (type === "string") {
      Object.assign(macros, Object.fromEntries(Object.entries(readFields(body, macros)).map(([k, v]) => [k.toLowerCase(), v])));
      continue;
    }
    const comma = body.indexOf(",");
    const fields = comma === -1 ? {} : readFields(body.slice(comma + 1), macros);
    if (!fields.title && !fields.author) { skipped++; continue; }
    publications.push(bibEntryToPublication(type, fields));
  }
  return { publications, skipped };
}
