import React from "react";
import { Field, TagInput } from "../ui";
import { validators } from "../../lib/cv/validate";

export default function CvProfileForm({ cv, onChange }) {
  const b = cv.basics;
  const set = (key, val) => onChange(c => ({ ...c, basics: { ...c.basics, [key]: val } }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
        <Field label="Full Name" value={b.name} onChange={v => set("name", v)} placeholder="Adaeze N. Okafor" className="@sm:col-span-2" />
        <Field label="Email" value={b.email} onChange={v => set("email", v)} placeholder="name@university.edu" type="email" error={validators.email(b.email)} />
        <Field label="Phone" value={b.phone} onChange={v => set("phone", v)} placeholder="+44 7700 900123" type="tel" />
        <Field label="City, Country" value={b.location?.address} onChange={v => set("location", { address: v })} placeholder="Manchester, United Kingdom" />
        <Field label="Website / Portfolio" value={b.website} onChange={v => set("website", v)} placeholder="https://yoursite.com" type="url" error={validators.url(b.website)} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-200">Academic profiles</h2>
        <p className="mt-0.5 mb-3 text-xs text-neutral-500">Optional. Each one becomes a clickable link in the PDF.</p>
        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
          <Field label="ORCID iD" value={b.orcid} onChange={v => set("orcid", v)} placeholder="0000-0002-1825-0097" error={validators.orcid(b.orcid)} />
          <Field label="Google Scholar" value={b.scholar} onChange={v => set("scholar", v)} placeholder="https://scholar.google.com/citations?user=…" type="url" error={validators.url(b.scholar)} />
          <Field label="GitHub" value={b.github} onChange={v => set("github", v)} placeholder="https://github.com/username" type="url" error={validators.url(b.github)} />
          <Field label="LinkedIn" value={b.linkedin} onChange={v => set("linkedin", v)} placeholder="https://linkedin.com/in/username" type="url" error={validators.url(b.linkedin)} />
        </div>
      </div>

      <div>
        <TagInput
          label="Other spellings of your name in author lists"
          value={b.nameVariants || []}
          onChange={v => set("nameVariants", v)}
          placeholder="e.g. A. Nwosu (a previous surname)"
        />
        <p className="mt-1.5 text-xs text-neutral-500">
          Your name is bolded in publications automatically, including initials like “A. N. Okafor”. Add a spelling here only if it differs, such as a previous surname.
        </p>
      </div>
    </div>
  );
}
