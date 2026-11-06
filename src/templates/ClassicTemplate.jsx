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
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 4,
    color: "#0f172a",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
    fontSize: 9,
    color: "#475569",
  },
  contactDot: { color: "#94a3b8", marginHorizontal: 4 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 1,
  },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a" },
  entrySubtitle: { fontSize: 9.5, color: "#334155", marginBottom: 3 },
  entryMeta: { fontSize: 9, color: "#64748b" },
  bullet: {
    flexDirection: "row",
    marginTop: 2,
    paddingLeft: 2,
  },
  bulletDot: { fontSize: 9, marginRight: 5, marginTop: 1, color: "#475569" },
  bulletText: { fontSize: 9.5, color: "#334155", flex: 1, lineHeight: 1.45 },
  skillRow: { flexDirection: "row", marginTop: 4, flexWrap: "wrap" },
  skillLabel: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: "#0f172a", minWidth: 140 },
  skillValue: { fontSize: 9.5, color: "#334155", flex: 1 },
  projectName: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#0f172a" },
  projectTags: { fontSize: 8.5, color: "#64748b", marginBottom: 2 },
  projectDesc: { fontSize: 9.5, color: "#334155", lineHeight: 1.45 },
  link: { color: "#2563eb", textDecoration: "none" },
});

const ContactItem = ({ children }) => (
  <Text style={{ color: "#475569", fontSize: 9 }}>{children}</Text>
);
const Dot = () => <Text style={styles.contactDot}>·</Text>;

export default function ClassicTemplate({ data }) {
  const { basics, education, work, skills, projects, headings } = data;

  const contactParts = [
    basics.location?.address,
    basics.email,
    basics.phone,
    basics.website,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.name}>{basics.name}</Text>
        <View style={styles.contactRow}>
          {contactParts.map((part, i) => (
            <React.Fragment key={i}>
              <ContactItem>{part}</ContactItem>
              {i < contactParts.length - 1 && <Dot />}
            </React.Fragment>
          ))}
        </View>

        {/* Education */}
        {education?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.education || "Education"}</Text>
            {education.map((ed, i) => (
              <View key={i}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{ed.institution}</Text>
                  <Text style={styles.entryMeta}>{ed.location}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entrySubtitle}>
                    {ed.studyType} {ed.area}{ed.gpa ? ` — GPA: ${ed.gpa}` : ""}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {[ed.startDate, ed.endDate].filter(Boolean).join(" - ")}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Work */}
        {work?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.work || "Work Experience"}</Text>
            {work.map((job, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{job.company}</Text>
                  <Text style={styles.entryMeta}>{job.location}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entrySubtitle}>{job.position}</Text>
                  <Text style={styles.entryMeta}>
                    {[job.startDate, job.endDate].filter(Boolean).join(" - ")}
                  </Text>
                </View>
                {job.highlights?.map((h, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
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
            <Text style={styles.sectionTitle}>{headings?.skills || "Technical Strengths"}</Text>
            {skills.map((s, i) => (
              <View key={i} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{s.name ? `${s.name}:` : ""}</Text>
                <Text style={styles.skillValue}>{s.keywords?.join(", ")}</Text>
              </View>
            ))}
          </>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{headings?.projects || "Projects"}</Text>
            {projects.map((p, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  {p.url && <Link src={p.url} style={styles.link}><Text style={{ fontSize: 8.5 }}>{p.url}</Text></Link>}
                </View>
                {p.keywords?.length > 0 && (
                  <Text style={styles.projectTags}>{p.keywords.join(" · ")}</Text>
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
