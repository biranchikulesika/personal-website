// Site configuration: hardcoded, not stored in the database.
// All site-level identity, navigation, hero, and footer content lives here.

import type { SiteContent } from "@/lib/types";

export const SITE_CONFIG: SiteContent = {
  identity: {
    name: "Biranchi Kulesika",
    initials: "BK",
  },
  nav: {
    links: [
      { label: "Scribble", href: "/scribble" },
      { label: "Library", href: "/library" },
      { label: "Now", href: "/now" },
      { label: "About", href: "/about" },
    ],
  },
  hero: {
    greeting: "HI, I'M BIRANCHI",
    name: "",
    headline:
      "I build things nobody asked for, and write about things I can't stop thinking about.",
    supporting: "",
    points: [
      "Learning, questioning, unlearning, and occasionally figuring things out",
    ],
    newsletter: {
      note: "Thoughts, systems, stories, and ideas that stay with me long enough to write about.",
      placeholder: "Your email address",
      button: "Subscribe",
    },
    image: {
      src: "/biranchi.webp",
      alt: "A portrait of Biranchi Kulesika",
    },
  },
  footer: {
    bio: {
      intro: "I'm Biranchi Kulesika.",
      paragraphs: [
        "An aspiring software developer by day, a cybersecurity enthusiast by night, and a student of philosophy whenever I\u2019m confused.",
        "I build things to understand them, write things down so I don't forget them, and question things that seem too obvious to question.",
      ],
    },
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Scribble", href: "/scribble" },
          { label: "Library", href: "/library" },
          { label: "Support", href: "/support" },
        ],
      },
      {
        title: "Elsewhere",
        links: [
          { label: "Now", href: "/now" },
          { label: "About", href: "/about" },
          { label: "Email", href: "mailto:biranchi@kulesika.in" },
        ],
      },
      {
        title: "Social",
        links: [
          { label: "X/Twitter", href: "https://x.com/BKulesika" },
          { label: "LinkedIn", href: "https://linkedin.com/in/biranchikulesika" },
          { label: "More", href: "https://kulesika.in" },
        ],
      },
    ],
    bottom: "\u00a9 2026 Biranchi Kulesika.",
  },
};
