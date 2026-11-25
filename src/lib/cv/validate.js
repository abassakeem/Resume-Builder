// Input checks for the CV editor. Each check returns an error message, or "" when the value is
// valid or empty (every field is optional, so blank is never an error).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOMAIN_RE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i;
const DOI_RE = /^10\.\d{4,9}\/\S+$/;
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const PRESENT_RE = /\b(present|current|now|ongoing|today|expected)\b/i;

const blank = v => v == null || String(v).trim() === "";

export const isEmail = v => EMAIL_RE.test(String(v).trim());

export function isUrl(v) {
  const s = String(v).trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      return DOMAIN_RE.test(new URL(s).host + "/") || new URL(s).hostname === "localhost";
    } catch {
      return false;
    }
  }
  return DOMAIN_RE.test(s);
}

// Adds https:// to bare domains so the PDF link works.
export function normalizeUrl(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
}

// Shown in the PDF without the scheme or a trailing slash: "github.com/aokafor".
export const displayUrl = v => String(v ?? "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

// Accepts "10.1145/123", "doi:10.1145/123" or "https://doi.org/10.1145/123".
export function normalizeDoi(v) {
  return String(v ?? "")
    .trim()
    .replace(/^(?:https?:\/\/)?(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

export const isDoi = v => DOI_RE.test(normalizeDoi(v));

export function normalizeOrcid(v) {
  return String(v ?? "").trim().replace(/^(?:https?:\/\/)?(?:www\.)?orcid\.org\//i, "").toUpperCase();
}

// ORCID iDs end in an ISO 7064 MOD 11-2 check digit.
export function isOrcid(v) {
  const id = normalizeOrcid(v);
  if (!ORCID_RE.test(id)) return false;
  const digits = id.replace(/-/g, "");
  let total = 0;
  for (const ch of digits.slice(0, -1)) total = (total + Number(ch)) * 2;
  const check = (12 - (total % 11)) % 11;
  return digits.at(-1) === (check === 10 ? "X" : String(check));
}

export function isYear(v) {
  const s = String(v).trim();
  if (!/^\d{4}$/.test(s)) return false;
  const year = Number(s);
  return year >= 1900 && year <= new Date().getFullYear() + 10;
}

// Free-form dates ("Sep 2021", "2021", "Fall 2022", "Present") just need a plausible year.
export function isDateLike(v) {
  const s = String(v).trim();
  if (PRESENT_RE.test(s)) return true;
  const years = s.match(/\b\d{4}\b/g);
  return !!years && years.every(isYear);
}

const check = (test, message) => v => (blank(v) || test(v) ? "" : message);

export const validators = {
  email: check(isEmail, "Enter an email address like name@university.edu"),
  url: check(isUrl, "Enter a web address like https://example.com"),
  doi: check(isDoi, "A DOI looks like 10.1145/3597503.3639187"),
  orcid: check(isOrcid, "An ORCID iD looks like 0000-0002-1825-0097"),
  year: check(isYear, "Enter a four-digit year"),
  date: check(isDateLike, "Use a date like Sep 2021, 2021 or Present"),
};
