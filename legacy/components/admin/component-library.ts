/**
 * Component Library Configuration
 * ────────────────────────────────
 *
 * Add a new component by adding an entry to one of the `groups` arrays below.
 * Each entry requires:
 *   - name:        Display name shown in the sidebar
 *   - tag:         The HTML/React tag name to insert (e.g. 'Callout', 'div', 'blockquote')
 *   - props:       Default props object (e.g. { type: 'info' })
 *   - icon:        A Lucide icon component
 *   - description: Short description for the search/list view
 *   - selfClosing: Whether the tag is self-closing (<Tag />) or needs </Tag>
 *
 * The array is grouped by category for visual organization in the sidebar.
 */

import {
  Type,
  Video,
  Image as ImageIcon,
  TableProperties,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Link2,
  type LucideIcon,
} from 'lucide-react';

/** A single component entry in the library */
export interface ComponentEntry {
  /** Display name (shown in sidebar) */
  name: string;
  /** The tag name to insert (e.g. 'Callout', 'blockquote', 'pre') */
  tag: string;
  /** Default key-value props injected into the tag */
  props: Record<string, string>;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Short description shown below the name */
  description: string;
  /** If true, inserts as <Tag />. If false, inserts as <Tag>...</Tag> */
  selfClosing: boolean;
  /** Optional category/group for visual separation */
  group?: string;
}

export interface ComponentGroup {
  /** Group label shown as a section header */
  label: string;
  /** Components in this group */
  items: ComponentEntry[];
}

/**
 * Component library groups.
 *
 * ── TO ADD A NEW COMPONENT ──
 * Add an object to the appropriate `items` array. For example:
 *
 * ```ts
 * { name: 'Terminal', tag: 'Terminal', props: {}, icon: Terminal, description: 'Terminal output block', selfClosing: false, group: 'blocks' }
 * ```
 *
 * Then import the icon from 'lucide-react' and add it above.
 */
export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    label: 'Embeds',
    items: [
      {
        name: 'YouTube',
        tag: 'YouTube',
        props: { id: 'dQw4w9WgXcQ' },
        icon: Video,
        description: 'Embed a YouTube video',
        selfClosing: true,
      },
      {
        name: 'Image',
        tag: 'Image',
        props: { path: 'path/to/image.jpg', alt: 'Description' },
        icon: ImageIcon,
        description: 'MDX native image',
        selfClosing: true,
      },
      {
        name: 'Callout',
        tag: 'Callout',
        props: { type: 'info' },
        icon: Type,
        description: 'Highlighted info box',
        selfClosing: false,
      },
    ],
  },
  {
    label: 'Structure',
    items: [
      {
        name: 'Table',
        tag: 'table',
        props: {},
        icon: TableProperties,
        description: 'Standard HTML table',
        selfClosing: false,
      },
      {
        name: 'Blockquote',
        tag: 'blockquote',
        props: {},
        icon: Quote,
        description: 'Standard blockquote',
        selfClosing: false,
      },
      {
        name: 'Pre',
        tag: 'pre',
        props: {},
        icon: Code,
        description: 'Code block wrapper',
        selfClosing: false,
      },
      {
        name: 'Horizontal Rule',
        tag: 'hr',
        props: {},
        icon: Minus,
        description: 'Thematic break',
        selfClosing: true,
      },
      {
        name: 'Link',
        tag: 'a',
        props: { href: 'https://example.com' },
        icon: Link2,
        description: 'Hyperlink',
        selfClosing: false,
      },
    ],
  },
  {
    label: 'Headings',
    items: [
      {
        name: 'Heading 1',
        tag: 'h1',
        props: {},
        icon: Heading1,
        description: 'Main page heading',
        selfClosing: false,
      },
      {
        name: 'Heading 2',
        tag: 'h2',
        props: {},
        icon: Heading2,
        description: 'Section heading',
        selfClosing: false,
      },
      {
        name: 'Heading 3',
        tag: 'h3',
        props: {},
        icon: Heading3,
        description: 'Subsection heading',
        selfClosing: false,
      },
    ],
  },
  {
    label: 'Lists',
    items: [
      {
        name: 'Unordered List',
        tag: 'ul',
        props: {},
        icon: List,
        description: 'Bulleted list',
        selfClosing: false,
      },
      {
        name: 'Ordered List',
        tag: 'ol',
        props: {},
        icon: ListOrdered,
        description: 'Numbered list',
        selfClosing: false,
      },
    ],
  },
];

/**
 * Flat list of all components (for search/filter).
 * Auto-generated from COMPONENT_GROUPS so you never need to maintain two lists.
 */
export const ALL_COMPONENTS: ComponentEntry[] = COMPONENT_GROUPS.flatMap(
  (group) => group.items
);
