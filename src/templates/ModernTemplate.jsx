import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const ACCENT = "#1e40af";
const SIDEBAR_BG = "#1e3a5f";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    flexDirection: "row",
  },
  sidebar: {
    width: 175,
    backgroundColor: SIDEBAR_BG,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  main: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 22,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  nameAccent: {
    width: 28,
    height: 3,
    backgroundColor: "#60a5fa",
    marginBottom: 14,
    marginTop: 6,
  },
  sideLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
    marginTop: 12,
  },
  sideValue: { fontSize: 9, color: "#e2e8f0", lineHeight: 1.4 },
  sideSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#3b82f6",
  },
  sideSkillGroup: { marginBottom: 6 },
  sideSkillName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#bfdbfe", marginBottom: 1 },
  sideSkillKeywords: { fontSize: 8, color: "#cbd5e1", lineHeight: 1.35 },
  mainSectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a" },
  entrySubtitle: { fontSize: 9, color: "#475569", marginBottom: 2 },
  entryMeta: { fontSize: 8.5, color: "#64748b" },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { fontSize: 9, marginRight: 5, color: ACCENT, marginTop: 0.5 },
  bulletText: { fontSize: 9, color: "#334155", flex: 1, lineHeight: 1.4 },
  projectName: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: "#0f172a" },
  projectTags: { fontSize: 8, color: ACCENT, marginBottom: 1 },
  projectDesc: { fontSize: 9, color: "#334155", lineHeight: 1.4 },
  link: { color: "#2563eb" },
});

export default function ModernTemplate({ data }) {
  const { basics, education, work, skills, projects, headings } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.name}>{basics.name}</Text>
          <View style={styles.nameAccent} />

          {basics.email && (
            <>
              <Text style={styles.sideLabel}>Email</Text>
              <Text style={styles.sideValue}>{basics.email}</Text>
            </>
          )}
          {basics.phone && (
            <>
              <Text style={styles.sideLabel}>Phone</Text>
              <Text style={styles.sideValue}>{basics.phone}</Text>
            </>
          )}
          {basics.location?.address && (
            <>
              <Text style={styles.sideLabel}>Location</Text>
              <Text style={styles.sideValue}>{basics.location.address}</Text>
            </>
          )}
          {basics.website && (
            <>
              <Text style={styles.sideLabel}>Portfolio</Text>
              <Text style={styles.sideValue}>{basics.website}</Text>
            </>
          )}

          {skills?.length > 0 && (
            <>
              <Text style={styles.sideSectionTitle}>{headings?.skills || "Skills"}</Text>
              {skills.map((s, i) => (
                <View key={i} style={styles.sideSkillGroup}>
                  <Text style={styles.sideSkillName}>{s.name}</Text>
                  <Text style={styles.sideSkillKeywords}>{s.keywords?.join(", ")}</Text>
                </View>
              ))}
            </>
          )}

          {education?.length > 0 && (
            <>
              <Text style={styles.sideSectionTitle}>{headings?.education || "Education"}</Text>
              {education.map((ed, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={[styles.sideSkillName, { color: "#ffffff" }]}>{ed.institution}</Text>
                  <Text style={styles.sideSkillKeywords}>
                    {ed.studyType} {ed.area}
                  </Text>
                  <Text style={styles.sideSkillKeywords}>
                    {[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}
                  </Text>
                  {ed.gpa && <Text style={styles.sideSkillKeywords}>GPA: {ed.gpa}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        {/* Main */}
        <View style={styles.main}>
          {work?.length > 0 && (
            <>
              <Text style={styles.mainSectionTitle}>{headings?.work || "Work Experience"}</Text>
              {work.map((job, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryTitle}>{job.company}</Text>
                    <Text style={styles.entryMeta}>{job.location}</Text>
                  </View>
                  <View style={styles.entryRow}>
                    <Text style={styles.entrySubtitle}>{job.position}</Text>
                    <Text style={styles.entryMeta}>{[job.startDate, job.endDate].filter(Boolean).join(" – ")}</Text>
                  </View>
                  {job.highlights?.map((h, j) => (
                    <View key={j} style={styles.bullet}>
                      <Text style={styles.bulletDot}>›</Text>
                      <Text style={styles.bulletText}>{h}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {projects?.length > 0 && (
            <>
              <Text style={styles.mainSectionTitle}>{headings?.projects || "Projects"}</Text>
              {projects.map((p, i) => (
                <View key={i} style={{ marginBottom: 7 }}>
                  <View style={styles.entryRow}>
                    <Text style={styles.projectName}>{p.name}</Text>
                    {p.url && (
                      <Link src={p.url} style={styles.link}>
                        <Text style={{ fontSize: 8 }}>{p.url}</Text>
                      </Link>
                    )}
                  </View>
                  {p.keywords?.length > 0 && (
                    <Text style={styles.projectTags}>{p.keywords.join(" · ")}</Text>
                  )}
                  <Text style={styles.projectDesc}>{p.description}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
