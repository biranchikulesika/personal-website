import type { MotionProps } from 'motion/react';

export interface NewsletterPersonaConfig {
  persona: string;

  // Brand
  newsletterName: string;

  // Hero
  title: string;
  description: string;

  // Submitted state
  submittedLabel: string;
  submittedTitle: string;
  submittedDescription: string;

  // Expectations
  expectationsHeading: string;
  expectations: string[];
  bulletIcon: string;

  // Recent letters
  recentLettersHeading: string;
  recentLetters: { title: string; date: string }[];

  // Animation (overridable)
  motionInitial?: MotionProps['initial'];
  motionAnimate?: MotionProps['animate'];
  motionTransition?: MotionProps['transition'];
}

export const NEWSLETTER_PERSONA_CONFIGS: Record<string, NewsletterPersonaConfig> = {
  builder: {
    persona: 'builder',
    newsletterName: 'Forge Dispatch',
    title: 'Documenting the things I build, break, and understand.',
    description: 'Projects, systems, experiments, programming, and lessons learned while building.',
    submittedLabel: 'SUBSCRIBED',
    submittedTitle: 'You have been registered.',
    submittedDescription: 'Welcome to Forge Dispatch. Subscriptions are processed carefully.',
    expectationsHeading: '[ WHAT YOU WILL RECEIVE ]',
    expectations: ['Build logs', 'Experiments', 'Technical notes', 'Lessons learned'],
    bulletIcon: '•',
    recentLettersHeading: '[ RECENT LETTERS ]',
    recentLetters: [
      { title: 'Why I Keep Rebuilding My Notes System', date: 'May 20, 2026' },
      { title: 'Building Slower Interfaces', date: 'May 14, 2026' },
      { title: 'Designing Systems That Feel Human', date: 'May 08, 2026' },
    ],
    motionTransition: { duration: 0.8, ease: 'easeOut' },
  },
  operator: {
    persona: 'operator',
    newsletterName: 'Signal Reports',
    title: 'Observations from the systems that keep our worlds running.',
    description:
      'Infrastructure, cybersecurity, reliability, and digital systems — the things we rarely see but depend on.',
    submittedLabel: 'SUBSCRIBED',
    submittedTitle: 'Endpoint registration successful.',
    submittedDescription:
      'Welcome to Signal Reports. Your email address has been added to our quiet operational index.',
    expectationsHeading: '[ PACKET LOGS EXPECTED ]',
    expectations: ['Infrastructure observations', 'Security notes', 'Reliability lessons', 'System stories'],
    bulletIcon: '>',
    recentLettersHeading: '[ TRANSMISSION RECORD ]',
    recentLetters: [
      { title: 'An Inventory of Digital Defenses', date: 'May 22, 2026' },
      { title: 'The Mechanics of Silent Failures', date: 'May 12, 2026' },
      { title: 'Defending the Perimeter', date: 'April 28, 2026' },
    ],
  },
  thinker: {
    persona: 'thinker',
    newsletterName: 'inside the head',
    title: 'Reflections on awareness, meaning, and the strange mechanics of being human.',
    description:
      'Psychology, philosophy, and questions worth sitting with — an open-ended dialogue without quick conclusions.',
    submittedLabel: 'CONVERSATION JOINED',
    submittedTitle: 'You are registered.',
    submittedDescription:
      'Thank you for subscribing. Future reflections will arrive directly inside your head.',
    expectationsHeading: '[ WHAT TO EXPECT ]',
    expectations: ['Essays', 'Reflections', 'Journal fragments', 'Questions worth sitting with'],
    bulletIcon: '◇',
    recentLettersHeading: '[ PAST DIALOGUES ]',
    recentLetters: [
      { title: 'The Problem With Needing Closure', date: 'May 18, 2026' },
      { title: 'The Quiet Art of Unlearning', date: 'May 05, 2026' },
      { title: 'Attention Loss and Living Online', date: 'April 20, 2026' },
    ],
  },
  wanderer: {
    persona: 'wanderer',
    newsletterName: 'scribble',
    title: 'Letters worth keeping. Stories worth remembering.',
    description:
      'Travel notes, conversations, memories, and moments preserved before they disappear into the ordinary.',
    submittedLabel: 'MEMORANDUM FILED',
    submittedTitle: 'Letters registered.',
    submittedDescription:
      "Thank you for subscribing. Scribble's memories and observations will reach your inbox in due time.",
    expectationsHeading: '[ THE RECORD EXPECTED ]',
    expectations: ['Stories', 'Travel notes', 'Memory fragments', 'Observations'],
    bulletIcon: '✢',
    recentLettersHeading: '[ RECENT DRIFT ]',
    recentLetters: [
      { title: 'The Railway Platform at 5 AM', date: 'May 15, 2026' },
      { title: 'Conversations on the Night Train', date: 'April 30, 2026' },
      { title: 'A Quiet Cafe in Odisha', date: 'March 25, 2026' },
    ],
  },
};
