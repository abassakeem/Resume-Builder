import { describe, it, expect } from "vitest";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import ClassicCvTemplate from "./ClassicCvTemplate";
import ModernCvTemplate from "./ModernCvTemplate";
import { sampleCv } from "../../cvSampleData";
import { blankCv } from "../../lib/cv/model";
import { prepareCv } from "../../lib/cv/sections";

// Smoke tests: both templates render the sample and an empty CV to a real, multi-page PDF
// with clickable links. Layout itself is checked by eye in the live preview.
const render = async (Template, cv) => (await renderToBuffer(<Template data={prepareCv(cv)} />)).toString("latin1");
const pageCount = pdf => (pdf.match(/\/Type \/Page\b/g) || []).length;

describe.each([
  ["Classic", ClassicCvTemplate],
  ["Modern", ModernCvTemplate],
])("%s CV template", (_, Template) => {
  it.each(["A4", "LETTER"])("renders the sample CV on %s paper", async paperSize => {
    const cv = sampleCv();
    cv.settings.paperSize = paperSize;
    const pdf = await render(Template, cv);
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pageCount(pdf)).toBeGreaterThan(1);
    expect(pdf).toContain("/URI (https://doi.org/10.5555/ese.2025.0412)");
    expect(pdf).toContain("/URI (https://orcid.org/0000-0002-1825-0097)");
    const [, width, height] = pdf.match(/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    expect([Math.round(width), Math.round(height)]).toEqual(paperSize === "A4" ? [595, 842] : [612, 792]);
  }, 20000);

  it("renders an empty CV without errors", async () => {
    const pdf = await render(Template, blankCv());
    expect(pageCount(pdf)).toBe(1);
  });
});
