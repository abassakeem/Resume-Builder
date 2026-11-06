// Best-effort conversion of any resume PDF's text into the app's data shape.
// Text fragments are regrouped into visual lines (reading sidebar layouts one column at a time),
// split into sections by their headings, then each section is read with layout-agnostic heuristics.
// The result is a starting point the user reviews, not an exact copy.

const SECTION_ALIASES = {
  basics: ["contact", "contactinformation", "contactdetails", "personaldetails", "personalinformation"],
  education: ["education", "academicbackground", "academichistory", "qualifications", "educationandtraining", "academics"],
  work: [
    "experience", "workexperience", "professionalexperience", "employmenthistory", "workhistory",
    "careerhistory", "employment", "relevantexperience", "professionalhistory", "careerexperience",
  ],
  skills: [
    "skills", "technicalskills", "technicalstrengths", "corecompetencies", "competencies", "expertise",
    "skillsandtools", "toolsandtechnologies", "keyskills", "skillset", "technologies", "areasofexpertise",
  ],
  projects: ["projects", "personalprojects", "selectedprojects", "sideprojects", "keyprojects", "notableprojects"],
  other: [
    "summary", "profile", "about", "aboutme", "objective", "careerobjective", "professionalsummary",
    "certifications", "certificates", "licensesandcertifications", "awards", "honors", "honorsandawards",
    "achievements", "languages", "interests", "hobbies", "references", "publications", "volunteering",
    "volunteerexperience", "leadership", "activities", "courses", "coursework",
  ],
};

const SECTION_BY_HEADING = new Map(
  Object.entries(SECTION_ALIASES).flatMap(([type, names]) => names.map(name => [name, type]))
);

const MONTH =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const DATE = `(?:\\b${MONTH}\\s+\\d{4}|\\b\\d{1,2}[/.-]\\d{4}|\\b(?:19|20)\\d{2})\\b`;
const RANGE_RE = new RegExp(
  `(${DATE})\\s*(?:-|–|—|to|until)\\s*(${DATE}|\\b(?:present|current|now|today|ongoing|date)\\b)`,
  "i"
);
const SINGLE_DATE_RE = new RegExp(`(\\b${MONTH}\\s+\\d{4}\\b|\\b(?:19|20)\\d{2}\\b)`, "i");

// Known bullet glyphs, or any lone symbol followed by a space: PDFs often map bullets from symbol
// fonts to odd characters (e.g. "▸" in a standard font extracts as "¸").
const BULLET_RE = /^\s*(?:[•▪▸►‣◦●○■□➢➤✓✔*·–—-]|[^\p{L}\p{N}\s([{"'“‘$€£#@+&%/]\s)\s*/u;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const URL_RE = /(?:https?:\/\/|www\.)[^\s,|•·]+|\b(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com)\/[^\s,|•·]+/i;
const DOMAIN_RE = /^[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}(?:\/\S*)?$/i;
const PHONE_RE = /\+?\(?\d[\d\s().-]{6,}\d/;
const CONTACT_LABEL_RE = /^(e-?mail|phone|mobile|cell|tel|telephone|location|address|city|website|portfolio|linkedin|github|web|site)\s*:?\s*/i;
const LOCATION_RE = /^[\p{L} .'-]+,\s*[\p{L} .'-]+$/u;
const INSTITUTION_RE = /\b(university|college|institute|institution|school|academy|polytechnic|conservatory|seminary|universit[éey])\b/i;
// Case-sensitive on purpose: "of Science" is part of the degree, but "in Computer Science" is not.
const DEGREE_WORD_RE =
  /^((?:[Bb]achelor|[Mm]aster|[Dd]octor(?:ate)?|[Aa]ssociate)(?:'s)?(?:\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)?|[Dd]iploma|[Cc]ertificate|[Hh]igh [Ss]chool [Dd]iploma|GED)\b\.?\s*(.*)$/;
const DEGREE_ABBR_RE =
  /^(B\.?\s?(?:Sc|S|A|Eng|Ed|Tech|Com|BA|Arch|Pharm)\.?|M\.?\s?(?:Sc|S|A|Eng|Ed|Tech|Phil|BA|Res|Arch)\.?|Ph\.?\s?D\.?|MBA|HND|OND|LLB|LLM|MD|JD|BEng|MEng)(?=[\s,.:;]|$)\.?\s*(.*)$/;
const GPA_RE = /\bGPA\s*:?\s*([\d.]+(?:\s*\/\s*[\d.]+)?)/i;
const PAGE_NUMBER_RE = /^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i;
const PIECE_SPLIT_RE = /\s+[·|•—–]\s+|\s*\|\s*/;

const clean = text =>
  text.replace(/\s+/g, " ").replace(/^[\s,;:·|•–—-]+|[\s,;·|•–—-]+$/g, "").trim();

const words = text => text.split(/\s+/).filter(Boolean).length;
const normalizeHeading = text => text.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const headingType = text => (text.length <= 40 ? SECTION_BY_HEADING.get(normalizeHeading(text)) : undefined);
const hasDateRange = text => RANGE_RE.test(text);
const isInstitution = text => INSTITUTION_RE.test(text);
const isDegree = text => DEGREE_ABBR_RE.test(text) || DEGREE_WORD_RE.test(text);
const splitTags = text => text.split(/\s*[,;·•|]\s*/).map(clean).filter(Boolean);
const isTagLine = text => {
  const tags = splitTags(text);
  return tags.length >= 2 && !/[.!?]$/.test(text) && tags.every(t => t.length <= 30 && words(t) <= 4);
};
// Prose (a wrapped paragraph line) rather than a title, name or date line.
const isProse = text => text.length > 70 || (words(text) > 6 && /[.!?]$/.test(text));
const isTitleLike = text =>
  text.length <= 60 && words(text) <= 8 && /^[\p{Lu}\d]/u.test(text) && !/[.!?,;:]$/.test(text);

function findDates(text) {
  const range = text.match(RANGE_RE);
  const single = range ? null : text.match(SINGLE_DATE_RE);
  const match = range || single;
  if (!match) return null;
  const rest = text.slice(0, match.index) + " " + text.slice(match.index + match[0].length);
  return range
    ? { start: range[1], end: range[2], rest }
    : { start: "", end: single[1], rest };
}

// ---------------------------------------------------------------------------
// Text layout → lines

export async function extractLines(doc) {
  const lines = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { width } = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    const glyphs = items
      .filter(it => it.str && it.str.trim())
      .map(it => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        w: it.width,
        size: Math.hypot(it.transform[2], it.transform[3]) || 10,
        font: it.fontName,
      }));
    const rows = groupRows(glyphs).map(splitSegments);
    const split = findColumnSplit(rows.flat(), width);
    const columns = split == null
      ? [rows]
      : [rows.map(r => r.filter(s => s.x1 <= split)), rows.map(r => r.filter(s => s.x1 > split))];
    for (const column of columns) {
      let first = true;
      for (const segments of column) {
        if (!segments.length) continue;
        const line = toLine(segments, first);
        if (!PAGE_NUMBER_RE.test(line.text)) lines.push(line);
        first = false;
      }
    }
  }
  return lines;
}

function groupRows(glyphs) {
  const sorted = [...glyphs].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  for (const g of sorted) {
    const row = rows.at(-1);
    if (row && Math.abs(row.y - g.y) <= Math.max(2, Math.min(row.size, g.size) * 0.5)) row.glyphs.push(g);
    else rows.push({ y: g.y, size: g.size, glyphs: [g] });
  }
  return rows.map(r => r.glyphs.sort((a, b) => a.x - b.x));
}

// Splits a row wherever there's a wide horizontal gap (e.g. a title on the left, dates on the right).
function splitSegments(glyphs) {
  const segments = [];
  let seg = null;
  for (const g of glyphs) {
    const gap = seg ? g.x - seg.x1 : 0;
    if (!seg || gap > Math.max(12, g.size * 1.5)) {
      seg = { text: g.str, x0: g.x, x1: g.x + g.w, size: g.size, font: g.font };
      segments.push(seg);
    } else {
      const space = gap > g.size * 0.2 && !/\s$/.test(seg.text) && !/^\s/.test(g.str) ? " " : "";
      seg.text += space + g.str;
      seg.x1 = Math.max(seg.x1, g.x + g.w);
      seg.size = Math.max(seg.size, g.size);
    }
  }
  return segments
    .map(s => ({ ...s, text: s.text.replace(/\s+/g, " ").trim() }))
    .filter(s => s.text);
}

// Finds a vertical gutter that (almost) no text crosses, i.e. a sidebar layout.
function findColumnSplit(segments, width) {
  if (segments.length < 10) return null;
  let best = null;
  for (let x = width * 0.2; x <= width * 0.6; x += 2) {
    let left = 0;
    let right = 0;
    let crossing = 0;
    for (const s of segments) {
      if (s.x1 <= x) left++;
      else if (s.x0 >= x) right++;
      else crossing++;
    }
    const balance = Math.min(left, right);
    const acceptable = crossing <= Math.max(1, segments.length * 0.02) && balance >= segments.length * 0.2;
    if (acceptable && (!best || crossing < best.crossing || (crossing === best.crossing && balance > best.balance))) {
      best = { x, crossing, balance };
    }
  }
  return best?.x ?? null;
}

function toLine(segments, columnStart) {
  return {
    text: segments.map(s => s.text).join("  "),
    segments: segments.map(s => s.text),
    x0: segments[0].x0,
    size: Math.max(...segments.map(s => s.size)),
    font: segments[0].font,
    columnStart,
  };
}

// ---------------------------------------------------------------------------
// Lines → resume data

export function parseResumeLines(lines) {
  // Core headings (Experience, Skills, ...) are trusted outright. Looser ones like "Languages" or
  // "Interests" double as skill-group names, so they only count when styled like the core headings.
  const isAllCaps = text => /\p{L}/u.test(text) && text === text.toUpperCase();
  const core = lines.filter(l => ["work", "education", "skills", "projects"].includes(headingType(l.text)));
  const headingSize = core.length ? Math.min(...core.map(l => l.size)) - 0.25 : 0;
  const capsHeadings = core.length > 0 && core.every(l => isAllCaps(l.text));
  const sectionOf = line => {
    const type = headingType(line.text);
    if (type !== "other" && type !== "basics") return type;
    const styled = capsHeadings ? isAllCaps(line.text) : line.size >= headingSize;
    return type && styled ? type : undefined;
  };

  const header = [];
  const sections = { education: [], work: [], skills: [], projects: [] };
  let target = header;
  for (const line of lines) {
    if (line.columnStart) target = header;
    const type = sectionOf(line);
    if (type) {
      target = type === "basics" ? header : sections[type] ?? [];
      continue;
    }
    target.push(line);
  }

  return {
    basics: parseBasics(header, lines),
    work: groupEntries(sections.work).map(toWork).filter(w => w.company || w.position || w.highlights.length),
    education: groupEntries(sections.education, startsEducation).map(toEducation).filter(e => e.institution || e.area),
    skills: parseSkills(sections.skills),
    projects: groupEntries(sections.projects, startsProject).map(toProject).filter(p => p.name || p.description),
  };
}

function parseBasics(header, allLines) {
  const basics = { name: "", email: "", phone: "", website: "", location: { address: "" } };
  if (header.length) {
    // The name is the biggest text at the top; it may wrap onto several lines in a narrow sidebar.
    const maxSize = Math.max(...header.map(l => l.size));
    const first = header.findIndex(l => l.size >= maxSize - 0.5);
    const nameLines = [];
    for (let i = first; i < header.length && header[i].size >= maxSize - 0.5; i++) nameLines.push(header[i]);
    basics.name = clean(nameLines.map(l => l.segments[0]).join(" "));

    let label = null;
    const take = raw => {
      let text = clean(raw);
      const labelled = text.match(CONTACT_LABEL_RE);
      if (labelled && (labelled[0].length === text.length || /:\s*$/.test(labelled[0]))) {
        label = labelled[1].toLowerCase();
        text = clean(text.slice(labelled[0].length));
      }
      if (!text) return;
      const email = text.match(EMAIL_RE);
      const url = text.match(URL_RE) || (DOMAIN_RE.test(text) && !email ? [text] : null);
      const phone = text.match(PHONE_RE);
      if (email) basics.email ||= email[0];
      else if (url) basics.website ||= url[0];
      else if (phone && phone[0].replace(/\D/g, "").length >= 7) basics.phone ||= clean(phone[0]);
      else if (/^(location|address|city)$/.test(label ?? "") || (!basics.location.address && LOCATION_RE.test(text))) {
        basics.location = { address: text };
      }
      label = null;
    };

    for (const line of header) {
      const segments = nameLines.includes(line) ? line.segments.slice(1) : line.segments;
      segments.flatMap(s => s.split(PIECE_SPLIT_RE)).forEach(take);
    }
  }

  if (!basics.email) {
    const found = allLines.map(l => l.text.match(EMAIL_RE)).find(Boolean);
    if (found) basics.email = found[0];
  }
  return basics;
}

// Groups a section's lines into entries (one per job, school, project).
function groupEntries(lines, startsEntry = () => false) {
  if (!lines.length) return [];
  const margin = Math.min(...lines.map(l => l.x0));
  const entries = [];
  let entry = null;
  let prev = null;
  const begin = (carried = []) => entries.push((entry = { lines: carried, bullets: [] }));

  for (const line of lines) {
    if (BULLET_RE.test(line.text) && line.text.replace(BULLET_RE, "").trim()) {
      if (!entry) begin();
      entry.bullets.push(line.text.replace(BULLET_RE, "").trim()); // keep end punctuation for wrapped joins
      prev = "bullet";
      continue;
    }
    if (prev === "bullet" && line.x0 > margin + 4 && !hasDateRange(line.text)) {
      entry.bullets[entry.bullets.length - 1] += " " + line.text; // wrapped bullet
      continue;
    }

    if (!entry || prev === "bullet" || startsEntry(line, entry)) {
      begin();
    } else if (hasDateRange(line.text) && entry.lines.some(l => hasDateRange(l.text))) {
      // A second date range means a new entry started; its title is usually the line just before.
      const last = entry.lines.at(-1);
      const carry = entry.lines.length > 1 && !hasDateRange(last.text) && !isProse(last.text);
      begin(carry ? [entry.lines.pop()] : []);
    }
    entry.lines.push(line);
    prev = "line";
  }
  return entries;
}

const startsEducation = (line, entry) =>
  isInstitution(line.text) && entry.lines.some(l => isInstitution(l.text));

const startsProject = (line, entry) => {
  if (!entry.lines.length || !isTitleLike(line.text) || isTagLine(line.text)) return false;
  const last = entry.lines.at(-1);
  return (
    entry.bullets.length > 0 ||
    /[.!?]$/.test(last.text) ||
    line.segments.some(s => URL_RE.test(s)) ||
    (entry.lines.length >= 2 && line.font !== last.font)
  );
};

// Splits an entry's non-bullet lines into short "header" pieces (main = left-most text on a line,
// meta = right-aligned or separated extras such as a location) plus the description lines that
// follow, which stay in reading order.
function readEntryLines(entry) {
  const mains = [];
  const metas = [];
  const prose = [];
  let dates = null;
  for (const line of entry.lines) {
    if (prose.length || isProse(line.text)) {
      prose.push(line.text);
      continue;
    }
    line.segments.forEach((segment, k) => {
      let text = segment;
      const found = dates ? null : findDates(text);
      if (found) {
        dates = found;
        text = found.rest;
      }
      clean(text)
        .split(PIECE_SPLIT_RE)
        .map(clean)
        .filter(Boolean)
        .forEach((piece, j) => (k === 0 && j === 0 ? mains : metas).push(piece));
    });
  }
  return { mains, metas, prose, dates };
}

// Rejoins wrapped lines, starting a new paragraph after a line that ends a sentence. This recovers
// separate bullets when the PDF's text layer has no bullet characters (e.g. HTML lists).
function toParagraphs(lines) {
  const paragraphs = [];
  let open = false;
  for (const line of lines) {
    if (open) paragraphs[paragraphs.length - 1] += " " + line;
    else paragraphs.push(line);
    open = !/[.!?]$/.test(line);
  }
  return paragraphs.map(p => p.replace(/\s+/g, " ").trim());
}

function toWork(entry) {
  const { mains, metas, prose, dates } = readEntryLines(entry);
  let [company = "", position = ""] = mains;
  if (!position) {
    const split = company.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (split) [, position, company] = split;
  }
  const location = metas.find(m => LOCATION_RE.test(m) || words(m) <= 3) ?? "";
  const highlights = [...toParagraphs([...mains.slice(2), ...prose]), ...entry.bullets];
  return {
    company,
    position,
    location,
    startDate: dates?.start ?? "",
    endDate: dates?.end ?? "",
    highlights,
  };
}

function toEducation(entry) {
  const { mains, metas, dates } = readEntryLines(entry);
  const all = [...mains, ...metas];
  const institution = mains.find(isInstitution) ?? all.find(isInstitution) ?? mains.find(t => !isDegree(t)) ?? "";
  let degreeText = all.find(t => t !== institution && isDegree(t)) ?? mains.find(t => t !== institution) ?? "";

  let gpa = "";
  const gpaText = all.find(t => GPA_RE.test(t));
  if (gpaText) {
    gpa = gpaText.match(GPA_RE)[1].replace(/\s+/g, "");
    if (degreeText === gpaText) degreeText = clean(degreeText.replace(GPA_RE, ""));
  }

  let studyType = "";
  let area = degreeText;
  const degree = degreeText.match(DEGREE_ABBR_RE) || degreeText.match(DEGREE_WORD_RE);
  if (degree) {
    studyType = clean(degree[1]);
    area = clean(degree[2].replace(/^(in|of)\s+/i, ""));
  }

  const location = metas.find(m => m !== degreeText && m !== gpaText && m !== institution && !GPA_RE.test(m)) ?? "";
  return {
    institution,
    studyType,
    area,
    startDate: dates?.start ?? "",
    endDate: dates?.end ?? "",
    gpa,
    location,
  };
}

function toProject(entry) {
  const project = { name: "", url: "", keywords: [], description: "" };
  const description = [];
  entry.lines.forEach((line, i) => {
    if (i === 0) {
      for (const segment of line.segments) {
        const url = segment.match(URL_RE);
        let text = segment;
        if (url && !project.url) {
          project.url = url[0];
          text = clean(segment.replace(url[0], ""));
          if (!text) continue;
        }
        const [name, ...more] = text.split(PIECE_SPLIT_RE).map(clean).filter(Boolean);
        if (!project.name) project.name = name ?? "";
        const tags = more.flatMap(splitTags);
        if (tags.length && tags.every(t => t.length <= 30 && words(t) <= 4)) project.keywords.push(...tags);
      }
    } else if (!project.keywords.length && !description.length && isTagLine(line.text)) {
      project.keywords = splitTags(line.text);
    } else {
      description.push(line.text);
    }
  });
  project.description = clean([...description, ...entry.bullets].join(" "));
  return project;
}

function parseSkills(lines) {
  if (!lines.length) return [];
  const margin = Math.min(...lines.map(l => l.x0));
  const skills = [];
  const loose = [];
  let pendingName = null;

  for (const line of lines) {
    const text = clean(line.text.replace(BULLET_RE, ""));
    let name = null;
    let list = null;
    const colon = text.match(/^([^:]{1,40}):\s*(.+)$/);
    if (colon) [, name, list] = colon;
    else if (line.segments.length >= 2) {
      name = line.segments[0].replace(/:$/, "");
      list = line.segments.slice(1).join(", ");
    } else if (isTagLine(text)) list = text;

    if (list == null) {
      if (pendingName) loose.push(pendingName);
      pendingName = text;
      continue;
    }
    const keywords = splitTags(list);
    if (name == null && pendingName == null && skills.length && line.x0 > margin + 4) {
      skills.at(-1).keywords.push(...keywords); // wrapped keyword list
      continue;
    }
    skills.push({ name: clean(name ?? pendingName ?? ""), keywords });
    pendingName = null;
  }

  if (pendingName) loose.push(pendingName);
  if (loose.length) skills.push({ name: "", keywords: loose });
  return skills;
}
