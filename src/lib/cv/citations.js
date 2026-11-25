// Formats publications in IEEE, APA or ACM style as a list of text segments, so the PDF templates
// can italicise venues, bold the CV owner's name and turn DOIs into links without parsing strings.
// Academic CVs list every author, so none of the styles truncate with "et al.".

import { formatName, isOwner } from "./names";
import { sortNewestFirst } from "./dates";
import { PUBLICATION_STATUSES } from "./model";

export const doiUrl = doi => `https://doi.org/${doi}`;

const NAME_FORM = { ieee: "initials-first", apa: "family-first", acm: "full" };

function builder() {
  const segs = [];
  const lastChar = () => {
    for (let i = segs.length - 1; i >= 0; i--) {
      const t = segs[i].text;
      if (t) return t[t.length - 1];
    }
    return "";
  };
  const b = {
    segs,
    add(text, style) {
      if (text) segs.push({ text: String(text), ...style });
      return b;
    },
    // End a sentence with "." unless it already ends in terminal punctuation.
    stop(after = " ") {
      if (segs.length && !/[.?!]/.test(lastChar())) segs.push({ text: "." });
      if (after) segs.push({ text: after });
      return b;
    },
    endsWithTerminal: () => /[.?!]/.test(lastChar()),
  };
  return b;
}

// Merge neighbouring segments with identical styling and trim trailing whitespace.
function finish(segs) {
  const out = [];
  for (const s of segs) {
    const prev = out[out.length - 1];
    if (prev && !!prev.bold === !!s.bold && !!prev.italic === !!s.italic && prev.link === s.link) {
      prev.text += s.text;
    } else {
      out.push({ ...s });
    }
  }
  while (out.length && !out[out.length - 1].text.trimEnd()) out.pop();
  if (out.length) out[out.length - 1].text = out[out.length - 1].text.trimEnd();
  return out;
}

function addAuthors(b, authors, style, owners) {
  const names = authors.map(a => ({ text: formatName(a, NAME_FORM[style]), bold: isOwner(a, owners) }));
  const conj = style === "apa" ? "&" : "and";
  names.forEach((n, i) => {
    if (i > 0) {
      const last = i === names.length - 1;
      if (names.length === 2) b.add(style === "apa" ? `, ${conj} ` : ` ${conj} `);
      else b.add(last ? `, ${conj} ` : ", ");
    }
    b.add(n.text, n.bold ? { bold: true } : undefined);
  });
}

const titleEndsWithMark = title => /[?!]$/.test(title);

function addLink(b, pub, label) {
  if (pub.doi) b.add(label === "doi" ? pub.doi : doiUrl(pub.doi), { link: doiUrl(pub.doi) });
  else if (pub.url) b.add(pub.url, { link: pub.url });
}

function ieee(b, pub) {
  const { title, venue, year, volume, issue, pages, status } = pub;
  if (b.segs.length) b.add(", ");
  if (title) b.add(`“${title}${titleEndsWithMark(title) ? "" : ","}” `);

  const parts = [];
  const part = (...items) => parts.push(items.filter(Boolean));
  if (status === "journal") {
    if (venue) part({ text: venue, italic: true });
    if (volume) part({ text: `vol. ${volume}` });
    if (issue) part({ text: `no. ${issue}` });
    if (pages) part({ text: `pp. ${pages}` });
    if (year) part({ text: year });
  } else if (status === "conference") {
    if (venue) part({ text: "in " }, { text: venue, italic: true });
    if (year) part({ text: year });
    if (pages) part({ text: `pp. ${pages}` });
  } else if (status === "preprint") {
    if (venue) part({ text: venue });
    if (year) part({ text: year });
  } else if (status === "review") {
    part(...(venue ? [{ text: "submitted to " }, { text: venue, italic: true }] : [{ text: "submitted for publication" }]));
    if (year) part({ text: year });
  } else {
    part({ text: "in preparation" });
    if (year) part({ text: year });
  }
  if (pub.doi) part({ text: "doi: " }, { text: pub.doi, link: doiUrl(pub.doi) });

  parts.forEach((p, i) => {
    if (i > 0) b.add(", ");
    p.forEach(s => b.add(s.text, s));
  });
  if (!pub.doi && pub.url) {
    b.stop().add("[Online]. Available: ");
    addLink(b, pub);
  } else {
    b.stop("");
  }
}

function apa(b, pub) {
  const { title, venue, year, volume, issue, pages, status } = pub;
  if (b.segs.length) b.add(" ");
  b.add(`(${year || "n.d."})`).stop();

  if (status === "preprint") {
    if (title) b.add(title, { italic: true }).add(" [Preprint]").stop();
    if (venue) b.add(venue).stop();
  } else if (status === "review" || status === "preparation") {
    const note = status === "review" ? "Manuscript submitted for publication" : "Manuscript in preparation";
    if (title) b.add(`${title} [${note}]`).stop();
    else b.add(`[${note}]`).stop();
  } else {
    if (title) b.add(title).stop();
    if (status === "conference") {
      if (venue) b.add("In ").add(venue, { italic: true }).add(pages ? ` (pp. ${pages})` : "").stop();
    } else if (venue) {
      b.add(venue, { italic: true });
      if (volume) b.add(", ").add(volume, { italic: true });
      if (issue) b.add(`(${issue})`);
      if (pages) b.add(`, ${pages}`);
      b.stop();
    }
  }
  addLink(b, pub);
}

function acm(b, pub) {
  const { title, venue, year, volume, issue, pages, status } = pub;
  if (b.segs.length) b.stop();
  if (year) b.add(year).stop();
  if (title) b.add(title).stop();

  if (status === "journal") {
    if (venue) {
      b.add(venue, { italic: true });
      if (volume) b.add(` ${volume}`);
      if (issue) b.add(`, ${issue}`);
      if (year) b.add(` (${year})`);
      if (pages) b.add(`, ${pages}`);
      b.stop();
    }
  } else if (status === "conference") {
    if (venue) b.add("In ").add(venue, { italic: true }).stop();
    if (pages) b.add(pages).stop();
  } else if (status === "preprint") {
    if (venue) b.add(venue).stop();
  } else if (status === "review") {
    if (venue) b.add("Under review at ").add(venue, { italic: true }).stop();
    else b.add("Under review").stop();
  } else {
    b.add("In preparation").stop();
  }
  addLink(b, pub);
}

const FORMATTERS = { ieee, apa, acm };

const STATUS_IDS = new Set(PUBLICATION_STATUSES.map(s => s.id));
export const statusOf = pub => (STATUS_IDS.has(pub?.status) ? pub.status : "journal");

// `owners` lists the names to bold: the CV owner's name plus any variants they entered.
export function formatCitation(pub, { style = "ieee", owners = [] } = {}) {
  const b = builder();
  const authors = (pub.authors || []).map(a => String(a).trim()).filter(Boolean);
  addAuthors(b, authors, style, owners.filter(Boolean));
  (FORMATTERS[style] || ieee)(b, { ...pub, status: statusOf(pub) });
  return finish(b.segs);
}

export const citationText = segments => segments.map(s => s.text).join("");

// Groups publications by status (in the fixed CV order), newest first within each group,
// and numbers them across all groups, within each group, or not at all.
export function groupPublications(publications, numbering = "continuous") {
  let n = 0;
  return PUBLICATION_STATUSES.map(status => {
    const items = sortNewestFirst(
      publications.filter(p => statusOf(p) === status.id),
      p => p.year
    );
    if (numbering === "group") n = 0;
    return {
      status: status.id,
      label: status.label,
      items: items.map(pub => ({ pub, number: numbering === "none" ? null : ++n })),
    };
  }).filter(g => g.items.length);
}
