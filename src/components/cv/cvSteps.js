import {
  LayoutTemplate, ListOrdered, User, Lightbulb, GraduationCap, BookOpen, FlaskConical, School, Briefcase, Mic, Award,
  HandCoins, Users, HeartHandshake, BadgeCheck, Zap, Languages, Contact, SquarePlus,
} from "lucide-react";
import { CV_SECTIONS } from "../../lib/cv/model";

const len = key => d => d[key]?.length;
const titleOf = id => CV_SECTIONS.find(s => s.id === id).title;

// Editor steps for the Academic CV, in the same shape as the resume's SECTIONS in App.jsx.
// The editor order is fixed; the printed order is set on the Section Order step.
export const CV_STEPS = [
  { id: "template", label: "Template & Style", icon: LayoutTemplate, description: "Pick a layout, citation style and paper size. You can change these at any time." },
  { id: "layout", label: "Section Order", icon: ListOrdered, description: "Arrange the sections and hide any you don't want printed. Empty sections are left out automatically." },
  { id: "profile", label: "Header", icon: User, description: "Your name, contact details and academic profiles. No photo, date of birth or marital status." },
  { id: "interests", label: titleOf("interests"), icon: Lightbulb, description: "A short line or a list of keywords describing what you want to research.", count: d => d.interests?.keywords?.length || undefined },
  { id: "education", label: "Education", icon: GraduationCap, description: "Degrees, most recent first. Include your thesis title and supervisor where you have one.", count: len("education") },
  { id: "publications", label: "Publications", icon: BookOpen, description: "Add papers from a DOI or a BibTeX file, or type them in. They're grouped by status and printed in your chosen citation style.", count: len("publications") },
  { id: "research", label: "Research Experience", icon: FlaskConical, description: "Research roles, labs and projects. Lead each highlight with the method or result.", count: len("research") },
  { id: "teaching", label: "Teaching", icon: School, description: "Courses you've taught, assisted with or tutored.", count: len("teaching") },
  { id: "work", label: "Professional Experience", icon: Briefcase, description: "Industry roles. Keep them brief: research comes first on a CV.", count: len("work") },
  { id: "presentations", label: "Presentations", icon: Mic, description: "Talks and posters at conferences, workshops and seminars.", count: len("presentations") },
  { id: "awards", label: "Awards", icon: Award, description: "Awards, honours and scholarships.", count: len("awards") },
  { id: "grants", label: "Grants", icon: HandCoins, description: "Research funding and travel grants you've won.", count: len("grants") },
  { id: "memberships", label: "Memberships", icon: Users, description: "Professional and learned societies.", count: len("memberships") },
  { id: "service", label: "Service", icon: HeartHandshake, description: "Peer review, committees, organising, outreach and mentoring.", count: len("service") },
  { id: "certifications", label: "Certifications", icon: BadgeCheck, description: "Professional certifications and licences.", count: len("certifications") },
  { id: "skills", label: "Technical Skills", icon: Zap, description: "Group skills under plain headings such as Languages, Tools or Research Methods. No ratings.", count: len("skills") },
  { id: "languages", label: "Languages", icon: Languages, description: "Spoken languages and your level in each.", count: len("languages") },
  { id: "references", label: "References", icon: Contact, description: "Usually two or three academic referees, or a note that they're available on request.", count: d => d.references?.items?.length },
  { id: "custom", label: "Custom Sections", icon: SquarePlus, description: "Anything else: coursework, fieldwork, exhibitions, patents. Name the section and add entries.", count: len("customSections") },
];
