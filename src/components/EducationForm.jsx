import React from "react";
import { Field, ItemCard, AddButton } from "./ui";
import { useExpanded, moveItem, moveProps, joinParts, dateRange } from "./formUtils";
import { validators } from "../lib/cv/validate";

const empty = () => ({
  institution: "", studyType: "", area: "", startDate: "", endDate: "", gpa: "", location: ""
});

const emptyAcademic = () => ({
  ...empty(), honours: "", thesisTitle: "", supervisor: "", thesisSummary: ""
});

// `academic` (used by the Academic CV) adds honours and thesis fields and checks the dates.
export default function EducationForm({ data, onChange, academic = false, reorderable = true }) {
  const items = data.education || [];
  const expanded = useExpanded();

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, education: next });
  };

  const add = () => {
    onChange({ ...data, education: [...items, academic ? emptyAcademic() : empty()] });
    expanded.added(items.length);
  };

  const remove = i => {
    onChange({ ...data, education: items.filter((_, idx) => idx !== i) });
    expanded.removed(i);
  };

  // The PDF prints entries in this order, so let the user arrange them.
  const move = (i, delta) => {
    onChange({ ...data, education: moveItem(items, i, delta) });
    expanded.moved(i, i + delta);
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
          {...(reorderable ? moveProps(items, i, move) : {})}
          removeLabel="Remove education"
        >
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <Field label="Institution" value={ed.institution} onChange={v => update(i, "institution", v)} placeholder="University Name" className="@sm:col-span-2" />
            <Field label="Degree Type" value={ed.studyType} onChange={v => update(i, "studyType", v)} placeholder="BSc / MSc / PhD" />
            <Field label="Field of Study" value={ed.area} onChange={v => update(i, "area", v)} placeholder="Computer Science" />
            <Field label="Start Date" value={ed.startDate} onChange={v => update(i, "startDate", v)} placeholder="Sep 2019" error={academic ? validators.date(ed.startDate) : undefined} />
            <Field label="End Date" value={ed.endDate} onChange={v => update(i, "endDate", v)} placeholder={academic ? "Jun 2022 or Present" : "Jun 2022"} error={academic ? validators.date(ed.endDate) : undefined} />
            <Field label={academic ? "GPA / Grade" : "GPA"} hint={academic ? "include the scale" : "optional"} value={ed.gpa} onChange={v => update(i, "gpa", v)} placeholder={academic ? "4.25/5.00" : "4.0/5.0"} />
            <Field label="Location" value={ed.location} onChange={v => update(i, "location", v)} placeholder="City, State" />
            {academic && (
              <>
                <Field label="Honours" hint="optional" value={ed.honours} onChange={v => update(i, "honours", v)} placeholder="with Distinction / First Class Honours" className="@sm:col-span-2" />
                <Field label="Thesis or Project Title" hint="optional" value={ed.thesisTitle} onChange={v => update(i, "thesisTitle", v)} placeholder="Predicting Flaky Tests from Execution Traces" className="@sm:col-span-2" multiline rows={2} />
                <Field label="Supervisor" hint="optional" value={ed.supervisor} onChange={v => update(i, "supervisor", v)} placeholder="Dr. Jane Smith" className="@sm:col-span-2" />
                <Field label="One-line Summary" hint="optional" value={ed.thesisSummary} onChange={v => update(i, "thesisSummary", v)} placeholder="What you did and what you found" className="@sm:col-span-2" multiline rows={2} />
              </>
            )}
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add}>Add education</AddButton>
    </div>
  );
}
