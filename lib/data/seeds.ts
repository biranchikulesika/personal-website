// Seed data for the mock database.
//
// All dynamic content lives here so the UI can consume it through the
// service layer. Replace these values as real content is defined. Every
// value is intentionally provisional.

import type {
  BlogPost,
  BookItem,
  NoteItem,
  NowEntry,
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
            { label: 'GitHub', href: 'https://github.com/biranchikulesika' },
            { label: 'Email', href: 'mailto:hello@biranchi.com' },
          ],
        },
        {
          title: 'Social',
          links: [
            { label: 'LinkedIn', href: 'https://www.linkedin.com' },
            { label: 'Instagram', href: 'https://www.instagram.com' },
            { label: 'Twitter', href: 'https://x.com' },
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
      date: 'Mar 12, 2026',
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
      date: 'Feb 18, 2026',
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
      date: 'Jan 24, 2026',
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
      date: 'Dec 9, 2025',
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
      date: 'Nov 14, 2025',
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
      link: 'https://en.wikipedia.org/wiki/The_Shallows_(book)',
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
      cover: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Technopoly_cover.jpg',
      link: 'https://en.wikipedia.org/wiki/Technopoly',
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
      cover: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Thinking_in_Systems_cover.jpg',
      link: 'https://en.wikipedia.org/wiki/Thinking_in_Systems',
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
    persona: 'builder',
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

function attentionPost(): BlogPost {
  return {
    slug: 'attention-as-a-material',
    title: 'Attention as a material',
    description:
      'Treating focus the way a craftsperson treats their material — with care, patience, and respect for its limits.',
    persona: 'thinker',
    tags: ['Attention', 'Craft'],
    plantedAt: 'Feb 12, 2026',
    lastTendedAt: 'Aug 20, 2026',
    assumedAudience:
      'People who work with their minds and want to protect the quality of their focus.',
    intro: [
      'A craftsperson treats their material with care: they learn its grain, its limits, and the conditions under which it works best. Wood has a grain. Metal has a temper. Attention has a texture too — it thickens, thins, and breaks under the wrong kind of pressure.',
      'This essay is about learning to treat attention the way a craftsperson treats their material: not as an infinite resource to be spent, but as a finite one to be shaped.',
    ],
    sections: [
      {
        id: 'the-grain-of-attention',
        heading: 'The grain of attention',
        paragraphs: [
          'Every material has a grain — a direction in which it works best. Attention is no different. There are hours when focus comes easily, and hours when it resists. The craftsperson does not fight the grain; they work with it.^[1]',
          'The practical implication is simple: schedule demanding work when attention is sharpest, and save routine tasks for when it dulls. This is not productivity advice. It is a form of respect for the material you are working with.',
        ],
        footnotes: [
          'Attention, like wood, has a direction. Working against it produces splintered results; working with it produces clean ones.',
        ],
      },
      {
        id: 'the-cost-of-context-switching',
        heading: 'The cost of context switching',
        paragraphs: [
          'Every time you switch tasks, you pay a tax. The research is consistent: it takes roughly twenty minutes to fully re-engage with deep work after an interruption.^[2] The cost is not just time — it is quality. The mind that returns to a task after interruption is a different mind than the one that left it.',
          'This is why protecting attention is not a luxury. It is a structural requirement for work that matters. You cannot make good things with fractured focus, any more than you can make a clean cut with a dull blade.',
        ],
        footnotes: [
          'Gloria Mark, "Attention Span: A Groundbreaking Way to Restore Balance, Happiness and Productivity" (2023). The twenty-minute figure is a commonly cited average; the actual recovery time varies by task complexity.',
        ],
      },
      {
        id: 'practical-protections',
        heading: 'Practical protections',
        paragraphs: [
          'The protections are mundane but effective: close the tabs, silence the notifications, set a timer, and work on one thing at a time. None of this is revolutionary. The hard part is not knowing what to do — it is doing it consistently.',
          'I have found that the most useful habit is treating attention as something you lend, not something you own. You lend it to the task at hand, and you take it back when the task is done. The discipline is in not lending it to things that do not deserve it.',
        ],
        quote: {
          text: 'Attention is the rarest form of generosity.',
          attribution: 'Simone Weil',
        },
      },
    ],
    books: [],
  };
}

function fallbackPost(item: WritingItem): BlogPost {
  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    persona: item.persona,
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
  const attention = attentionPost();
  const bySlug = new Map<string, BlogPost>(
    seedWriting().items.map((item) => [item.slug, fallbackPost(item)]),
  );
  bySlug.set(featured.slug, featured);
  bySlug.set(attention.slug, attention);
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

// Now page timeline ----------------------------------------------------------

export function seedNow(): NowEntry[] {
  return [
    {
      id: 'now-003',
      title: 'August 2026',
      date: '2026-08',
      content:
        'I’m writing this during a quiet evening in Odisha, India. The monsoon has settled into a gentle cadence, and the air is heavy with the smell of wet earth and night-blooming jasmine. I have a fresh cup of tea on the desk and a few uninterrupted hours to think clearly for the first time in weeks.\n\nLately, my mind has been consumed by a paradox: we are living through an unprecedented acceleration in software capabilities. AI agents write code, orchestrate workflows, and generate interfaces in seconds. And yet, the human side of software — the clarity of thought, the respect for attention, the patience to understand why something works — feels more endangered than ever.\n\nIt is easy to get caught up in the panic of continuous output. But when generation becomes cheap, discernment becomes priceless. I find myself returning to fundamental questions: What kind of digital spaces actually nurture deep thinking? How do we build tools that act as quiet bicycles for the mind rather than slot machines for our dopamine receptors?\n\n> When software generation becomes effortless, the only real currency left is deliberate attention and genuine craft.\n\nTo ground these thoughts, I’ve been reading Nicholas Carr’s classic examination of how digital mediums alter neuroplasticity and reading depth.\n\n<Book title="The Shallows" author="Nicholas Carr" year="2025" description="How the internet reshapes our neural pathways, fracturing attention and trading contemplative depth for rapid, superficial information skimming." link="https://en.wikipedia.org/wiki/The_Shallows_(book)" />\n\n<Book title="Economics: The User’s Guide" author="Ha-Joon Chang" year="2025" description="A lucid, pluralistic guide through classical, Keynesian, institutionalist, and Marxist economic schools, explaining how markets really work." />\n\nAlongside technology, I’ve also been trying to better understand the economic structures that govern human work and leisure. It feels irresponsible to watch automation reshape the labour market without understanding the fundamental mechanisms of value and distribution.\n\nOn this website, I’ve been rebuilding everything from first principles. Stripping away unnecessary frameworks, simplifying layouts, and making sure every component has breathing room and purpose.',
    },
    {
      id: 'now-002',
      title: 'January 2026',
      date: '2026-01',
      content:
        'Entered the new year with a resolution to write more things down in public. For years, I kept notebooks filled with half-formed observations and architectural sketches that never saw the light of day because they weren’t “finished enough.”\n\nI created Scribble as an antidote to that hesitation. It is designed not as a chronological feed of hot takes, but as a digital garden — a place where notes can start small, get tended slowly over time, and evolve alongside my own understanding.\n\nDuring the winter break, I spent hours immersed in Donella Meadows’ masterpiece on systems theory. It has permanently altered how I view software architecture, teams, and feedback loops.\n\n> Quality is a trade: you give up speed and the comfort of “done,” and in return you get work that can be revisited with pride.\n\n<Book title="Thinking in Systems" author="Donella Meadows" year="2023" description="A primer on seeing wholes rather than isolated parts, understanding stocks and flows, and finding leverage points in complex systems." cover="/thinking-in-systems.jpg" link="https://en.wikipedia.org/wiki/Thinking_in_Systems" />\n\nI’m learning that the fastest way to build something durable is to slow down, protect morning hours for deep focus, and reject the temptation to optimize prematurely.',
    },
    {
      id: 'now-001',
      title: 'August 2025',
      date: '2025-08',
      content:
        'A year ago, I began stepping back from mainstream social media platforms. The algorithmic feeds were taking more mental bandwidth than they gave back in genuine insight.\n\nI started exploring the IndieWeb movement and reading about personal digital gardens. There is something deeply restorative about owning your own space on the web — choosing your own typography, crafting your own layouts, and sharing writing directly with people without intermediaries.\n\n<Book title="Technopoly" author="Neil Postman" year="2024" description="A prophetic inquiry into what happens when culture surrenders unconditionally to technology, efficiency, and invisible technological imperatives." link="https://en.wikipedia.org/wiki/Technopoly" />\n\nThis space began as a quiet sketch. It remains a work in progress, and that is precisely the point.',
    },
  ];
}