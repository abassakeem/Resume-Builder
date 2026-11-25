import React from "react";
import CvDocument from "./CvDocument";
import { makeStyles } from "./cvStyles";

// Serif, centred name, black text: the conservative layout most search committees expect.
const theme = {
  fonts: { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic", boldItalic: "Times-BoldItalic" },
  size: 10.5,
  nameSize: 20,
  nameLetterSpacing: 0.5,
  align: "center",
  text: "#111111",
  heading: "#000000",
  muted: "#333333",
  link: "#111111",
  rule: "#000000",
  ruleWidth: 0.75,
};

const styles = makeStyles(theme);

export default function ClassicCvTemplate({ data }) {
  return <CvDocument data={data} theme={theme} styles={styles} />;
}
