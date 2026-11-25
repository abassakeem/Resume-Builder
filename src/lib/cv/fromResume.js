// Copies the fields a resume and a CV share into a CV. Everything is deep-copied, so the two
// documents stay independent once the CV has been created.

import { blankCv, normalizeCv } from "./model";

const str = v => (v == null ? "" : String(v));
const list = v => (Array.isArray(v) ? v.map(str) : []);

const PROFILE_HOSTS = [
  { key: "github", re: /(^|\/\/|\.)github\.com\//i },
  { key: "linkedin", re: /(^|\/\/|\.)linkedin\.com\//i },
  { key: "scholar", re: /scholar\.google\./i },
  { key: "orcid", re: /(^|\/\/|\.)orcid\.org\//i },
];

export function mapResumeBasics(basics = {}) {
  const out = {
    name: str(basics.name),
    email: str(basics.email),
    phone: str(basics.phone),
    location: { address: str(basics.location?.address) },
    website: "",
  };
  // A resume has one website field; profile links in it belong in the CV's dedicated fields.
  const website = str(basics.website).trim();
  const profile = PROFILE_HOSTS.find(p => p.re.test(website));
  if (profile) out[profile.key] = website;
  else out.website = website;
  return out;
}

export const mapResumeEducation = education =>
  (Array.isArray(education) ? education : []).map(ed => ({
    institution: str(ed.institution),
    studyType: str(ed.studyType),
    area: str(ed.area),
    location: str(ed.location),
    startDate: str(ed.startDate),
    endDate: str(ed.endDate),
    gpa: str(ed.gpa),
    honours: "",
    thesisTitle: "",
    supervisor: "",
    thesisSummary: "",
  }));

export const mapResumeWork = work =>
  (Array.isArray(work) ? work : []).map(job => ({
    company: str(job.company),
    position: str(job.position),
    location: str(job.location),
    startDate: str(job.startDate),
    endDate: str(job.endDate),
    highlights: list(job.highlights),
  }));

export const mapResumeSkills = skills =>
  (Array.isArray(skills) ? skills : []).map(s => ({ name: str(s.name), keywords: list(s.keywords) }));

// The resume form has no certifications yet, but JSON files may carry them (JSON Resume calls
// them "certificates").
export const mapResumeCertifications = resume =>
  (Array.isArray(resume.certifications) ? resume.certifications : Array.isArray(resume.certificates) ? resume.certificates : [])
    .map(c => ({ name: str(c.name), issuer: str(c.issuer), date: str(c.date), url: str(c.url) }));

// A new CV built from a resume: shared fields filled in, academic sections left empty.
export function cvFromResume(resume = {}) {
  const cv = blankCv();
  return normalizeCv({
    ...cv,
    basics: { ...cv.basics, ...mapResumeBasics(resume.basics) },
    education: mapResumeEducation(resume.education),
    work: mapResumeWork(resume.work),
    skills: mapResumeSkills(resume.skills),
    certifications: mapResumeCertifications(resume),
  });
}

// Merges resume-shaped data (e.g. text read from a PDF) into an existing CV, replacing only the
// shared sections the import actually found something for.
export function mergeResumeIntoCv(cv, resume = {}) {
  const mapped = cvFromResume(resume);
  const basics = Object.fromEntries(
    Object.entries(mapped.basics).filter(([k, v]) => (k === "location" ? v.address : Array.isArray(v) ? v.length : v))
  );
  const pick = key => (mapped[key].length ? mapped[key] : cv[key]);
  return {
    ...cv,
    basics: { ...cv.basics, ...basics },
    education: pick("education"),
    work: pick("work"),
    skills: pick("skills"),
    certifications: pick("certifications"),
  };
}
