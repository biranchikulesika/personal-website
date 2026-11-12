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
    greeting: "",
    name: "",
    headline: "Developer, writer, thinker.",
    supporting:
      "I build things nobody asked for, and write about things I can't stop thinking about.",
    points: [],
    newsletter: {
      note: "An essay when it's ready, plus short notes from what I'm building and reading. No spam, no schedule, unsubscribe anytime.",
      placeholder: "Your email address",
      button: "Subscribe",
    },
    image: {
      src: "/biranchi.webp",
      alt: "A portrait of Biranchi Kulesika",
    },
    gallery: [
      {
        src: "/biranchi.webp",
        alt: "A portrait of Biranchi Kulesika",
      },
      {
        src: "/biranchi-2.jpeg",
        alt: "Biranchi Kulesika",
      },
      {
        src: "/biranchi-3.jpeg",
        alt: "Biranchi Kulesika",
      },
      {
        src: "/biranchi-4.jpeg",
        alt: "Biranchi Kulesika",
      },
    ],
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
