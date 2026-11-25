import React from "react";
import CvListForm from "./CvListForm";
import CvProfileForm from "./CvProfileForm";
import PublicationsForm from "./PublicationsForm";
import CvLayoutForm from "./CvLayoutForm";
import CvSettingsForm from "./CvSettingsForm";
import CustomSectionsForm from "./CustomSectionsForm";
import EducationForm from "../EducationForm";
import WorkForm from "../WorkForm";
import SkillsForm from "../SkillsForm";
import { Field, TagInput } from "../ui";
import { joinParts, dateRange } from "../formUtils";
import { PRESENTATION_TYPES, SERVICE_CATEGORIES } from "../../lib/cv/model";
import { validators } from "../../lib/cv/validate";

const labelOf = (list, id) => list.find(x => x.id === id)?.label;

// Config for the sections that are plain lists of entries.
const LISTS = {
  research: {
    empty: () => ({ role: "", group: "", institution: "", location: "", supervisor: "", startDate: "", endDate: "", highlights: [""] }),
    title: r => r.role || "Untitled position",
    subtitle: r => joinParts(r.group || r.institution, dateRange(r.startDate, r.endDate)),
    addLabel: "Add research position",
    removeLabel: "Remove position",
    fields: [
      { key: "role", label: "Role", placeholder: "Graduate Research Assistant" },
      { key: "group", label: "Lab / Group", placeholder: "Software Systems Group" },
      { key: "institution", label: "Institution", placeholder: "University of Manchester" },
      { key: "location", label: "Location", placeholder: "Manchester, United Kingdom" },
      { key: "supervisor", label: "PI / Supervisor", placeholder: "Dr. Helen Whitcombe", wide: true },
      { key: "startDate", label: "Start", placeholder: "Jan 2025", validate: validators.date },
      { key: "endDate", label: "End", placeholder: "Present", validate: validators.date },
      { key: "highlights", label: "Highlights", hint: "methods, results, outputs", type: "bullets", addLabel: "Add highlight", placeholder: "What you did and what came of it" },
    ],
  },
  teaching: {
    empty: () => ({ role: "", courseCode: "", courseName: "", institution: "", term: "" }),
    title: t => joinParts(t.courseCode, t.courseName) || "Untitled course",
    subtitle: t => joinParts(t.role, t.term),
    addLabel: "Add teaching role",
    removeLabel: "Remove teaching role",
    fields: [
      { key: "role", label: "Role", placeholder: "Teaching Assistant / Instructor / Tutor", wide: true },
      { key: "courseCode", label: "Course Code", placeholder: "COMP33711" },
      { key: "courseName", label: "Course Name", placeholder: "Agile Software Engineering" },
      { key: "institution", label: "Institution", placeholder: "University of Manchester" },
      { key: "term", label: "Term", placeholder: "Spring 2025", validate: validators.date },
    ],
  },
  presentations: {
    empty: () => ({ title: "", event: "", location: "", date: "", type: "oral" }),
    title: p => p.title || "Untitled talk",
    subtitle: p => joinParts(labelOf(PRESENTATION_TYPES, p.type), p.event, p.date),
    addLabel: "Add presentation",
    removeLabel: "Remove presentation",
    fields: [
      { key: "title", label: "Title", type: "textarea", wide: true, placeholder: "Catching flaky tests without rerunning them" },
      { key: "event", label: "Event", wide: true, placeholder: "UK Software Testing Research Workshop" },
      { key: "location", label: "Location", placeholder: "Sheffield, United Kingdom" },
      { key: "date", label: "Date", placeholder: "Jun 2025", validate: validators.date },
      { key: "type", label: "Type", type: "select", options: PRESENTATION_TYPES },
    ],
  },
  awards: {
    empty: () => ({ name: "", awarder: "", year: "", amount: "" }),
    title: a => a.name || "Untitled award",
    subtitle: a => joinParts(a.awarder, a.year),
    addLabel: "Add award",
    removeLabel: "Remove award",
    fields: [
      { key: "name", label: "Award / Scholarship", wide: true, placeholder: "Commonwealth Shared Scholarship" },
      { key: "awarder", label: "Awarding Body", wide: true, placeholder: "Commonwealth Scholarship Commission" },
      { key: "year", label: "Year", placeholder: "2024", validate: validators.year },
      { key: "amount", label: "Amount", hint: "optional", placeholder: "£28,000" },
    ],
  },
  grants: {
    empty: () => ({ title: "", funder: "", role: "", year: "", amount: "" }),
    title: g => g.title || "Untitled grant",
    subtitle: g => joinParts(g.funder, g.year),
    addLabel: "Add grant",
    removeLabel: "Remove grant",
    fields: [
      { key: "title", label: "Grant / Project Title", wide: true, placeholder: "Student Travel Grant, ASE 2025" },
      { key: "funder", label: "Funder", placeholder: "ACM SIGSOFT" },
      { key: "role", label: "Your Role", hint: "optional", placeholder: "Recipient / Co-investigator" },
      { key: "year", label: "Year(s)", placeholder: "2025 or 2024–2026", validate: validators.date },
      { key: "amount", label: "Amount", hint: "optional", placeholder: "US$1,500" },
    ],
  },
  memberships: {
    empty: () => ({ organisation: "", role: "", startDate: "", endDate: "" }),
    title: m => m.organisation || "Untitled organisation",
    subtitle: m => joinParts(m.role, dateRange(m.startDate, m.endDate)),
    addLabel: "Add membership",
    removeLabel: "Remove membership",
    fields: [
      { key: "organisation", label: "Organisation", wide: true, placeholder: "Association for Computing Machinery (ACM)" },
      { key: "role", label: "Role", hint: "optional", placeholder: "Student Member", wide: true },
      { key: "startDate", label: "From", placeholder: "2022", validate: validators.date },
      { key: "endDate", label: "To", placeholder: "Present", validate: validators.date },
    ],
  },
  service: {
    empty: () => ({ category: "review", role: "", organisation: "", description: "", startDate: "", endDate: "" }),
    title: x => joinParts(x.role, x.organisation) || "Untitled service",
    subtitle: x => joinParts(labelOf(SERVICE_CATEGORIES, x.category), dateRange(x.startDate, x.endDate)),
    addLabel: "Add service",
    removeLabel: "Remove service",
    fields: [
      { key: "category", label: "Type", type: "select", options: SERVICE_CATEGORIES, wide: true },
      { key: "role", label: "Role", placeholder: "Sub-reviewer / Committee member / Mentor" },
      { key: "organisation", label: "Journal, Event or Organisation", placeholder: "ICSE 2026 Technical Track" },
      { key: "startDate", label: "From", placeholder: "2025", validate: validators.date },
      { key: "endDate", label: "To", hint: "optional", placeholder: "Present", validate: validators.date },
      { key: "description", label: "Description", hint: "optional", type: "textarea", wide: true, placeholder: "One line on what you did" },
    ],
  },
  certifications: {
    empty: () => ({ name: "", issuer: "", date: "", url: "" }),
    title: c => c.name || "Untitled certification",
    subtitle: c => joinParts(c.issuer, c.date),
    addLabel: "Add certification",
    removeLabel: "Remove certification",
    fields: [
      { key: "name", label: "Certification", wide: true, placeholder: "ISTQB Certified Tester, Foundation Level" },
      { key: "issuer", label: "Issuer", placeholder: "ISTQB" },
      { key: "date", label: "Date", placeholder: "2023", validate: validators.date },
      { key: "url", label: "Credential URL", hint: "optional", wide: true, inputType: "url", placeholder: "https://…", validate: validators.url },
    ],
  },
  languages: {
    empty: () => ({ language: "", fluency: "" }),
    title: l => l.language || "Untitled language",
    subtitle: l => l.fluency,
    addLabel: "Add language",
    reorderable: true,
    removeLabel: "Remove language",
    fields: [
      { key: "language", label: "Language", placeholder: "French" },
      { key: "fluency", label: "Proficiency", placeholder: "Native / Fluent / Intermediate (B1)" },
    ],
  },
};

const REFERENCE_LIST = {
  empty: () => ({ name: "", title: "", department: "", institution: "", email: "", phone: "", relationship: "" }),
  title: r => r.name || "Untitled referee",
  subtitle: r => joinParts(r.title, r.institution),
  addLabel: "Add referee",
  reorderable: true,
  removeLabel: "Remove referee",
  fields: [
    { key: "name", label: "Name", placeholder: "Dr. Helen Whitcombe", wide: true },
    { key: "title", label: "Title / Position", placeholder: "Senior Lecturer in Software Engineering", wide: true },
    { key: "department", label: "Department", placeholder: "Department of Computer Science" },
    { key: "institution", label: "Institution", placeholder: "University of Manchester" },
    { key: "email", label: "Email", inputType: "email", placeholder: "h.whitcombe@university.ac.uk", validate: validators.email },
    { key: "phone", label: "Phone", hint: "optional", inputType: "tel", placeholder: "+44 161 000 0000" },
    { key: "relationship", label: "Relationship", wide: true, placeholder: "MSc thesis supervisor" },
  ],
};

function InterestsForm({ cv, onChange }) {
  const set = (key, val) => onChange(c => ({ ...c, interests: { ...c.interests, [key]: val } }));
  return (
    <div className="space-y-4">
      <Field
        label="Summary"
        hint="one or two lines, optional"
        value={cv.interests.summary}
        onChange={v => set("summary", v)}
        placeholder="Making automated software testing more reliable, with a focus on flaky tests."
        multiline
      />
      <TagInput label="Keywords" value={cv.interests.keywords} onChange={v => set("keywords", v)} placeholder="Software testing, Program analysis" />
    </div>
  );
}

function ReferencesForm({ cv, onChange }) {
  const refs = cv.references;
  const set = patch => onChange(c => ({ ...c, references: { ...c.references, ...patch } }));
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-neutral-800 p-3 cursor-pointer hover:border-neutral-700 transition">
        <input
          type="checkbox"
          checked={!!refs.availableOnRequest}
          onChange={e => set({ availableOnRequest: e.target.checked })}
          className="mt-0.5 w-4 h-4 accent-white"
        />
        <span>
          <span className="block text-sm text-neutral-100">Show “Available upon request” instead</span>
          <span className="block text-xs text-neutral-500 mt-0.5">The referees below are kept but not printed.</span>
        </span>
      </label>
      <div className={refs.availableOnRequest ? "opacity-60" : ""}>
        <CvListForm {...REFERENCE_LIST} items={refs.items} onChange={items => set({ items })} />
      </div>
    </div>
  );
}

// Renders the editor for one CV step. `onChange` accepts a new CV or an updater function.
export default function CvEditor({ step, cv, onChange, notify, onGoTo }) {
  if (LISTS[step]) {
    return <CvListForm {...LISTS[step]} items={cv[step]} onChange={items => onChange(c => ({ ...c, [step]: items }))} />;
  }
  switch (step) {
    case "template":
      return <CvSettingsForm cv={cv} onChange={onChange} />;
    case "layout":
      return <CvLayoutForm cv={cv} onChange={onChange} onGoTo={onGoTo} />;
    case "profile":
      return <CvProfileForm cv={cv} onChange={onChange} />;
    case "interests":
      return <InterestsForm cv={cv} onChange={onChange} />;
    case "education":
      // Education and experience print newest first automatically, so no move buttons.
      return <EducationForm data={cv} onChange={onChange} academic reorderable={false} />;
    case "publications":
      return <PublicationsForm cv={cv} onChange={onChange} notify={notify} />;
    case "work":
      return <WorkForm data={cv} onChange={onChange} reorderable={false} />;
    case "skills":
      return <SkillsForm data={cv} onChange={onChange} />;
    case "references":
      return <ReferencesForm cv={cv} onChange={onChange} />;
    case "custom":
      return <CustomSectionsForm cv={cv} onChange={onChange} />;
    default:
      return null;
  }
}
