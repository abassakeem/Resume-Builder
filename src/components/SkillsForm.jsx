import React from "react";
import { Field, TagInput, ItemCard, AddButton } from "./ui";
import { useExpanded } from "./formUtils";

const empty = () => ({ name: "", keywords: [] });

export default function SkillsForm({ data, onChange }) {
  const items = data.skills || [];
  const expanded = useExpanded();

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, skills: next });
  };

  const add = () => {
    onChange({ ...data, skills: [...items, empty()] });
    expanded.added(items.length);
  };

  const remove = i => {
    onChange({ ...data, skills: items.filter((_, idx) => idx !== i) });
    expanded.removed(i);
  };

  return (
    <div className="space-y-3">
      {items.map((s, i) => {
        const count = s.keywords?.length || 0;
        return (
          <ItemCard
            key={i}
            title={s.name || "Untitled category"}
            subtitle={`${count} ${count === 1 ? "skill" : "skills"}`}
            open={expanded.isOpen(i)}
            onToggle={() => expanded.toggle(i)}
            onRemove={() => remove(i)}
            removeLabel="Remove category"
          >
            <div className="space-y-4">
              <Field label="Category Name" value={s.name} onChange={v => update(i, "name", v)} placeholder="e.g. Test Automation & Framework" />
              <TagInput label="Skills" value={s.keywords || []} onChange={v => update(i, "keywords", v)} placeholder="Playwright, Cypress, Jest" />
            </div>
          </ItemCard>
        );
      })}
      <AddButton onClick={add}>Add skill category</AddButton>
    </div>
  );
}
