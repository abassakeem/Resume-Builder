import React from "react";
import { Field, SelectField, TagInput, BulletsField, ItemCard, AddButton } from "../ui";
import { useExpanded, moveItem, moveProps } from "../formUtils";

// A generic editor for a list of CV entries, driven by a field config, so each simple section
// (teaching, awards, memberships, ...) is a few lines of config instead of a near-copy of WorkForm.
//
// Field config: { key, label, hint, placeholder, type: "text" | "textarea" | "select" | "bullets" |
// "lines" | "tags", inputType, options, wide, validate }.
// `reorderable` adds move up/down buttons; only useful where the PDF keeps the user's order
// (sections sorted by date ignore it).
export default function CvListForm({
  items = [],
  onChange,
  fields,
  empty,
  title,
  subtitle,
  addLabel,
  removeLabel,
  expanded: external,
  renderExtra,
  reorderable = false,
}) {
  const own = useExpanded();
  const expanded = external || own;

  const update = (i, key, val) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  const add = () => {
    onChange([...items, empty()]);
    expanded.added(items.length);
  };

  const remove = i => {
    onChange(items.filter((_, idx) => idx !== i));
    expanded.removed(i);
  };

  const move = (i, delta) => {
    onChange(moveItem(items, i, delta));
    expanded.moved(i, i + delta);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <ItemCard
          key={i}
          title={title(item)}
          subtitle={subtitle?.(item)}
          open={expanded.isOpen(i)}
          onToggle={() => expanded.toggle(i)}
          onRemove={() => remove(i)}
          removeLabel={removeLabel}
          {...(reorderable ? moveProps(items, i, move) : {})}
        >
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <FieldFor key={f.key} field={f} value={item[f.key]} onChange={v => update(i, f.key, v)} />
            ))}
          </div>
          {renderExtra?.(item, i)}
        </ItemCard>
      ))}
      <AddButton onClick={add}>{addLabel}</AddButton>
    </div>
  );
}

function FieldFor({ field: f, value, onChange }) {
  const span = f.wide || f.type === "bullets" ? "@sm:col-span-2" : "";
  switch (f.type) {
    case "select":
      return <SelectField label={f.label} hint={f.hint} value={value} onChange={onChange} options={f.options} className={span} />;
    case "bullets":
      return (
        <div className={span}>
          <BulletsField label={f.label} hint={f.hint} value={value || []} onChange={onChange} placeholder={f.placeholder} addLabel={f.addLabel} />
        </div>
      );
    case "tags":
      return (
        <div className={span}>
          <TagInput label={f.label} value={value || []} onChange={onChange} placeholder={f.placeholder} />
        </div>
      );
    case "lines":
      // One entry per line, kept in order (used for author lists, where names can contain commas).
      return (
        <Field
          label={f.label}
          hint={f.hint}
          value={(value || []).join("\n")}
          onChange={v => onChange(v.split("\n"))}
          placeholder={f.placeholder}
          multiline
          rows={f.rows || 3}
          className={span}
        />
      );
    default:
      return (
        <Field
          label={f.label}
          hint={f.hint}
          value={value}
          onChange={onChange}
          placeholder={f.placeholder}
          type={f.inputType}
          multiline={f.type === "textarea"}
          rows={f.rows || 2}
          error={f.validate?.(value)}
          className={span}
        />
      );
  }
}
