import React from "react";
import { Field } from "./ui";

export default function ProfileForm({ data, onChange }) {
  const b = data.basics || {};
  const set = (key, val) =>
    onChange({ ...data, basics: { ...b, [key]: val } });

  return (
    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
      <Field label="Full Name" value={b.name} onChange={v => set("name", v)} placeholder="Jane Smith" className="@sm:col-span-2" />
      <Field label="Email" value={b.email} onChange={v => set("email", v)} placeholder="jane@email.com" type="email" />
      <Field label="Phone" value={b.phone} onChange={v => set("phone", v)} placeholder="+1 555 000 0000" type="tel" />
      <Field label="Location" value={b.location?.address} onChange={v => set("location", { address: v })} placeholder="City, Country" />
      <Field label="Website / Portfolio" value={b.website} onChange={v => set("website", v)} placeholder="https://yoursite.com" type="url" />
    </div>
  );
}
