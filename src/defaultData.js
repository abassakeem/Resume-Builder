export const defaultData = {
  selectedTemplate: 1,
  headings: {
    work: "Work Experience",
    skills: "Technical Strengths",
    education: "Education",
    projects: "Projects",
  },
  basics: {
    name: "YOUR NAME",
    phone: "+1 (555) 000-0000",
    email: "your@email.com",
    location: { address: "City, Country" },
    website: "https://yourwebsite.com",
  },
  education: [
    {
      institution: "University Name",
      studyType: "BSc",
      area: "Computer Science",
      startDate: "September 2019",
      endDate: "June 2022",
      gpa: "",
      location: "City, State",
    },
  ],
  work: [
    {
      company: "Company Name",
      position: "Your Role",
      location: "City",
      startDate: "Jan 2023",
      endDate: "Present",
      highlights: ["Describe your key achievement or responsibility here."],
    },
  ],
  skills: [
    {
      name: "Category",
      keywords: ["Skill 1", "Skill 2", "Skill 3"],
    },
  ],
  projects: [
    {
      name: "Project Name",
      url: "https://project.com",
      keywords: ["React", "Node.js"],
      description: "Brief description of what the project does and your impact.",
    },
  ],
};
