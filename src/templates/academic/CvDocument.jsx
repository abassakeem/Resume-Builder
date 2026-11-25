import React from "react";
import { Document, Page, Text as PdfText, View, Link } from "@react-pdf/renderer";
import { visibleSections, sectionTitle, isCustomKey, customSectionKey } from "../../lib/cv/sections";
import { formatCitation, groupPublications } from "../../lib/cv/citations";
import { normalizeUrl, displayUrl, normalizeOrcid } from "../../lib/cv/validate";
import { PRESENTATION_TYPES, SERVICE_CATEGORIES } from "../../lib/cv/model";

// Shared layout for the academic CV templates. A template only supplies a theme (fonts, sizes,
// alignment) and the styles built from it in cvStyles.js; the structure, page-break rules and
// footer are identical, so both stay ATS-safe: one column, real text, no icons or graphics.

// Keep a heading on the same page as at least this much of what follows it (in points).
const KEEP_WITH_NEXT = 48;

// Page heights in points; the footer's baseline sits about 26pt above the bottom edge.
// Ordinary words are never hyphenated (conservative typography, and no stray "-" after a "·"
// separator). Only tokens too long to fit a line, such as URLs and DOIs, are split; react-pdf
// draws a hyphen at the break, but the link target is unaffected.
const MAX_WORD = 28;
const hyphenate = (word, fallback) => {
  if (word.length <= MAX_WORD) return [word];
  // Pieces the dictionary can't split (e.g. an unbroken run of letters) are cut into chunks.
  return fallback(word).flatMap(part => (part.length > MAX_WORD ? part.match(/.{1,20}/gsu) : [part]));
};
const Text = props => <PdfText hyphenationCallback={hyphenate} {...props} />;

const PAGE_HEIGHT = { A4: 841.89, LETTER: 792 };
const footerTop = size => PAGE_HEIGHT[size] - 36;

const join = (parts, sep = ", ") => parts.filter(Boolean).join(sep);
const range = (start, end) => join([start, end], " – ");
// ", a, b" when anything is filled, so it can follow a bold title.
const tail = (...parts) => (join(parts) ? `, ${join(parts)}` : "");
const labelOf = (list, id) => list.find(x => x.id === id)?.label ?? "";

function Segments({ segments, s, theme }) {
  return segments.map((seg, i) => {
    const font =
      seg.bold && seg.italic ? theme.fonts.boldItalic : seg.bold ? theme.fonts.bold : seg.italic ? theme.fonts.italic : null;
    const style = font ? { fontFamily: font } : undefined;
    if (seg.link) {
      return (
        <Link key={i} src={seg.link} style={[s.link, style || {}]}>
          {seg.text}
        </Link>
      );
    }
    return style ? <Text key={i} style={style}>{seg.text}</Text> : seg.text;
  });
}

// Left text with an optional right-aligned date. Long titles wrap within the left column.
function Row({ s, children, side, style }) {
  return (
    <View style={[s.row, style || {}]}>
      <Text style={s.rowMain}>{children}</Text>
      {side ? <Text style={s.rowSide}>{side}</Text> : null}
    </View>
  );
}

function Bullets({ s, items }) {
  return items.map((h, i) => (
    <View key={i} style={[s.bullet, i === items.length - 1 ? s.entry : {}]} wrap={false}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{h}</Text>
    </View>
  ));
}

const UrlLink = ({ s, url, label }) => (
  <Link src={normalizeUrl(url)} style={s.link}>
    {label || displayUrl(url)}
  </Link>
);

function Header({ data, s }) {
  const b = data.basics;
  const contact = [b.location?.address, b.email, b.phone].filter(Boolean);
  const links = [
    b.website && { url: b.website },
    b.orcid && { url: `https://orcid.org/${normalizeOrcid(b.orcid)}`, label: `ORCID: ${normalizeOrcid(b.orcid)}` },
    b.scholar && { url: b.scholar, label: "Google Scholar" },
    b.github && { url: b.github },
    b.linkedin && { url: b.linkedin },
  ].filter(Boolean);

  return (
    <View>
      {b.name ? <Text style={s.name}>{b.name}</Text> : null}
      {contact.length > 0 && (
        <Text style={s.contact}>
          {contact.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 ? " · " : ""}
              {c === b.email ? <Link src={`mailto:${c}`} style={s.link}>{c}</Link> : c}
            </React.Fragment>
          ))}
        </Text>
      )}
      {links.length > 0 && (
        <Text style={s.contact}>
          {links.map((l, i) => (
            <React.Fragment key={i}>
              {i > 0 ? " · " : ""}
              <UrlLink s={s} url={l.url} label={l.label} />
            </React.Fragment>
          ))}
        </Text>
      )}
    </View>
  );
}

// ---- Sections -------------------------------------------------------------------------------

function Interests({ data, s }) {
  const { summary, keywords } = data.interests;
  return (
    <>
      {summary ? <Text style={s.plain}>{summary}</Text> : null}
      {keywords.length > 0 && <Text style={s.plain}>{keywords.join(" · ")}</Text>}
    </>
  );
}

function Education({ data, s }) {
  return data.education.map((ed, i) => (
    <View key={i} style={s.entry} wrap={false}>
      <Row s={s} side={range(ed.startDate, ed.endDate)}>
        <Text style={s.bold}>{join([join([ed.studyType, ed.area], " "), ed.honours])}</Text>
      </Row>
      <Text>{join([ed.institution, ed.location])}</Text>
      {ed.gpa ? <Text>GPA / Grade: {ed.gpa}</Text> : null}
      {ed.thesisTitle ? (
        <Text>
          Thesis: <Text style={s.italic}>{ed.thesisTitle}</Text>
          {ed.supervisor ? ` (Supervisor: ${ed.supervisor})` : ""}
        </Text>
      ) : ed.supervisor ? (
        <Text>Supervisor: {ed.supervisor}</Text>
      ) : null}
      {ed.thesisSummary ? <Text style={s.muted}>{ed.thesisSummary}</Text> : null}
    </View>
  ));
}

function Publications({ data, s, theme }) {
  const { citationStyle, numbering } = data.settings;
  const owners = [data.basics.name, ...data.basics.nameVariants];
  const groups = groupPublications(data.publications, numbering);
  return groups.map(g => (
    <React.Fragment key={g.status}>
      {groups.length > 1 && (
        <Text style={s.groupTitle} minPresenceAhead={KEEP_WITH_NEXT}>
          {g.label}
        </Text>
      )}
      {g.items.map(({ pub, number }, i) => (
        <View key={i} style={s.numbered} wrap={false}>
          {number != null && <Text style={s.number}>[{number}]</Text>}
          <Text style={s.numberedText}>
            <Segments segments={formatCitation(pub, { style: citationStyle, owners })} s={s} theme={theme} />
          </Text>
        </View>
      ))}
    </React.Fragment>
  ));
}

function WithBullets({ s, title, subtitle, extra, side, highlights }) {
  return (
    <>
      {/* The heading lines stay together and keep at least the first bullet with them. */}
      <View wrap={false} minPresenceAhead={highlights.length ? 14 : 0} style={highlights.length ? undefined : s.entry}>
        <Row s={s} side={side}>
          <Text style={s.bold}>{title}</Text>
        </Row>
        {subtitle ? <Text>{subtitle}</Text> : null}
        {extra ? <Text style={s.muted}>{extra}</Text> : null}
      </View>
      <Bullets s={s} items={highlights} />
    </>
  );
}

const Research = ({ data, s }) =>
  data.research.map((r, i) => (
    <WithBullets
      key={i}
      s={s}
      title={join([r.role, r.group])}
      subtitle={join([r.institution, r.location])}
      extra={r.supervisor ? `Supervisor: ${r.supervisor}` : ""}
      side={range(r.startDate, r.endDate)}
      highlights={r.highlights}
    />
  ));

const Work = ({ data, s }) =>
  data.work.map((w, i) => (
    <WithBullets
      key={i}
      s={s}
      title={join([w.position, w.company])}
      subtitle={w.location}
      side={range(w.startDate, w.endDate)}
      highlights={w.highlights}
    />
  ));

const Teaching = ({ data, s }) =>
  data.teaching.map((t, i) => (
    <View key={i} style={s.entry} wrap={false}>
      <Row s={s} side={t.term}>
        <Text style={s.bold}>{t.role}</Text>
        {t.role && (t.courseCode || t.courseName) ? ", " : ""}
        {join([t.courseCode, t.courseName], ": ")}
      </Row>
      {t.institution ? <Text>{t.institution}</Text> : null}
    </View>
  ));

const Presentations = ({ data, s }) =>
  data.presentations.map((p, i) => (
    <View key={i} style={s.entry} wrap={false}>
      <Row s={s} side={p.date}>
        {p.title ? `“${p.title}.” ` : ""}
        <Text style={s.italic}>{p.event}</Text>
        {p.location ? `, ${p.location}` : ""}
        {p.type ? ` (${labelOf(PRESENTATION_TYPES, p.type)})` : ""}
      </Row>
    </View>
  ));

const Awards = ({ data, s }) =>
  data.awards.map((a, i) => (
    <View key={i} style={s.plain} wrap={false}>
      <Row s={s} side={a.year}>
        <Text style={s.bold}>{a.name}</Text>
        {tail(a.awarder, a.amount)}
      </Row>
    </View>
  ));

const Grants = ({ data, s }) =>
  data.grants.map((g, i) => (
    <View key={i} style={s.plain} wrap={false}>
      <Row s={s} side={g.year}>
        <Text style={s.bold}>{g.title}</Text>
        {tail(g.funder, g.role, g.amount)}
      </Row>
    </View>
  ));

const Memberships = ({ data, s }) =>
  data.memberships.map((m, i) => (
    <View key={i} style={s.plain} wrap={false}>
      <Row s={s} side={range(m.startDate, m.endDate)}>
        <Text style={s.bold}>{m.organisation}</Text>
        {m.role ? `, ${m.role}` : ""}
      </Row>
    </View>
  ));

function Service({ data, s }) {
  const groups = SERVICE_CATEGORIES.map(c => ({
    ...c,
    items: data.service.filter(x => (SERVICE_CATEGORIES.some(k => k.id === x.category) ? x.category : "other") === c.id),
  })).filter(g => g.items.length);
  return groups.map(g => (
    <React.Fragment key={g.id}>
      {groups.length > 1 && (
        <Text style={s.groupTitle} minPresenceAhead={KEEP_WITH_NEXT}>
          {g.label}
        </Text>
      )}
      {g.items.map((x, i) => (
        <View key={i} style={s.plain} wrap={false}>
          <Row s={s} side={range(x.startDate, x.endDate)}>
            <Text style={s.bold}>{x.role}</Text>
            {tail(x.organisation)}
          </Row>
          {x.description ? <Text style={s.muted}>{x.description}</Text> : null}
        </View>
      ))}
    </React.Fragment>
  ));
}

const Certifications = ({ data, s }) =>
  data.certifications.map((c, i) => (
    <View key={i} style={s.plain} wrap={false}>
      <Row s={s} side={c.date}>
        <Text style={s.bold}>{c.name}</Text>
        {tail(c.issuer)}
        {c.url ? ", " : ""}
        {c.url ? <UrlLink s={s} url={c.url} label="credential" /> : null}
      </Row>
    </View>
  ));

const Skills = ({ data, s }) =>
  data.skills.map((g, i) => (
    <Text key={i} style={s.plain}>
      {g.name ? <Text style={s.bold}>{g.name}: </Text> : null}
      {g.keywords.join(", ")}
    </Text>
  ));

const Languages = ({ data, s }) => (
  <Text style={s.plain}>
    {data.languages.map((l, i) => (
      <React.Fragment key={i}>
        {i > 0 ? "; " : ""}
        <Text style={s.bold}>{l.language}</Text>
        {l.fluency ? ` (${l.fluency})` : ""}
      </React.Fragment>
    ))}
  </Text>
);

function References({ data, s }) {
  const { availableOnRequest, items } = data.references;
  if (availableOnRequest) return <Text style={s.plain}>Available upon request.</Text>;
  return items.map((r, i) => (
    <View key={i} style={s.entry} wrap={false}>
      <Text style={s.bold}>{r.name}</Text>
      {r.title ? <Text>{r.title}</Text> : null}
      {r.department || r.institution ? <Text>{join([r.department, r.institution])}</Text> : null}
      {r.email || r.phone ? (
        <Text>
          {r.email ? <Link src={`mailto:${r.email}`} style={s.link}>{r.email}</Link> : null}
          {r.email && r.phone ? " · " : ""}
          {r.phone}
        </Text>
      ) : null}
      {r.relationship ? <Text style={s.muted}>{r.relationship}</Text> : null}
    </View>
  ));
}

function Custom({ section, s }) {
  return section.items.map((x, i) => (
    <View key={i} style={s.plain} wrap={false}>
      <Row s={s} side={x.date}>
        <Text style={s.bold}>{x.title}</Text>
        {tail(x.subtitle)}
      </Row>
      {x.description ? <Text style={s.muted}>{x.description}</Text> : null}
    </View>
  ));
}

const SECTIONS = {
  interests: Interests,
  education: Education,
  publications: Publications,
  research: Research,
  teaching: Teaching,
  work: Work,
  presentations: Presentations,
  awards: Awards,
  grants: Grants,
  memberships: Memberships,
  service: Service,
  certifications: Certifications,
  skills: Skills,
  languages: Languages,
  references: References,
};

function Section({ id, data, s, theme }) {
  let body;
  if (isCustomKey(id)) {
    const section = data.customSections.find(c => customSectionKey(c.id) === id);
    body = <Custom section={section} s={s} />;
  } else {
    const Body = SECTIONS[id];
    body = <Body data={data} s={s} theme={theme} />;
  }
  // No wrapping View: react-pdf only honours minPresenceAhead for an element that has earlier
  // siblings on the page, so headings and entries must all be direct children of the Page.
  return (
    <>
      {/* minPresenceAhead stops a heading being stranded at the foot of a page. */}
      <Text style={s.sectionTitle} minPresenceAhead={KEEP_WITH_NEXT}>
        {sectionTitle(data, id)}
      </Text>
      {body}
    </>
  );
}

// `data` must come from prepareCv (cleaned and sorted).
export default function CvDocument({ data, theme, styles }) {
  const s = styles;
  const name = data.basics.name || "";
  const size = data.settings.paperSize === "LETTER" ? "LETTER" : "A4";
  return (
    <Document title={name ? `${name} – Curriculum Vitae` : "Curriculum Vitae"} author={name} subject="Curriculum Vitae" creator="ResumeForge">
      <Page size={size} style={s.page}>
        <Header data={data} s={s} />
        {visibleSections(data).map(id => (
          <Section key={id} id={id} data={data} s={s} theme={theme} />
        ))}
        <Text
          style={[s.footer, { top: footerTop(size) }]}
          fixed
          render={({ pageNumber, totalPages }) =>
            pageNumber > 1 ? `${join([name, "CV"], " – ")} – Page ${pageNumber} of ${totalPages}` : ""
          }
        />
      </Page>
    </Document>
  );
}
