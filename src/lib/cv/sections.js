// Section order, visibility and the cleaned, sorted data the PDF templates print.

import { CV_SECTIONS, DEFAULT_SECTION_ORDER } from "./model";
import { sortNewestFirst } from "./dates";

export const CUSTOM_PREFIX = "custom:";
export const customSectionKey = id => `${CUSTOM_PREFIX}${id}`;
export const isCustomKey = key => String(key).startsWith(CUSTOM_PREFIX);

const BUILT_IN = new Set(DEFAULT_SECTION_ORDER);

// Every section key in print order: the saved order with unknown keys dropped and any missing
// sections (e.g. ones added in a later version, or new custom sections) appended.
export function sectionOrder(cv) {
  const custom = (cv.customSections || []).map(s => customSectionKey(s.id));
  const valid = new Set([...DEFAULT_SECTION_ORDER, ...custom]);
  const saved = (cv.sectionOrder || []).filter((key, i, arr) => valid.has(key) && arr.indexOf(key) === i);
  const missing = [...DEFAULT_SECTION_ORDER, ...custom].filter(key => !saved.includes(key));
  return [...saved, ...missing];
}

export function sectionTitle(cv, key) {
  if (isCustomKey(key)) {
    const section = cv.customSections?.find(s => customSectionKey(s.id) === key);
    return section?.title?.trim() || "Untitled section";
  }
  return CV_SECTIONS.find(s => s.id === key)?.title ?? key;
}

// Moves a key up (delta -1) or down (+1) in the order; out-of-range moves are ignored.
export function moveSection(order, key, delta) {
  const from = order.indexOf(key);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= order.length) return order;
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export const toggleHidden = (hidden, key) =>
  hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key];

// ---- Cleaning -------------------------------------------------------------------------------

export const isFilled = v =>
  Array.isArray(v) ? v.some(isFilled) : v != null && typeof v !== "object" && String(v).trim() !== "";

// Fields that always hold a default value (a dropdown choice), so they don't count as content.
const CHOICE_KEYS = new Set(["status", "type", "category", "fluency"]);

export const hasContent = entry =>
  Object.entries(entry || {}).some(([k, v]) => !CHOICE_KEYS.has(k) && isFilled(v));

const trimList = list => (Array.isArray(list) ? list.map(s => String(s ?? "").trim()).filter(Boolean) : []);

const cleanList = (list, map = x => x) =>
  (Array.isArray(list) ? list : []).filter(hasContent).map(map);

const withBullets = e => ({ ...e, highlights: trimList(e.highlights) });

// Drops empty entries, bullets and authors, then sorts each section newest first.
export function prepareCv(cv) {
  const end = e => e.endDate || e.startDate;
  const start = e => e.startDate;
  return {
    ...cv,
    basics: { ...cv.basics, nameVariants: trimList(cv.basics?.nameVariants) },
    interests: {
      summary: String(cv.interests?.summary ?? "").trim(),
      keywords: trimList(cv.interests?.keywords),
    },
    education: sortNewestFirst(cleanList(cv.education), end, start),
    publications: cleanList(cv.publications, p => ({ ...p, authors: trimList(p.authors) })),
    research: sortNewestFirst(cleanList(cv.research, withBullets), end, start),
    teaching: sortNewestFirst(cleanList(cv.teaching), t => t.term),
    work: sortNewestFirst(cleanList(cv.work, withBullets), end, start),
    presentations: sortNewestFirst(cleanList(cv.presentations), p => p.date),
    awards: sortNewestFirst(cleanList(cv.awards), a => a.year),
    grants: sortNewestFirst(cleanList(cv.grants), g => g.year),
    memberships: sortNewestFirst(cleanList(cv.memberships), end, start),
    service: sortNewestFirst(cleanList(cv.service), end, start),
    certifications: sortNewestFirst(cleanList(cv.certifications), c => c.date),
    skills: cleanList(cv.skills, s => ({ ...s, keywords: trimList(s.keywords) })),
    languages: cleanList(cv.languages),
    references: {
      availableOnRequest: !!cv.references?.availableOnRequest,
      items: cleanList(cv.references?.items),
    },
    customSections: (cv.customSections || []).map(s => ({
      ...s,
      items: sortNewestFirst(cleanList(s.items), i => i.date),
    })),
  };
}

// Whether a section has anything to print. Expects data from prepareCv.
export function sectionHasContent(cv, key) {
  if (isCustomKey(key)) {
    return !!cv.customSections?.find(s => customSectionKey(s.id) === key)?.items.length;
  }
  if (key === "interests") return !!(cv.interests.summary || cv.interests.keywords.length);
  if (key === "references") return cv.references.availableOnRequest || cv.references.items.length > 0;
  return BUILT_IN.has(key) && Array.isArray(cv[key]) && cv[key].length > 0;
}

// Keys to print, in order: hidden sections and empty sections are left out.
export function visibleSections(prepared) {
  const hidden = new Set(prepared.hiddenSections || []);
  return sectionOrder(prepared).filter(key => !hidden.has(key) && sectionHasContent(prepared, key));
}
