import React from "react";
import TemplatePicker from "../TemplatePicker";
import { ChoiceGroup } from "../ui";
import { cvTemplates } from "./cvTemplateCatalog";
import { CITATION_STYLES, NUMBERING_MODES, PAPER_SIZES } from "../../lib/cv/model";
import { formatCitation } from "../../lib/cv/citations";

const EXAMPLE = {
  status: "conference",
  authors: ["Adaeze N. Okafor", "Helen Whitcombe"],
  title: "How long is too long? An empirical study of test timeouts",
  venue: "Proc. IEEE/ACM ASE",
  year: "2025",
  pages: "455–466",
  doi: "10.5555/ase.2025.0087",
};

export default function CvSettingsForm({ cv, onChange }) {
  const settings = cv.settings;
  const set = (key, val) => onChange(c => ({ ...c, settings: { ...c.settings, [key]: val } }));
  const example = cv.publications.find(p => p.title?.trim()) || EXAMPLE;
  const owners = example === EXAMPLE ? ["Adaeze N. Okafor"] : [cv.basics.name, ...(cv.basics.nameVariants || [])];

  return (
    <div className="space-y-6">
      <TemplatePicker selected={cv.selectedTemplate} onSelect={id => onChange(c => ({ ...c, selectedTemplate: id }))} options={cvTemplates} />

      <ChoiceGroup label="Paper size" value={settings.paperSize} onChange={v => set("paperSize", v)} options={PAPER_SIZES} />

      <div>
        <ChoiceGroup label="Citation style" value={settings.citationStyle} onChange={v => set("citationStyle", v)} options={CITATION_STYLES} />
        <p className="mt-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs leading-relaxed text-neutral-300 break-words">
          {formatCitation(example, { style: settings.citationStyle, owners }).map((s, i) => (
            <span key={i} className={`${s.bold ? "font-semibold text-white" : ""} ${s.italic ? "italic" : ""}`}>{s.text}</span>
          ))}
        </p>
      </div>

      <ChoiceGroup label="Number publications" value={settings.numbering} onChange={v => set("numbering", v)} options={NUMBERING_MODES} />
    </div>
  );
}
