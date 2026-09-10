'use client';

import React, { useState } from 'react';

export interface ComponentEntry {
  name: string;
  tag: string;
  snippet: string;
  group: 'Embeds' | 'Structure' | 'Callouts';
  icon: string;
}

export interface ComponentGroup {
  label: 'Embeds' | 'Structure' | 'Callouts';
  items: ComponentEntry[];
}

export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    label: 'Embeds',
    items: [
      {
        name: 'Image',
        tag: 'Image',
        snippet: '![Alt Text](https://image-url.com/image.jpg "Image Caption")',
        group: 'Embeds',
        icon: '🖼',
      },
      {
        name: 'Image (MDX)',
        tag: 'Image',
        snippet: '<Image src="https://image-url.com/image.jpg" alt="Description" caption="Caption text" />',
        group: 'Embeds',
        icon: '🖼',
      },
      {
        name: 'YouTube',
        tag: 'YouTube',
        snippet: '<YouTube id="dQw4w9WgXcQ" />',
        group: 'Embeds',
        icon: '▶',
      },
      {
        name: 'Media Asset',
        tag: 'Media',
        snippet: '',
        group: 'Embeds',
        icon: '📁',
      },
      {
        name: 'Book Card',
        tag: 'Book',
        snippet: '<Book title="The Shallows" author="Nicholas Carr" year="2025" description="A short note about the book." cover="https://covers.openlibrary.org/b/id/8119836-L.jpg" link="https://example.com" />',
        group: 'Embeds',
        icon: '📖',
      },
      {
        name: 'Essay Embed',
        tag: 'Post',
        snippet: '',
        group: 'Embeds',
        icon: '📄',
      },
      {
        name: 'Note Embed',
        tag: 'Note',
        snippet: '',
        group: 'Embeds',
        icon: '📝',
      },
    ],
  },
  {
    label: 'Structure',
    items: [
      {
        name: 'Heading 2',
        tag: 'H2',
        snippet: '## Section Heading\n',
        group: 'Structure',
        icon: 'H2',
      },
      {
        name: 'Heading 3',
        tag: 'H3',
        snippet: '### Subsection\n',
        group: 'Structure',
        icon: 'H3',
      },
      {
        name: 'Blockquote',
        tag: 'Blockquote',
        snippet: '> "A quote worth sharing."\n> — Attribution',
        group: 'Structure',
        icon: '"',
      },
      {
        name: 'Code Block',
        tag: 'Pre',
        snippet: '```typescript\n// code here\n```',
        group: 'Structure',
        icon: '</>',
      },
      {
        name: 'Table',
        tag: 'Table',
        snippet: '| Concept | Principle |\n| :--- | :--- |\n| Craft | Simplicity |\n| Focus | Guarded |',
        group: 'Structure',
        icon: '▦',
      },
      {
        name: 'Horizontal Rule',
        tag: 'HR',
        snippet: '\n---\n',
        group: 'Structure',
        icon: '―',
      },
      {
        name: 'Unordered List',
        tag: 'UL',
        snippet: '- First item\n- Second item\n- Third item',
        group: 'Structure',
        icon: '•',
      },
      {
        name: 'Ordered List',
        tag: 'OL',
        snippet: '1. First step\n2. Second step\n3. Third step',
        group: 'Structure',
        icon: '1.',
      },
      {
        name: 'Task List',
        tag: 'Tasks',
        snippet: '- [x] Completed task\n- [ ] Pending task',
        group: 'Structure',
        icon: '☑',
      },
    ],
  },
  {
    label: 'Callouts',
    items: [
      {
        name: 'Note',
        tag: 'Note',
        snippet: '> [!NOTE]\n> Key context or reference.',
        group: 'Callouts',
        icon: 'ℹ',
      },
      {
        name: 'Tip',
        tag: 'Tip',
        snippet: '> [!TIP]\n> Useful advice or recommendation.',
        group: 'Callouts',
        icon: '💡',
      },
      {
        name: 'Important',
        tag: 'Important',
        snippet: '> [!IMPORTANT]\n> Critical requirement or key take-away.',
        group: 'Callouts',
        icon: '📌',
      },
      {
        name: 'Warning',
        tag: 'Warning',
        snippet: '> [!WARNING]\n> Potential pitfall or cautionary note.',
        group: 'Callouts',
        icon: '⚠️',
      },
      {
        name: 'Caution',
        tag: 'Caution',
        snippet: '> [!CAUTION]\n> Action with serious consequences.',
        group: 'Callouts',
        icon: '🛑',
      },
    ],
  },
];

interface ComponentLibrarySidebarProps {
  onInsert: (snippet: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMediaPicker: () => void;
  onOpenEmbedPicker: (kind: 'book' | 'post' | 'note') => void;
}

export function ComponentLibrarySidebar({
  onInsert,
  isCollapsed,
  onToggleCollapse,
  onOpenMediaPicker,
  onOpenEmbedPicker,
}: ComponentLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = COMPONENT_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className={`${
        isCollapsed ? 'w-14' : 'w-72'
      } border-l border-tinted/20 bg-ink flex flex-col h-full shrink-0 transition-all duration-200`}
    >
      {/* Search + Collapse */}
      <div className="p-2 border-b border-tinted/20 bg-ink/90 flex items-center gap-2">
        {!isCollapsed && (
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-night-soft border border-tinted/20 rounded-md py-1.5 px-3 text-xs font-sans text-paper/80 focus:outline-none focus:border-tinted/40 transition-colors"
            />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-tinted/10 rounded text-ink-soft hover:text-paper transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {!isCollapsed && (
                <div className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-ink-soft/70">
                  {group.label}
                </div>
              )}
              <div className="space-y-px">
                {group.items.map((comp) => (
                  <button
                    key={comp.name}
                    type="button"
                    title={isCollapsed ? comp.name : undefined}
                    onClick={() => {
                      if (comp.name === 'Media Asset') {
                        onOpenMediaPicker();
                      } else if (comp.name === 'Essay Embed') {
                        onOpenEmbedPicker('post');
                      } else if (comp.name === 'Note Embed') {
                        onOpenEmbedPicker('note');
                      } else {
                        onInsert(comp.snippet);
                      }
                    }}
                    className={`w-full text-left px-1.5 py-1.5 rounded hover:bg-night-soft transition-colors flex items-center gap-2 group ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                  >
                    <div
                      className={`h-7 w-7 flex items-center justify-center bg-ink border border-tinted/20 rounded text-xs text-ink-soft group-hover:text-paper group-hover:border-tinted/40 transition-colors shrink-0`}
                    >
                      {comp.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium font-sans text-paper/80 group-hover:text-paper transition-colors truncate">
                          {comp.name}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs font-sans text-ink-soft">
            {isCollapsed ? '...' : 'No components found.'}
          </div>
        )}
      </div>
    </div>
  );
}
