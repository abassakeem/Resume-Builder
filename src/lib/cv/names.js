// Personal-name handling for author lists: parsing "First Last", "Last, First" and "Last AB"
// forms, abbreviating to initials, and deciding whether an author is the CV owner.

const PARTICLES = new Set([
  "van", "von", "der", "den", "de", "del", "della", "da", "das", "dos", "du", "di", "la", "le", "ter", "ten", "bin", "binti", "al", "el",
]);

export const stripAccents = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");

const fold = s => stripAccents(s).toLowerCase().replace(/[.'’]/g, "").replace(/\s+/g, " ").trim();

// "A.N." -> ["A.", "N."]; "Jean-Pierre" stays one token.
const splitGiven = s =>
  String(s || "")
    .trim()
    .split(/\s+|(?<=\.)(?=\p{Lu})/u)
    .filter(Boolean);

export function parseName(raw) {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!s) return { given: [], family: "" };

  const comma = s.indexOf(",");
  if (comma !== -1) {
    return { family: s.slice(0, comma).trim(), given: splitGiven(s.slice(comma + 1)) };
  }

  const tokens = s.split(" ");
  if (tokens.length === 1) return { given: [], family: tokens[0] };

  // Vancouver/PubMed style: "Okafor AN".
  const last = tokens[tokens.length - 1];
  if (tokens.length === 2 && /^\p{Lu}{1,3}$/u.test(last) && /\p{Ll}/u.test(tokens[0])) {
    return { family: tokens[0], given: [...last].map(c => `${c}.`) };
  }

  // The family name is the last word plus any lowercase particles before it ("van der Berg").
  let i = tokens.length - 1;
  while (i > 1 && PARTICLES.has(tokens[i - 1]) ) i--;
  return { given: splitGiven(tokens.slice(0, i).join(" ")), family: tokens.slice(i).join(" ") };
}

const isInitial = token => /^\p{L}\.?(?:-\p{L}\.?)*$/u.test(token);

// "Adaeze" -> "A.", "Jean-Pierre" -> "J.-P.", "A." -> "A."
export function initialOf(token) {
  return token
    .split("-")
    .filter(Boolean)
    .map(part => `${part[0].toUpperCase()}.`)
    .join("-");
}

const initialLetters = token => fold(token).split("-").map(p => p[0]).join("");

function givenMatches(a, b) {
  if (isInitial(a) || isInitial(b)) return initialLetters(a) === initialLetters(b);
  return fold(a) === fold(b);
}

// True when `author` plausibly names the same person as `owner`: same family name, same first
// given name or initial, and no contradicting middle names. "A. Okafor" matches "Adaeze N. Okafor";
// "B. Okafor" and "A. C. Okafor" don't.
export function isSamePerson(author, owner) {
  const a = parseName(author);
  const o = parseName(owner);
  if (!a.family || !o.family || !a.given.length || !o.given.length) return false;
  if (fold(a.family).replace(/[\s-]/g, "") !== fold(o.family).replace(/[\s-]/g, "")) return false;
  const shared = Math.min(a.given.length, o.given.length);
  for (let i = 0; i < shared; i++) {
    if (!givenMatches(a.given[i], o.given[i])) return false;
  }
  return true;
}

export const isOwner = (author, owners) => owners.some(o => o && isSamePerson(author, o));

// Display forms used by the citation styles.
export function formatName(raw, form) {
  const { given, family } = parseName(raw);
  if (!given.length) return family;
  if (form === "initials-first") return `${given.map(initialOf).join(" ")} ${family}`;
  if (form === "family-first") return `${family}, ${given.map(initialOf).join(" ")}`;
  return `${given.join(" ")} ${family}`;
}
