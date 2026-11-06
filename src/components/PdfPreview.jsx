import React, { useState, useEffect, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { getDocument } from "../lib/pdfjs";
import { embedResumeData } from "../lib/embeddedData";
import ClassicTemplate from "../templates/ClassicTemplate";
import ModernTemplate from "../templates/ModernTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";
import { Download } from "lucide-react";

const TEMPLATES = {
  1: ClassicTemplate,
  2: ModernTemplate,
  3: MinimalTemplate,
};

const MAX_PAGE_WIDTH = 820;
const RENDER_DELAY_MS = 300;

const getTemplate = data => TEMPLATES[data.selectedTemplate] || ClassicTemplate;

const isFilled = v =>
  Array.isArray(v) ? v.some(isFilled) : v != null && String(v).trim() !== "";

const hasContent = entry => Object.values(entry || {}).some(isFilled);

// Drop untouched list entries and empty bullets so a blank form doesn't print stray separators.
const forPdf = data => ({
  ...data,
  basics: data.basics || {},
  education: (data.education || []).filter(hasContent),
  work: (data.work || []).filter(hasContent).map(job => ({
    ...job,
    highlights: (job.highlights || []).filter(isFilled),
  })),
  skills: (data.skills || []).filter(hasContent),
  projects: (data.projects || []).filter(hasContent),
});

const buildPdf = data => {
  const Template = getTemplate(data);
  return pdf(<Template data={forPdf(data)} />).toBlob();
};

export function DownloadButton({ data }) {
  const [building, setBuilding] = useState(false);
  const filename = `${(data.basics?.name || "resume").replace(/\s+/g, "_")}_Resume.pdf`;

  const handleDownload = async () => {
    setBuilding(true);
    try {
      // Embed the form data so uploading this PDF later restores every field exactly.
      const bytes = embedResumeData(new Uint8Array(await (await buildPdf(data)).arrayBuffer()), data);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={building}
      className="flex items-center gap-2 h-9 px-4 bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded-lg transition disabled:opacity-60"
    >
      <Download size={15} />
      <span className="hidden sm:inline">{building ? "Building PDF..." : "Download PDF"}</span>
    </button>
  );
}

// Renders the PDF to canvases off-screen and swaps them in only once every page is drawn,
// so the preview updates in place instead of reloading (and flashing) like an iframe viewer.
export default function PdfPreview({ data }) {
  const scrollRef = useRef();
  const pagesRef = useRef();
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;

    const render = async () => {
      const bytes = new Uint8Array(await (await buildPdf(data)).arrayBuffer());
      if (cancelled) return;
      const doc = await getDocument({ data: bytes }).promise;
      try {
        const cssWidth = Math.min(width, MAX_PAGE_WIDTH);
        const dpr = window.devicePixelRatio || 1;
        const canvases = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const scale = (cssWidth / page.getViewport({ scale: 1 }).width) * dpr;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${cssWidth}px`;
          canvas.className = "bg-white rounded-sm shadow-2xl shadow-black/50";
          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }
        pagesRef.current.replaceChildren(...canvases);
        setReady(true);
      } finally {
        doc.destroy();
      }
    };

    const timer = setTimeout(() => {
      render().catch(err => console.error("Preview render failed", err));
    }, ready ? RENDER_DELAY_MS : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `ready` only picks the first-render delay; it shouldn't trigger a re-render itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width]);

  return (
    <div ref={scrollRef} className="relative h-full overflow-y-auto px-6 py-6 bg-neutral-900/40">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
          Loading preview...
        </div>
      )}
      <div ref={pagesRef} className="flex flex-col items-center gap-6" />
    </div>
  );
}
