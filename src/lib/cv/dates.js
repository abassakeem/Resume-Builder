// Turns free-form CV dates ("Sep 2021", "Fall 2022", "2019", "Present") into sortable numbers,
// so every section can be printed newest first without forcing a date format on the user.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SEASONS = { winter: 1, spring: 4, summer: 7, fall: 9, autumn: 9 };
const PRESENT_RE = /\b(present|current|now|ongoing|today|expected)\b/i;

// Returns a number (year * 12 + month) or null if no year can be found. "Present" sorts last of all.
export function dateValue(input) {
  const text = String(input ?? "").trim();
  if (!text) return null;
  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)];
  if (!years.length) return PRESENT_RE.test(text) ? Infinity : null;
  // In a range written in one field ("2021 – Present", "Sep 2021 – Jun 2022"), the end decides.
  const lastYear = years[years.length - 1];
  if (PRESENT_RE.test(text.slice(lastYear.index + 4))) return Infinity;
  const year = Number(lastYear[0]);

  // The month nearest before the last year (or a numeric month like 09/2021 or 2021-09).
  const before = text.slice(0, lastYear.index).toLowerCase();
  const after = text.slice(lastYear.index + 4);
  let month = 0;
  const words = [...before.matchAll(/[a-z]+/g)];
  const lastWord = words.length ? words[words.length - 1][0] : "";
  const named = MONTHS.indexOf(lastWord.slice(0, 3));
  if (named !== -1 && before.trimEnd().endsWith(lastWord)) month = named + 1;
  else if (SEASONS[lastWord] && before.trimEnd().endsWith(lastWord)) month = SEASONS[lastWord];
  else {
    const numeric = before.match(/(\d{1,2})\s*[/.-]\s*$/) || after.match(/^\s*[/.-]\s*(\d{1,2})\b/);
    if (numeric && Number(numeric[1]) >= 1 && Number(numeric[1]) <= 12) month = Number(numeric[1]);
  }
  return year * 12 + month;
}

// Stable newest-first sort. Each key function returns a date string; the first key that parses
// decides, later keys break ties. Entries with no readable date keep their order at the end.
export function sortNewestFirst(items, ...keys) {
  const scored = items.map((item, index) => ({
    item,
    index,
    values: keys.map(k => dateValue(k(item))),
  }));
  scored.sort((a, b) => {
    const aHas = a.values.some(v => v != null);
    const bHas = b.values.some(v => v != null);
    if (aHas !== bHas) return aHas ? -1 : 1;
    for (let i = 0; i < keys.length; i++) {
      const av = a.values[i] ?? a.values.find(v => v != null) ?? -Infinity;
      const bv = b.values[i] ?? b.values.find(v => v != null) ?? -Infinity;
      if (av !== bv) return bv > av ? 1 : -1;
    }
    return a.index - b.index;
  });
  return scored.map(s => s.item);
}
