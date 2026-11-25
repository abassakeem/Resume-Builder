import React from "react";
import CvListForm from "./CvListForm";
import { Field, AddButton, ConfirmRemove } from "../ui";
import { joinParts } from "../formUtils";
import { newCustomSectionId } from "../../lib/cv/model";
import { customSectionKey } from "../../lib/cv/sections";
import { validators } from "../../lib/cv/validate";

const emptyItem = () => ({ title: "", subtitle: "", date: "", description: "" });

const FIELDS = [
  { key: "title", label: "Title", wide: true, placeholder: "Software Testing and Verification" },
  { key: "subtitle", label: "Detail", hint: "optional", placeholder: "University of Manchester" },
  { key: "date", label: "Date", hint: "optional", placeholder: "2025", validate: validators.date },
  { key: "description", label: "Description", hint: "optional", type: "textarea", wide: true, placeholder: "Grade: 84/100" },
];

export default function CustomSectionsForm({ cv, onChange }) {
  const sections = cv.customSections;

  const updateSection = (id, patch) =>
    onChange(c => ({ ...c, customSections: c.customSections.map(s => (s.id === id ? { ...s, ...patch } : s)) }));

  const addSection = () => {
    const id = newCustomSectionId();
    onChange(c => ({
      ...c,
      customSections: [...c.customSections, { id, title: "", items: [emptyItem()] }],
      sectionOrder: [...(c.sectionOrder || []), customSectionKey(id)],
    }));
  };

  const removeSection = id => {
    const key = customSectionKey(id);
    onChange(c => ({
      ...c,
      customSections: c.customSections.filter(s => s.id !== id),
      sectionOrder: (c.sectionOrder || []).filter(k => k !== key),
      hiddenSections: (c.hiddenSections || []).filter(k => k !== key),
    }));
  };

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.id} className="rounded-xl border border-neutral-800 p-4">
          <div className="flex items-end gap-2 mb-4">
            <Field
              label="Section name"
              value={section.title}
              onChange={v => updateSection(section.id, { title: v })}
              placeholder="e.g. Relevant Coursework, Fieldwork, Exhibitions"
              className="flex-1"
            />
            <div className="mb-0.5">
              <ConfirmRemove label={`Delete section ${section.title || "Untitled section"}`} onConfirm={() => removeSection(section.id)} />
            </div>
          </div>
          <CvListForm
            items={section.items}
            onChange={items => updateSection(section.id, { items })}
            fields={FIELDS}
            empty={emptyItem}
            title={x => x.title || "Untitled entry"}
            subtitle={x => joinParts(x.subtitle, x.date)}
            addLabel="Add entry"
            removeLabel="Remove entry"
          />
        </div>
      ))}
      <AddButton onClick={addSection}>Add custom section</AddButton>
    </div>
  );
}
