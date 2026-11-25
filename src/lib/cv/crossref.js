// Looks up a DOI in the public Crossref API and maps the record to a CV publication.
// Only the DOI the user typed is sent; no personal details go to Crossref.

import { normalizeDoi, isDoi } from "./validate";

const API = "https://api.crossref.org/works/";
const TIMEOUT_MS = 10000;

const fail = userMessage => Object.assign(new Error(userMessage), { userMessage });

// Crossref titles can contain JATS/HTML markup such as <i>, <sub> or <scp>.
const stripTags = s => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const first = v => (Array.isArray(v) ? v[0] : v) ?? "";

const STATUS_BY_TYPE = {
  "journal-article": "journal",
  "proceedings-article": "conference",
  "book-chapter": "conference",
  "posted-content": "preprint",
};

function yearOf(m) {
  for (const key of ["published-print", "published-online", "published", "issued", "created"]) {
    const year = m[key]?.["date-parts"]?.[0]?.[0];
    if (year) return String(year);
  }
  return "";
}

export function crossrefToPublication(m = {}) {
  const status = STATUS_BY_TYPE[m.type] || "journal";
  const authors = (m.author || [])
    .map(a => (a.given || a.family ? `${a.given || ""} ${a.family || ""}` : a.name || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  let venue = stripTags(first(m["container-title"]));
  if (!venue && status === "preprint") venue = stripTags(m.institution?.[0]?.name || m.publisher || "");
  return {
    status,
    authors,
    title: stripTags(first(m.title)),
    venue,
    year: yearOf(m),
    volume: String(m.volume ?? ""),
    issue: String(m.issue ?? ""),
    pages: String(m.page ?? m["article-number"] ?? "").replace(/\s*-+\s*/g, "–"),
    doi: normalizeDoi(m.DOI || ""),
    url: "",
  };
}

// Resolves to a publication, or rejects with an Error carrying a `userMessage` for the toast.
export async function fetchDoi(input, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const doi = normalizeDoi(input);
  if (!isDoi(doi)) throw fail("That doesn't look like a DOI. A DOI starts with 10. followed by a slash, e.g. 10.1145/3597503.3639187.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(API + encodeURIComponent(doi), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw fail(
      err?.name === "AbortError"
        ? "Crossref took too long to respond. Try again, or add the publication manually."
        : "Couldn't reach Crossref. Check your connection, or add the publication manually."
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 404) throw fail(`Crossref has no record of ${doi}. DOIs registered with other agencies (e.g. DataCite) can't be looked up here.`);
  if (!res.ok) throw fail(`Crossref returned an error (${res.status}). Try again later, or add the publication manually.`);

  let body;
  try {
    body = await res.json();
  } catch {
    throw fail("Crossref sent a response that couldn't be read. Add the publication manually.");
  }
  if (!body?.message) throw fail("Crossref sent a response that couldn't be read. Add the publication manually.");
  return { ...crossrefToPublication(body.message), doi };
}
