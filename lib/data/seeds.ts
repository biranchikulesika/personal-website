// Seed data for the mock database.
//
// All dynamic content lives here so the UI can consume it through the
// service layer. Replace these values as real content is defined. Every
// value is intentionally provisional.

import type {
  BlogPost,
  BookItem,
  NoteItem,
  PageContent,
  SectionGroup,
  SiteContent,
  WritingItem,
} from '@/lib/types';

// Site-level content (identity, nav, hero, footer) ----------------------------

export function seedSiteContent(): SiteContent {
  return {
    identity: {
      name: 'Biranchi Kulesika',
      initials: 'BK',
    },
    nav: {
      links: [
        { label: 'Scribble', href: '/scribble' },
        { label: 'Library', href: '/library' },
        { label: 'Now', href: '/now' },
        { label: 'About', href: '/about' },
      ],
    },
    hero: {
      greeting: "HI, I'M BIRANCHI",
      name: '',
      headline: "I build things nobody asked for, and write about things I can't stop thinking about.",
      supporting: '',
      points: [
        'Learning, questioning, unlearning, and occasionally figuring things out',
      ],
      newsletter: {
        note: 'Thoughts, systems, stories, and ideas that stay with me long enough to write about.',
        placeholder: 'Your best email',
        button: 'Subscribe',
      },
      image: {
        src: '/biranchi.jpeg',
        alt: 'A portrait of Biranchi Kulesika',
      },
    },
    footer: {
      bio: {
        intro: 'I’m Biranchi Kulesika.',
        paragraphs: [
          'An aspiring software developer by day, a cybersecurity enthusiast by night, and a student of philosophy whenever I’m confused.',
          "I build things to understand them, write things down so I don't forget them, and question things that seem too obvious to question.",
          'I care about curiosity, independence, thoughtful technology, and making things with intention rather than simply making more things.',
          'The web is already loud enough. I’d rather make my little corner of it quieter.',
        ],
      },
      columns: [
        {
          title: 'Explore',
          links: [
            { label: 'Scribble', href: '/scribble' },
            { label: 'Library', href: '/library' },
            { label: 'Support', href: '/support' },
          ],
        },
        {
          title: 'Elsewhere',
          links: [
            { label: 'Now', href: '/now' },
            { label: 'About', href: '/about' },
            { label: 'Admin', href: '/admin' },
            { label: 'GitHub', href: 'https://github.com/biranchikulesika' },
            { label: 'Email', href: 'mailto:hello@biranchi.com' },
          ],
        },
      ],
      bottom: '© 2026 Biranchi Kulesika. Built by hand, slowly.',
    },
  };
}

// Homepage sections -----------------------------------------------------------

function writingItems(): WritingItem[] {
  return [
    {
      id: 'writing-001',
      slug: 'building-in-public-carefully',
      persona: 'builder',
      title: 'Building in public, carefully',
      description:
        'What it looks like to share unfinished work without performing it.',
      date: 'Mar 3, 2026',
      tags: ['Craft', 'Attention', 'The web'],
    },
    {
      id: 'writing-002',
      slug: 'attention-as-a-material',
      persona: 'thinker',
      title: 'Attention as a material',
      description:
        'Treating focus the way a craftsperson treats their material.',
      date: 'Feb 12, 2026',
      tags: ['Attention', 'Craft'],
    },
    {
      id: 'writing-003',
      slug: 'the-web-as-a-garden',
      persona: 'wanderer',
      title: 'The web as a garden',
      description:
        'On tending a corner of the internet instead of farming an audience.',
      date: 'Jan 16, 2026',
      tags: ['The web', 'Craft'],
    },
    {
      id: 'writing-004',
      slug: 'small-tools-over-big-platforms',
      persona: 'builder',
      title: 'Small tools over big platforms',
      description:
        'Why simpler software often respects your attention more.',
      date: 'Dec 8, 2025',
      tags: ['Tools', 'Attention'],
    },
    {
      id: 'writing-005',
      slug: 'the-slow-web',
      persona: 'wanderer',
      title: 'The slow web',
      description:
        'A gentler pace for the personal internet, and why speed is not the only virtue.',
      date: 'Nov 14, 2025',
      tags: ['The web', 'Attention'],
    },
    {
      id: 'writing-006',
      slug: 'notes-on-feedback',
      persona: 'operator',
      title: 'Notes on good feedback',
      description:
        'What makes critique useful instead of corrosive, for both the giver and the receiver.',
      date: 'Oct 9, 2025',
      tags: ['Craft', 'Communication'],
    },
    {
      id: 'writing-007',
      slug: 'tools-that-respect-you',
      persona: 'builder',
      title: 'Tools that respect you',
      description:
        'Software as a relationship rather than a transaction, and what respect looks like in practice.',
      date: 'Sep 18, 2025',
      tags: ['Tools', 'Attention'],
    },
    {
      id: 'writing-008',
      slug: 'what-redesigning-taught-me',
      persona: 'builder',
      title: 'What redesigning taught me',
      description:
        'Lessons from tearing the website down and rebuilding it from first principles.',
      date: 'Aug 26, 2025',
      tags: ['Craft', 'The web'],
    },
    {
      id: 'writing-009',
      slug: 'the-case-for-boring-tech',
      persona: 'thinker',
      title: 'The case for boring technology',
      description:
        'Why stable, unglamorous tools keep winning, and what that says about craft.',
      date: 'Jul 31, 2025',
      tags: ['Tools', 'Craft'],
    },
  ];
}

function noteItems(): NoteItem[] {
  return [
    {
      id: 'note-001',
      slug: 'on-writing-things-down',
      persona: 'thinker',
      title: 'On writing things down',
      description: 'Why the act of writing down an idea usually is the idea.',
      content: [
        'Writing something down is not a copy of the thought. It is the thought, made inspectable.',
        'Until it is written, an idea is mostly a feeling — an intuition that something is there. Writing forces that intuition to take shape, and shape is where the real thinking happens.',
        'This is why notes beat memory. Memory is a feeling. A note is evidence.',
      ],
      date: 'Mar 2026',
      tags: ['Craft', 'Attention'],
    },
    {
      id: 'note-002',
      slug: 'what-i-have-been-reading',
      persona: 'wanderer',
      title: 'What I’ve been reading lately',
      description: 'A short list of books and essays currently on the desk.',
      content: [
        'A running list, in no particular order, of what is currently on the desk.',
        'The Shallows, by Nicholas Carr. Stolen Focus, by Johann Hari. And a handful of essays about attention and craft that I keep coming back to.',
        'Reading in small, deliberate sessions has been more useful than trying to keep pace with everything.',
      ],
      date: 'Feb 2026',
      tags: ['Reading'],
    },
    {
      id: 'note-003',
      slug: 'revisiting-old-work',
      persona: 'operator',
      title: 'Revisiting old work',
      description: 'What a year-old draft teaches when you finally reread it.',
      content: [
        'A year ago I wrote something I was proud of. Reading it now, the parts that felt sharp look obvious, and the parts I rushed look rushed.',
        'The lesson is not that the work was bad. It is that time is a better editor than intention.',
        'Revisiting old work is a way of seeing how far the standard has moved — and whether you have actually moved it.',
      ],
      date: 'Jan 2026',
      tags: ['Craft'],
    },
    {
      id: 'note-004',
      slug: 'a-small-thought-about-feedback',
      persona: 'operator',
      title: 'A small thought about feedback',
      description: 'Giving feedback is an act of attention before it is an act of judgment.',
      content: [
        'Feedback fails most often because it skips straight to judgment. The better order is attention first: say what the work is doing, then what it could do differently.',
        'When someone knows you actually read their work, the criticism lands as care rather than as correction.',
      ],
      date: 'Dec 2025',
      tags: ['Communication', 'Craft'],
    },
    {
      id: 'note-005',
      slug: 'what-caring-about-quality-costs',
      persona: 'thinker',
      title: 'What caring about quality costs',
      description: 'Quality is a trade, not a preference. The price is usually time.',
      content: [
        'Quality is not a taste you are born with. It is a trade: you give up speed, scope, and the comfort of done, and you get work that holds up.',
        'The price is usually time, but the time is not wasted. It is the difference between finishing something and finishing something that can be revisited.',
        'Cheap work is expensive in the only currency that matters: the attention of the people you respect.',
      ],
      date: 'Nov 2025',
      tags: ['Craft', 'Attention'],
    },
  ];
}

function bookItems(): BookItem[] {
  return [
    {
      id: 'book-001',
      slug: 'the-shallows',
      persona: 'thinker',
      title: 'The Shallows',
      author: 'Nicholas Carr',
      description: 'How the internet reshapes the way we read, remember, and think.',
      date: '2025',
      tags: ['The web', 'Attention'],
    },
    {
      id: 'book-002',
      slug: 'deep-work',
      persona: 'builder',
      title: 'Deep Work',
      author: 'Cal Newport',
      description: 'Focused, distraction-free work as a rare and increasingly valuable craft.',
      date: '2025',
      tags: ['Attention', 'Craft'],
    },
    {
      id: 'book-003',
      slug: 'technopoly',
      persona: 'thinker',
      title: 'Technopoly',
      author: 'Neil Postman',
      description: 'On surrendering culture to technology, efficiency, and invisible ideology.',
      date: '2024',
      tags: ['The web', 'Tools'],
    },
    {
      id: 'book-004',
      slug: 'the-sense-of-style',
      persona: 'operator',
      title: 'The Sense of Style',
      author: 'Steven Pinker',
      description: 'The craft of clear prose, explained with wit, reason, and linguistic evidence.',
      date: '2024',
      tags: ['Craft', 'Writing'],
    },
    {
      id: 'book-005',
      slug: 'thinking-in-systems',
      persona: 'thinker',
      title: 'Thinking in Systems',
      author: 'Donella Meadows',
      description: 'A classic primer on seeing loops, feedback, and the whole instead of isolated parts.',
      date: '2023',
      tags: ['Systems', 'Craft'],
    },
    {
      id: 'book-006',
      slug: 'plain-text',
      persona: 'builder',
      title: 'Plain Text',
      author: 'Dennis Tenen',
      description: 'Why the simplest, quietest digital formats may outlast the grandest platforms.',
      date: '2023',
      tags: ['Tools', 'The web'],
    },
    {
      id: 'book-007',
      slug: 'show-your-work',
      persona: 'wanderer',
      title: 'Show Your Work!',
      author: 'Austin Kleon',
      description: 'Ten ways to share your creativity and get discovered by being generous with your process.',
      date: '2024',
      tags: ['Creativity', 'Craft'],
    },
    {
      id: 'book-008',
      slug: 'design-of-everyday-things',
      persona: 'builder',
      title: 'The Design of Everyday Things',
      author: 'Don Norman',
      description: 'Fundamental principles of intuitive usability, affordances, and human-centered design.',
      date: '2023',
      tags: ['Design', 'Tools'],
    },
    {
      id: 'book-009',
      slug: 'zen-motorcycle-maintenance',
      persona: 'thinker',
      title: 'Zen and the Art of Motorcycle Maintenance',
      author: 'Robert M. Pirsig',
      description: 'An inquiry into values, technology, and what it truly means to care about quality.',
      date: '2022',
      tags: ['Philosophy', 'Craft'],
    },
    {
      id: 'book-010',
      slug: 'working-in-public',
      persona: 'builder',
      title: 'Working in Public',
      author: 'Nadia Eghbal',
      description: 'The making and maintenance of open source software and digital commons.',
      date: '2024',
      tags: ['The web', 'Tools'],
    },
    {
      id: 'book-011',
      slug: 'stolen-focus',
      persona: 'thinker',
      title: 'Stolen Focus',
      author: 'Johann Hari',
      description: 'Why you can’t pay attention — and how to think about attention as a collective right.',
      date: '2025',
      tags: ['Attention'],
    },
    {
      id: 'book-012',
      slug: 'bird-by-bird',
      persona: 'wanderer',
      title: 'Bird by Bird',
      author: 'Anne Lamott',
      description: 'Some instructions on writing and life — taking things one small step at a time.',
      date: '2023',
      tags: ['Writing', 'Craft'],
    },
  ];
}

export function seedWriting(): SectionGroup<WritingItem> {
  return {
    title: 'Writing',
    href: '/writing',
    subheader: 'Longer pieces and reflections on the web, craft, and digital life.',
    items: writingItems(),
  };
}

export function seedNotes() {
  return {
    title: 'Notes',
    href: '/notes',
    subheader: 'Short-form observations, half-formed, shared as they come.',
    items: noteItems(),
  };
}

export function seedBooks(): SectionGroup<BookItem> {
  return {
    title: 'Library',
    href: '/library',
    subheader:
      'Books that have shaped thinking — read, on the shelf, or somewhere in between.',
    items: bookItems(),
  };
}

// Blog posts -----------------------------------------------------------------

function featuredPost(): BlogPost {
  return {
    slug: 'building-in-public-carefully',
    title: 'Building in public, carefully',
    description:
      'What it looks like to share unfinished work without turning the process into a performance.',
    tags: ['Craft', 'Attention', 'The web'],
    plantedAt: 'Mar 3, 2026',
    lastTendedAt: 'Aug 21, 2026',
    assumedAudience:
      'People who share work online and want to keep the process honest — without performing the making of it.',
    intro: [
      'There is a version of building in public that is simply showing your work: the drafts, the dead ends, the small decisions, shared as they happen. And there is another version, the one that has hardened into a genre, where the work is staged for an audience and the process becomes the product.',
      'This essay is an attempt to hold on to the first version. It is a set of notes on sharing unfinished work with care — care for the work itself, for the people reading, and for the quiet attention that good work seems to require.',
    ],
    sections: [
      {
        id: 'on-sharing-before-finished',
        heading: 'On sharing before it’s finished',
        paragraphs: [
          'Sharing unfinished work is a discipline of exposure. It means letting people see the scaffolding, the loose threads, and the parts that do not fit yet. The temptation is to wait until the thing is presentable, and then to present it as if it had arrived fully formed.',
          'But waiting until something is finished has a cost. It hides the most useful part of the process — the part where the shape is still negotiable, where a good question from a reader can still change the direction of the work. The early draft is where other people can actually help.',
        ],
        figure: {
          src: 'https://picsum.photos/seed/biranchi-post-notes/1200/750',
          alt: 'A notebook page with crossing revisions',
          caption: 'Drafts are where the shape is still negotiable.',
        },
      },
      {
        id: 'the-performance-trap',
        heading: 'The performance trap',
        paragraphs: [
          'The trouble begins when sharing stops being an act of exposure and becomes an act of staging. The difference is subtle: exposure reveals the work; staging reveals the sharer. The first is useful to the reader. The second is useful to no one, and it slowly corrodes the maker.',
          'When every small step is narrated, the work itself recedes. The audience starts to expect a running commentary, and the maker starts to optimise for the commentary rather than the work. The result is content about work, produced instead of work.^[1]',
        ],
        footnotes: [
          'The distinction is not original to me — the idea that coverage can crowd out the thing covered appears across a long line of writing about media and attention.',
        ],
      },
      {
        id: 'careful-public-building',
        heading: 'Careful public building',
        paragraphs: [
          'Care, in this context, is mostly a matter of editing. Edit what you share the way you would edit a sentence: cut what is not needed, keep what carries weight, and resist the urge to narrate every intermediate step.',
          'A careful post is one that knows why it exists. It is not a status update; it is a finding. It has a point, it makes it, and it leaves the reader with something they did not have before — a question, a technique, or a better sense of where the work is going.',
        ],
        quote: {
          text: 'Show the work, not the self. The work is the thing worth attention; the self is only the weather it happens in.',
          attribution: 'A working principle I keep returning to',
        },
      },
      {
        id: 'the-garden-not-the-farm',
        heading: 'The garden, not the farm',
        paragraphs: [
          'The farm metaphor for audiences treats sharing as cultivation for harvest: plant, water, and eventually sell. The garden metaphor treats it differently. A garden is tended for its own sake. Some of what grows is shared; some is kept; some is simply allowed to compost back into the soil.',
          'I prefer the garden because it keeps the scale honest. A garden does not need to feed a crowd. It needs to feed the people who actually show up, and to remain a place the gardener wants to keep working in.',
        ],
      },
      {
        id: 'a-few-working-rules',
        heading: 'A few working rules',
        paragraphs: [
          'The rules I am converging on are simple enough to write down and hard enough to keep: share findings, not updates; let work sit before publishing it; respond to the reader, not the algorithm;^[2] and treat every post as a draft that can be revised later.',
          'None of these are new. They are, I suspect, what most people mean when they say they want to build in public — if they take the time to say it carefully.',
        ],
        footnotes: [
          'An algorithm is just a reader with a very large appetite and no taste.',
        ],
      },
    ],
    books: [
      {
        title: 'The Craftsman',
        author: 'Richard Sennett',
        note: 'On the ethics of doing work well for its own sake.',
      },
      {
        title: 'Stolen Focus',
        author: 'Johann Hari',
        note: 'A useful map of everything competing for attention.',
      },
      {
        title: 'The Sense of Style',
        author: 'Steven Pinker',
        note: 'For the discipline of saying things plainly and well.',
      },
    ],
  };
}

function fallbackPost(item: WritingItem): BlogPost {
  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    tags: item.tags,
    plantedAt: item.date,
    lastTendedAt: item.date,
    assumedAudience: 'Anyone curious about this topic.',
    intro: [item.description],
    sections: [],
    books: [],
  };
}

export function seedPosts(): BlogPost[] {
  const featured = featuredPost();
  const bySlug = new Map<string, BlogPost>(
    seedWriting().items.map((item) => [item.slug, fallbackPost(item)]),
  );
  bySlug.set(featured.slug, featured);
  return seedWriting().items.map((item) => bySlug.get(item.slug)!);
}

// Structural pages -----------------------------------------------------------

export function seedPages(): PageContent[] {
  return [
    {
      slug: 'library',
      title: 'Library',
      description: 'Library page placeholder.',
      content:
        'This page will contain books read and books on the shelf — what has shaped thinking and what still needs to.',
    },
    {
      slug: 'now',
      title: 'Now',
      description: 'Now page placeholder.',
      content:
        'This page will contain a snapshot of what currently has Biranchi’s attention — building, learning, reading, exploring.',
    },
    {
      slug: 'about',
      title: 'About',
      description: 'About page placeholder.',
      content:
        'This page will explain who Biranchi is, what he does, and how his work and interests connect.',
    },
  ];
}