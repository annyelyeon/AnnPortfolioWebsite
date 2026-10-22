// Profile info shown across the site — edit here.
window.SITE = {
  name: "Yelyeon",
  initials: "Y.",
  avatar: "", // e.g. "images/profile.jpg" — falls back to initials when empty
  email: "lien020812@gmail.com",
  socials: {
    github: "https://github.com/annyelyeon",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
  },
  aboutShort: [
    "I'm an IT student who likes turning ideas into working web and mobile apps.",
    "Beyond the code, I'm curious about how systems fit together and the business thinking that makes technology worth building.",
  ],
  skills: ["HTML/CSS", "JavaScript", "React", "Kotlin", "Android", "Java", "Python", "SQL", "Git", "Figma", "Networking"],
};

// ---------------------------------------------------------------------------
// Sample content, used only while js/config.js has no Supabase keys.
// Once Supabase is connected, write posts and projects at /admin instead.
// ---------------------------------------------------------------------------
const sample = "_This is sample content. Connect Supabase and write real posts at **/admin**._";

window.PROJECTS = [
  { slug: "zoo-simulation-game", title: "Zoo Simulation Game", summary: "A Java simulation game for managing animals, habitats and daily zoo operations.", tech: ["Java", "OOP", "Game"], tint: "#d8ecd5", featured: true, content: sample },
  { slug: "android-habit-app", title: "Android Habit App", summary: "A mobile app for tracking daily habits with reminders and streaks.", tech: ["Kotlin", "Android", "Room"], tint: "#dcd6f7", featured: true, content: sample },
  { slug: "portfolio-website", title: "Portfolio Website", summary: "This site — a responsive, editorial-style portfolio with its own Supabase admin editor.", tech: ["HTML", "CSS", "Supabase"], tint: "#ffe3a6", featured: true, content: sample },
  { slug: "campus-network-lab", title: "Campus Network Lab", summary: "A simulated multi-VLAN campus network designed and tested in Packet Tracer.", tech: ["Cisco", "VLAN", "Routing"], tint: "#cfe6f2", featured: true, content: sample },
  { slug: "small-shop-dashboard", title: "Small Shop Dashboard", summary: "A web dashboard that turns sales data into simple insights for small businesses.", tech: ["React", "Chart.js", "API"], tint: "#f6d3d0", featured: true, content: sample },
  { slug: "study-planner", title: "Study Planner", summary: "A web app that breaks assignments into daily tasks around your deadlines.", tech: ["JavaScript", "LocalStorage", "UX"], tint: "#e4e0d8", featured: true, content: sample },
];

window.POSTS = [
  { slug: "portfolio-from-figma", title: "Building my portfolio from a Figma file", published_at: "2026-10-20", category: "blog", summary: "From design tokens to a responsive static site.", content: sample },
  { slug: "business-side-of-tech", title: "Why I care about the business side of tech", published_at: "2026-10-12", category: "thoughts", summary: "Good software solves a problem someone will pay for.", content: sample },
  { slug: "room-vs-sharedpreferences", title: "Room vs. SharedPreferences: what I learned", published_at: "2026-09-28", category: "blog", summary: "Picking the right storage on Android.", content: sample },
  { slug: "systems-thinking", title: "Systems thinking for students", published_at: "2026-09-15", category: "thoughts", summary: "Seeing the whole before the parts.", content: sample },
  { slug: "vlans-packet-tracer", title: "Setting up VLANs in Packet Tracer", published_at: "2026-09-02", category: "blog", summary: "A step-by-step lab walkthrough.", content: sample },
];
