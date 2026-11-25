// Shape of an Academic CV document and the constants shared by the editor and the PDF templates.
// A CV is kept separate from the resume: it carries `docType: "cv"` so imports know where it belongs.

export const CV_DOC_TYPE = "cv";

export const isCvData = d => d?.docType === CV_DOC_TYPE;

// Built-in sections in their recommended order. The header is always printed first and isn't listed.
export const CV_SECTIONS = [
  { id: "interests", title: "Research Interests" },
  { id: "education", title: "Education" },
  { id: "publications", title: "Publications" },
  { id: "research", title: "Research Experience" },
  { id: "teaching", title: "Teaching Experience" },
  { id: "work", title: "Professional Experience" },
  { id: "presentations", title: "Presentations and Talks" },
  { id: "awards", title: "Awards, Honours and Scholarships" },
  { id: "grants", title: "Grants and Funding" },
  { id: "memberships", title: "Professional Memberships" },
  { id: "service", title: "Service" },
  { id: "certifications", title: "Certifications" },
  { id: "skills", title: "Technical Skills" },
  { id: "languages", title: "Languages" },
  { id: "references", title: "References" },
];

export const DEFAULT_SECTION_ORDER = CV_SECTIONS.map(s => s.id);

export const PUBLICATION_STATUSES = [
  { id: "journal", label: "Journal Articles", single: "Journal article" },
  { id: "conference", label: "Conference Papers", single: "Conference paper" },
  { id: "preprint", label: "Preprints", single: "Preprint" },
  { id: "review", label: "Under Review", single: "Under review" },
  { id: "preparation", label: "In Preparation", single: "In preparation" },
];

export const PRESENTATION_TYPES = [
  { id: "oral", label: "Oral presentation" },
  { id: "poster", label: "Poster" },
  { id: "invited", label: "Invited talk" },
];

export const SERVICE_CATEGORIES = [
  { id: "review", label: "Peer Review" },
  { id: "committee", label: "Committees" },
  { id: "organising", label: "Organising" },
  { id: "outreach", label: "Outreach" },
  { id: "mentoring", label: "Mentoring" },
  { id: "other", label: "Other Service" },
];

export const CITATION_STYLES = [
  { id: "ieee", label: "IEEE" },
  { id: "apa", label: "APA" },
  { id: "acm", label: "ACM" },
];

export const NUMBERING_MODES = [
  { id: "continuous", label: "Across all groups" },
  { id: "group", label: "Within each group" },
  { id: "none", label: "No numbers" },
];

export const PAPER_SIZES = [
  { id: "A4", label: "A4" },
  { id: "LETTER", label: "US Letter" },
];

export const blankCv = () => ({
  docType: CV_DOC_TYPE,
  selectedTemplate: "cv-classic",
  settings: { citationStyle: "ieee", numbering: "continuous", paperSize: "A4" },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  hiddenSections: [],
  basics: {
    name: "",
    email: "",
    phone: "",
    location: { address: "" },
    website: "",
    orcid: "",
    scholar: "",
    github: "",
    linkedin: "",
    nameVariants: [],
  },
  interests: { summary: "", keywords: [] },
  education: [],
  publications: [],
  research: [],
  teaching: [],
  work: [],
  presentations: [],
  awards: [],
  grants: [],
  memberships: [],
  service: [],
  certifications: [],
  skills: [],
  languages: [],
  references: { availableOnRequest: false, items: [] },
  customSections: [],
});

const isPlainObject = v => v != null && typeof v === "object" && !Array.isArray(v);

// Fills in anything missing from an imported or older CV so the forms never meet an undefined list.
export function normalizeCv(input) {
  const base = blankCv();
  const cv = isPlainObject(input) ? input : {};
  const out = { ...base, ...cv, docType: CV_DOC_TYPE };
  out.settings = { ...base.settings, ...(isPlainObject(cv.settings) ? cv.settings : {}) };
  out.basics = { ...base.basics, ...(isPlainObject(cv.basics) ? cv.basics : {}) };
  if (!isPlainObject(out.basics.location)) out.basics.location = { address: "" };
  if (!Array.isArray(out.basics.nameVariants)) out.basics.nameVariants = [];
  out.interests = { ...base.interests, ...(isPlainObject(cv.interests) ? cv.interests : {}) };
  out.references = { ...base.references, ...(isPlainObject(cv.references) ? cv.references : {}) };
  if (!Array.isArray(out.references.items)) out.references.items = [];
  for (const key of Object.keys(base)) {
    if (Array.isArray(base[key]) && !Array.isArray(out[key])) out[key] = [];
  }
  out.customSections = out.customSections
    .filter(isPlainObject)
    .map((s, i) => ({ id: String(s.id || `section${i + 1}`), title: s.title || "", items: Array.isArray(s.items) ? s.items : [] }));
  return out;
}

let counter = 0;
export const newCustomSectionId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;
