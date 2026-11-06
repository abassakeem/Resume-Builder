import React from "react";
import { Field, TagInput, ItemCard, AddButton } from "./ui";
import { useExpanded } from "./formUtils";

const empty = () => ({ name: "", url: "", keywords: [], description: "" });

export default function ProjectsForm({ data, onChange }) {
  const items = data.projects || [];
  const expanded = useExpanded();

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, projects: next });
  };

  const add = () => {
    onChange({ ...data, projects: [...items, empty()] });
    expanded.added(items.length);
  };

  const remove = i => {
    onChange({ ...data, projects: items.filter((_, idx) => idx !== i) });
    expanded.removed(i);
  };

  return (
    <div className="space-y-3">
      {items.map((p, i) => (
        <ItemCard
          key={i}
          title={p.name || "Untitled project"}
          subtitle={(p.keywords || []).join(", ")}
          open={expanded.isOpen(i)}
          onToggle={() => expanded.toggle(i)}
          onRemove={() => remove(i)}
          removeLabel="Remove project"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
              <Field label="Project Name" value={p.name} onChange={v => update(i, "name", v)} placeholder="My Awesome Project" />
              <Field label="URL" hint="optional" value={p.url} onChange={v => update(i, "url", v)} placeholder="https://project.com" type="url" />
            </div>
            <TagInput label="Tech Stack" value={p.keywords || []} onChange={v => update(i, "keywords", v)} placeholder="React, Node.js, PostgreSQL" />
            <Field
              label="Description"
              value={p.description}
              onChange={v => update(i, "description", v)}
              placeholder="What did you build, what was the impact?"
              multiline
            />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add}>Add project</AddButton>
    </div>
  );
}
