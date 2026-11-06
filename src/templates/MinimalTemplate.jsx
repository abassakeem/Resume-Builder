import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  name: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 9.5,
    color: "#6b7280",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: 20,
    fontSize: 8.5,
    color: "#6b7280",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 8,
  },
  rule: {
    height: 0.5,
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111827",
  },
  entryPosition: {
    fontSize: 9.5,
    color: "#374151",
    marginBottom: 4,
    fontFamily: "Helvetica-Oblique",
  },
  entryMeta: { fontSize: 8.5, color: "#9ca3af" },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { fontSize: 9, marginRight: 6, color: "#d1d5db", marginTop: 0.5 },
  bulletText: { fontSize: 9, color: "#4b5563", flex: 1, lineHeight: 1.5 },
  skillRow: { flexDirection: "row", marginBottom: 3, flexWrap: "wrap" },
  skillLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    minWidth: 130,
  },
  skillValue: { fontSize: 9, color: "#6b7280", flex: 1 },
  projectEntry: { marginBottom: 8 },
  projectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  projectName: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#111827" },
  projectTags: { fontSize: 8, color: "#9ca3af", marginBottom: 2, marginTop: 1 },
  projectDesc: { fontSize: 9, color: "#6b7280", lineHeight: 1.5 },
  link: { color: "#6b7280", fontSize: 8 },
});

const Sep = () => <Text style={{ color: "#d1d5db", marginHorizontal: 5 }}>·</Text>;

export default function MinimalTemplate({ data }) {
  const { basics, education, work, skills, projects, headings } = data;

  const contact = [
    basics.email,
    basics.phone,
    basics.location?.address,
    basics.website,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{basics.name}</Text>

        <View style={styles.contactRow}>
          {contact.map((c, i) => (
            <React.Fragment key={i}>
              <Text>{c}</Text>
              {i < contact.length - 1 && <Sep />}
            </React.Fragment>
          ))}
        </View>

        {/* Education */}
        {education?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.education || "Education"}</Text>
            <View style={styles.rule} />
            {education.map((ed, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{ed.institution}</Text>
                  <Text style={styles.entryMeta}>{[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}</Text>
                </View>
                <Text style={styles.entryPosition}>
                  {ed.studyType} in {ed.area}{ed.gpa ? `  ·  GPA ${ed.gpa}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Work */}
        {work?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.work || "Experience"}</Text>
            <View style={styles.rule} />
            {work.map((job, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{job.company}</Text>
                  <Text style={styles.entryMeta}>{[job.startDate, job.endDate].filter(Boolean).join(" – ")}</Text>
                </View>
                <Text style={styles.entryPosition}>{job.position}  ·  {job.location}</Text>
                {job.highlights?.map((h, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>—</Text>
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {/* Skills */}
        {skills?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.skills || "Skills"}</Text>
            <View style={styles.rule} />
            {skills.map((s, i) => (
              <View key={i} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{s.name}</Text>
                <Text style={styles.skillValue}>{s.keywords?.join(", ")}</Text>
              </View>
            ))}
          </>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.projects || "Projects"}</Text>
            <View style={styles.rule} />
            {projects.map((p, i) => (
              <View key={i} style={styles.projectEntry}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  {p.url && (
                    <Link src={p.url} style={styles.link}>
                      <Text>{p.url}</Text>
                    </Link>
                  )}
                </View>
                {p.keywords?.length > 0 && (
                  <Text style={styles.projectTags}>{p.keywords.join("  ·  ")}</Text>
                )}
                <Text style={styles.projectDesc}>{p.description}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
