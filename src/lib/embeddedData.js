// Downloaded PDFs carry the resume's form data in a custom document-info entry, so uploading the
// PDF later restores every field exactly. The entry is added as a standard PDF incremental update:
// the original bytes are untouched and only a new info object, xref section and trailer are appended.

const KEY = "ResumeForgeData";
const FORMAT_VERSION = 1;

// One char per byte, so string offsets equal byte offsets.
const toBinaryString = bytes => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return out;
};

const fromBinaryString = str => Uint8Array.from(str, c => c.charCodeAt(0));

const toBase64 = text => btoa(toBinaryString(new TextEncoder().encode(text)));
const fromBase64 = b64 => new TextDecoder().decode(fromBinaryString(atob(b64)));

export function embedResumeData(bytes, data) {
  const pdf = toBinaryString(bytes);
  const startxref = pdf.slice(-1024).match(/startxref\s+(\d+)\s+%%EOF\s*$/);
  const trailerAt = pdf.lastIndexOf("trailer");
  // Anything unexpected (e.g. cross-reference streams) ships unmodified rather than risk a broken file.
  if (!startxref || trailerAt === -1) return bytes;

  const trailer = pdf.slice(trailerAt);
  const size = trailer.match(/\/Size\s+(\d+)/);
  const root = trailer.match(/\/Root\s+(\d+\s+\d+\s+R)/);
  if (!size || !root) return bytes;
  const info = trailer.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  const id = trailer.match(/\/ID\s*(\[[^\]]*\])/);

  // Carry over the existing info entries (producer, creation date, ...).
  let infoEntries = "";
  if (info) {
    const objAt = pdf.lastIndexOf(`\n${info[1]} ${info[2]} obj`);
    const endAt = objAt === -1 ? -1 : pdf.indexOf("endobj", objAt);
    if (endAt !== -1) {
      const body = pdf.slice(objAt, endAt);
      const open = body.indexOf("<<");
      const close = body.lastIndexOf(">>");
      if (open !== -1 && close > open) infoEntries = body.slice(open + 2, close).trim();
    }
  }

  const objNum = Number(size[1]);
  const payload = toBase64(JSON.stringify({ version: FORMAT_VERSION, data }));
  const object = `${objNum} 0 obj\n<<\n${infoEntries}\n/${KEY} (${payload})\n>>\nendobj\n`;
  const objectOffset = bytes.length + 1;
  const xrefOffset = objectOffset + object.length;
  const update =
    "\n" +
    object +
    // Listing the free-list head (object 0) too, as most writers do, keeps strict readers happy.
    `xref\n0 1\n0000000000 65535 f \n${objNum} 1\n${String(objectOffset).padStart(10, "0")} 00000 n \n` +
    `trailer\n<<\n/Size ${objNum + 1}\n/Root ${root[1]}\n/Info ${objNum} 0 R\n` +
    (id ? `/ID ${id[1]}\n` : "") +
    `/Prev ${startxref[1]}\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const out = new Uint8Array(bytes.length + update.length);
  out.set(bytes);
  out.set(fromBinaryString(update), bytes.length);
  return out;
}

// `doc` is a loaded pdf.js document. Returns the embedded resume data, or null if there is none.
export async function readEmbeddedResumeData(doc) {
  const { info } = await doc.getMetadata();
  const raw = info?.Custom?.[KEY];
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(fromBase64(raw));
    const data = parsed?.version === FORMAT_VERSION ? parsed.data : null;
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
