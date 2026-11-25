import React, { useRef, useState } from "react";
import { FileUp, LoaderCircle, Search } from "lucide-react";
import CvListForm from "./CvListForm";
import { useExpanded, joinParts } from "../formUtils";
import { PUBLICATION_STATUSES, CITATION_STYLES } from "../../lib/cv/model";
import { formatCitation, statusOf } from "../../lib/cv/citations";
import { isOwner } from "../../lib/cv/names";
import { validators, normalizeDoi, isDoi } from "../../lib/cv/validate";
import { fetchDoi } from "../../lib/cv/crossref";
import { parseBibtex } from "../../lib/cv/bibtex";

const MAX_BIB_BYTES = 2 * 1024 * 1024;

const emptyPublication = () => ({
  status: "journal", authors: [""], title: "", venue: "", year: "", volume: "", issue: "", pages: "", doi: "", url: "",
});

const FIELDS = [
  { key: "status", label: "Status", type: "select", options: PUBLICATION_STATUSES.map(s => ({ id: s.id, label: s.single })) },
  { key: "year", label: "Year", placeholder: "2025", validate: validators.year },
  { key: "authors", label: "Authors", hint: "one per line, in order", type: "lines", wide: true, rows: 4, placeholder: "Adaeze N. Okafor\nHelen Whitcombe" },
  { key: "title", label: "Title", type: "textarea", wide: true, placeholder: "Trace-based detection of flaky tests in CI pipelines" },
  { key: "venue", label: "Journal / Conference / Repository", wide: true, placeholder: "Empirical Software Engineering" },
  { key: "volume", label: "Volume", hint: "optional", placeholder: "30" },
  { key: "issue", label: "Issue", hint: "optional", placeholder: "4" },
  { key: "pages", label: "Pages", hint: "optional", placeholder: "112–139" },
  { key: "doi", label: "DOI", hint: "optional", placeholder: "10.1145/3597503.3639187", validate: validators.doi },
  { key: "url", label: "URL", hint: "if there's no DOI", wide: true, placeholder: "https://arxiv.org/abs/2509.01234", inputType: "url", validate: validators.url },
];

const doiKey = p => normalizeDoi(p.doi).toLowerCase();

function CitationPreview({ pub, style, owners }) {
  const segments = formatCitation({ ...pub, authors: (pub.authors || []).filter(a => a.trim()) }, { style, owners });
  const named = (pub.authors || []).some(a => a.trim());
  const found = (pub.authors || []).some(a => a.trim() && isOwner(a, owners));
  const styleLabel = CITATION_STYLES.find(s => s.id === style)?.label;
  return (
    <div className="mt-4 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Preview · {styleLabel}</div>
      <p className="text-xs leading-relaxed text-neutral-300 break-words">
        {segments.map((s, i) => {
          const cls = `${s.bold ? "font-semibold text-white" : ""} ${s.italic ? "italic" : ""}`;
          return <span key={i} className={cls}>{s.text}</span>;
        })}
      </p>
      {named && !found && owners.some(Boolean) && (
        <p className="mt-1.5 text-xs text-amber-400/90">
          Your name wasn't found among the authors, so nothing is bolded. Check the spelling, or add it under Header.
        </p>
      )}
    </div>
  );
}

function ImportPanel({ existing, onAdd, notify }) {
  const [doi, setDoi] = useState("");
  const [loading, setLoading] = useState(false);
  const [bib, setBib] = useState("");
  const fileRef = useRef();
  const doiError = validators.doi(doi);

  const lookUp = async e => {
    e.preventDefault();
    if (!doi.trim() || loading) return;
    const wanted = normalizeDoi(doi);
    if (existing.has(wanted.toLowerCase())) {
      notify("warning", "Already in your list", `A publication with DOI ${wanted} is already on your CV.`);
      return;
    }
    setLoading(true);
    try {
      const pub = await fetchDoi(wanted);
      onAdd([pub]);
      setDoi("");
      notify("success", "Publication added", `Filled in from Crossref${pub.title ? `: “${pub.title}”` : ""}. Check the status and details below.`);
    } catch (err) {
      notify(
        "error",
        "Couldn't fetch that DOI",
        err?.userMessage ?? "Something went wrong while contacting Crossref.",
        isDoi(wanted) ? { label: "Add manually", onClick: () => onAdd([{ ...emptyPublication(), doi: wanted }]) } : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  const importBib = (text, source) => {
    const { publications, skipped } = parseBibtex(text);
    if (!publications.length) {
      notify("error", "No publications found", `${source} has no BibTeX entries that could be read. Entries start with @article{ or @inproceedings{.`);
      return;
    }
    const fresh = publications.filter(p => !p.doi || !existing.has(doiKey(p)));
    const dupes = publications.length - fresh.length;
    if (fresh.length) onAdd(fresh);
    const notes = [
      dupes && `${dupes} already on your CV ${dupes === 1 ? "was" : "were"} skipped`,
      skipped && `${skipped} ${skipped === 1 ? "entry" : "entries"} couldn't be read`,
    ].filter(Boolean);
    notify(
      notes.length ? "warning" : "success",
      fresh.length ? `Added ${fresh.length} publication${fresh.length === 1 ? "" : "s"}` : "Nothing new to add",
      `${notes.length ? `${notes.join("; ")}. ` : ""}Check each entry's status: BibTeX can't tell an accepted paper from one under review.`
    );
    if (fresh.length) setBib("");
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BIB_BYTES) {
      notify("error", "File too large", `${file.name} is over 2 MB. Export just your own publications and try again.`);
      return;
    }
    importBib(await file.text(), file.name);
  };

  return (
    <div className="mb-4 rounded-xl border border-neutral-800 p-4 space-y-4">
      <form onSubmit={lookUp}>
        <label htmlFor="doi-lookup" className="block text-xs font-medium text-neutral-400 mb-1.5">
          Add from DOI <span className="font-normal text-neutral-500">· details are fetched from Crossref</span>
        </label>
        <div className="flex gap-2">
          <input
            id="doi-lookup"
            value={doi}
            onChange={e => setDoi(e.target.value)}
            placeholder="10.1145/3597503.3639187"
            aria-invalid={doiError ? true : undefined}
            className={`flex-1 min-w-0 bg-neutral-800/60 border rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/15 transition ${
              doiError ? "border-red-500/70" : "border-neutral-700 focus:border-neutral-400"
            }`}
          />
          <button
            type="submit"
            disabled={loading || !doi.trim() || !!doiError}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white hover:bg-neutral-200 text-sm font-medium text-black transition disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Looking up…" : "Look up"}
          </button>
        </div>
        {doiError && <p className="mt-1 text-xs text-red-400">{doiError}</p>}
      </form>

      <div>
        <label htmlFor="bib-import" className="block text-xs font-medium text-neutral-400 mb-1.5">
          Add from BibTeX <span className="font-normal text-neutral-500">· paste entries or upload a .bib file</span>
        </label>
        <textarea
          id="bib-import"
          value={bib}
          onChange={e => setBib(e.target.value)}
          rows={3}
          placeholder={"@article{okafor2025,\n  author = {Okafor, Adaeze N. and Whitcombe, Helen},\n  title = {…},"}
          className="w-full bg-neutral-800/60 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-white/15 transition resize-y"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => importBib(bib, "The pasted text")}
            disabled={!bib.trim()}
            className="h-8 px-3 rounded-lg bg-white hover:bg-neutral-200 text-xs font-medium text-black transition disabled:opacity-50"
          >
            Add pasted entries
          </button>
          <input ref={fileRef} type="file" accept=".bib,.bibtex,.txt,text/plain,application/x-bibtex" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
          >
            <FileUp size={13} /> Upload .bib
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicationsForm({ cv, onChange, notify }) {
  const items = cv.publications;
  const expanded = useExpanded();
  const owners = [cv.basics.name, ...(cv.basics.nameVariants || [])];
  const style = cv.settings.citationStyle;
  const existing = new Set(items.filter(p => p.doi).map(doiKey));

  const setItems = next => onChange(c => ({ ...c, publications: next }));

  // A DOI lookup finishes after a network round trip, so read the length at that moment.
  const lengthRef = useRef(items.length);
  lengthRef.current = items.length;

  const add = pubs => {
    // Open the first new entry so the user can check what was filled in.
    expanded.added(lengthRef.current);
    onChange(c => ({ ...c, publications: [...c.publications, ...pubs] }));
  };

  return (
    <div>
      <ImportPanel existing={existing} onAdd={add} notify={notify} />
      <CvListForm
        items={items}
        onChange={setItems}
        fields={FIELDS}
        empty={emptyPublication}
        expanded={expanded}
        title={p => p.title || "Untitled publication"}
        subtitle={p => joinParts(PUBLICATION_STATUSES.find(s => s.id === statusOf(p))?.single, p.venue, p.year)}
        addLabel="Add publication manually"
        removeLabel="Remove publication"
        renderExtra={pub => <CitationPreview pub={pub} style={style} owners={owners} />}
      />
    </div>
  );
}
