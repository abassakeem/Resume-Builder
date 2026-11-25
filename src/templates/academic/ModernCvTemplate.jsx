import React from "react";
import CvDocument from "./CvDocument";
import { makeStyles } from "./cvStyles";

// Sans-serif, left-aligned, with a dark slate accent that still prints cleanly in greyscale.
const theme = {
  fonts: { regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique", boldItalic: "Helvetica-BoldOblique" },
  size: 9.5,
  nameSize: 22,
  nameLetterSpacing: 0,
  align: "left",
  text: "#1f2937",
  heading: "#1e3a5f",
  muted: "#4b5563",
  link: "#1e3a5f",
  rule: "#9ca3af",
  ruleWidth: 0.5,
};

const styles = makeStyles(theme);

export default function ModernCvTemplate({ data }) {
  return <CvDocument data={data} theme={theme} styles={styles} />;
}
