import React from "react";
import { Field, ItemCard, AddButton } from "./ui";
import { useExpanded, joinParts, dateRange } from "./formUtils";

const empty = () => ({
  institution: "", studyType: "", area: "", startDate: "", endDate: "", gpa: "", location: ""
});

export default function EducationForm({ data, onChange }) {
  const items = data.education || [];
  const expanded = useExpanded();

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, education: next });
  };

  const add = () => {
    onChange({ ...data, education: [...items, empty()] });
    expanded.added(items.length);
  };

  const remove = i => {
    onChange({ ...data, education: items.filter((_, idx) => idx !== i) });
    expanded.removed(i);
  };

  return (
    <div className="space-y-3">
      {items.map((ed, i) => (
        <ItemCard
          key={i}
          title={ed.institution || "Untitled school"}
          subtitle={joinParts([ed.studyType, ed.area].filter(Boolean).join(" "), dateRange(ed.startDate, ed.endDate))}
          open={expanded.isOpen(i)}
          onToggle={() => expanded.toggle(i)}
          onRemove={() => remove(i)}
          removeLabel="Remove education"
        >
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <Field label="Institution" value={ed.institution} onChange={v => update(i, "institution", v)} placeholder="University Name" className="@sm:col-span-2" />
            <Field label="Degree Type" value={ed.studyType} onChange={v => update(i, "studyType", v)} placeholder="BSc / MSc / PhD" />
            <Field label="Field of Study" value={ed.area} onChange={v => update(i, "area", v)} placeholder="Computer Science" />
            <Field label="Start Date" value={ed.startDate} onChange={v => update(i, "startDate", v)} placeholder="Sep 2019" />
            <Field label="End Date" value={ed.endDate} onChange={v => update(i, "endDate", v)} placeholder="Jun 2022" />
            <Field label="GPA" hint="optional" value={ed.gpa} onChange={v => update(i, "gpa", v)} placeholder="4.0/5.0" />
            <Field label="Location" value={ed.location} onChange={v => update(i, "location", v)} placeholder="City, State" />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add}>Add education</AddButton>
    </div>
  );
}
