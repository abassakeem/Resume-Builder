// Saves the editor state (resume, CV, which one is open and the current step) in this browser's
// localStorage, so work survives a reload. Every call tolerates storage being unavailable
// (private windows, blocked site data, a full quota) and reports it instead of throwing.

import { isCvData, normalizeCv } from "./cv/model";

export const STORAGE_KEY = "resumeforge:v1";
const VERSION = 1;

const isPlainObject = v => v != null && typeof v === "object" && !Array.isArray(v);

const defaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage itself throws when site data is blocked.
    return null;
  }
};

// Turns a stored JSON string into editor state, or null if it's missing, corrupt or from an
// incompatible version. Anything unexpected inside is dropped rather than trusted.
export function parseSaved(raw) {
  if (typeof raw !== "string" || !raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed) || parsed.version !== VERSION) return null;
  const resume = isPlainObject(parsed.resume) && !isCvData(parsed.resume) ? parsed.resume : null;
  const cv = isCvData(parsed.cv) ? normalizeCv(parsed.cv) : null;
  if (!resume && !cv) return null;
  return {
    resume,
    cv,
    docType: parsed.docType === "cv" && cv ? "cv" : "resume",
    resumeSection: typeof parsed.resumeSection === "string" ? parsed.resumeSection : null,
    cvSection: typeof parsed.cvSection === "string" ? parsed.cvSection : null,
    savedAt: Number.isFinite(parsed.savedAt) ? parsed.savedAt : null,
  };
}

// Deep equality that ignores object key order (normalising a CV can reorder its keys).
export function sameData(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && sameData(a[k], b[k]));
}

// Whether another tab's save changed the documents themselves (not just which step is open).
// Both CVs are normalised first, as loading fills in fields an older save may lack.
const normCv = cv => (cv ? normalizeCv(cv) : null);
export const contentDiffers = (incoming, current) =>
  !sameData(incoming.resume ?? null, current.resume ?? null) || !sameData(normCv(incoming.cv), normCv(current.cv));

export function loadSaved(storage = defaultStorage()) {
  try {
    return parseSaved(storage?.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// Returns { ok: true } or { ok: false, reason: "unavailable" | "full" | "error" }.
export function saveState(state, storage = defaultStorage(), now = Date.now()) {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, savedAt: now, ...state }));
    return { ok: true };
  } catch (err) {
    const full = err?.name === "QuotaExceededError" || err?.code === 22 || err?.code === 1014;
    return { ok: false, reason: full ? "full" : "error" };
  }
}

export function clearSaved(storage = defaultStorage()) {
  try {
    storage?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// "just now", "5 minutes ago", "yesterday", or a date, for the "Welcome back" message.
export function timeAgo(then, now = Date.now()) {
  if (!then) return "earlier";
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `on ${new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}
