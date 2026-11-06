import { getDocument } from "./pdfjs";
import { readEmbeddedResumeData } from "./embeddedData";
import { extractLines, parseResumeLines } from "./parseResumePdf";

const fail = userMessage => Object.assign(new Error(userMessage), { userMessage });

// Returns { kind: "embedded", data } for PDFs downloaded from this app (exact),
// or { kind: "parsed", data } with fields read from the PDF's text (best effort).
export async function importResumePdf(buffer) {
  let doc;
  try {
    doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  } catch (err) {
    if (err?.name === "PasswordException") throw fail("This PDF is password-protected. Remove the password and try again.");
    throw fail("This file couldn't be opened as a PDF.");
  }

  try {
    const embedded = await readEmbeddedResumeData(doc);
    if (embedded) return { kind: "embedded", data: embedded };

    const lines = await extractLines(doc);
    if (!lines.length) {
      throw fail("This PDF has no selectable text. It may be a scanned image, which can't be read.");
    }
    return { kind: "parsed", data: parseResumeLines(lines) };
  } finally {
    doc.destroy();
  }
}
