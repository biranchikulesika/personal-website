'use client';

import React, { useState } from 'react';

export interface ComponentEntry {
  name: string;
  tag: string;
  snippet: string;
  description: string;
  group: 'Embeds' | 'Structure' | 'Headings' | 'Lists' | 'Callouts';
  icon: string;
}

export interface ComponentGroup {
  label: 'Embeds' | 'Structure' | 'Headings' | 'Lists' | 'Callouts';
  items: ComponentEntry[];
}

export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    label: 'Embeds',
    items: [
      {
        name: 'Image',
        tag: 'Image',
        snippet: '![Image Description](/image.jpg)\n*Figure caption*',
        description: 'MDX image with figure caption',
        group: 'Embeds',
        icon: '🖼',
      },
      {
        name: 'YouTube',
        tag: 'YouTube',
        snippet: '<YouTube id="dQw4w9WgXcQ" />',
        description: 'Embed a responsive video',
        group: 'Embeds',
        icon: '▶',
      },
      {
        name: 'Media Asset',
        tag: 'Media',
        snippet: '![Asset Description](/selfie.jpeg)',
        description: 'Pick asset from media library',
        group: 'Embeds',
        icon: '📁',
      },
    ],
  },
  {
    label: 'Callouts',
    items: [
      {
        name: 'Note Callout',
        tag: 'Note',
        snippet: '> [!NOTE]\n> Thoughtful reflection or context goes here.',
        description: 'Quiet information callout',
        group: 'Callouts',
        icon: 'ℹ',
      },
      {
        name: 'Tip Callout',
        tag: 'Tip',
        snippet: '> [!TIP]\n> Useful advice, shortcuts, or craft recommendation.',
        description: 'Green highlight recommendation',
        group: 'Callouts',
        icon: '💡',
      },
      {
        name: 'Important Callout',
        tag: 'Important',
        snippet: '> [!IMPORTANT]\n> Critical requirement or key take-away.',
        description: 'Purple highlight note',
        group: 'Callouts',
        icon: '📌',
      },
      {
        name: 'Warning Callout',
        tag: 'Warning',
        snippet: '> [!WARNING]\n> Potential pitfall, trade-off, or cautionary advice.',
        description: 'Amber warning banner',
        group: 'Callouts',
        icon: '⚠️',
      },
    ],
  },
  {
    label: 'Structure',
    items: [
      {
        name: 'Table',
        tag: 'Table',
        snippet: '| Concept | Principle | Status |\n| :--- | :--- | :--- |\n| Craft | Simplicity First | Active |\n| Attention | Guarded | Essential |',
        description: 'Structured tabular data',
        group: 'Structure',
        icon: '▦',
      },
      {
        name: 'Blockquote',
        tag: 'Blockquote',
        snippet: '> "Attention is a craftsperson\'s primary material."\n> — Biranchi',
        description: 'Pull-quote with attribution',
        group: 'Structure',
        icon: '“',
      },
      {
        name: 'Code Block (Pre)',
        tag: 'Pre',
        snippet: '```typescript\nfunction craftSoftware() {\n  return "Focus & Clarity";\n}\n```',
        description: 'Fenced code with syntax highlighting',
        group: 'Structure',
        icon: '⟨/⟩',
      },
      {
        name: 'Horizontal Rule',
        tag: 'HR',
        snippet: '\n---\n',
        description: 'Thematic section divider',
        group: 'Structure',
        icon: '―',
      },
    ],
  },
  {
    label: 'Headings',
    items: [
      {
        name: 'Heading 1',
        tag: 'H1',
        snippet: '# Major Chapter Title\n',
        description: 'Top-level document title',
        group: 'Headings',
        icon: 'H1',
      },
      {
        name: 'Heading 2',
        tag: 'H2',
        snippet: '## Core Principle\n',
        description: 'Section heading with TOC anchor',
        group: 'Headings',
        icon: 'H2',
      },
      {
        name: 'Heading 3',
        tag: 'H3',
        snippet: '### Subsection Detail\n',
        description: 'Sub-tier heading for finer points',
        group: 'Headings',
        icon: 'H3',
      },
    ],
  },
  {
    label: 'Lists',
    items: [
      {
        name: 'Unordered List',
        tag: 'UL',
        snippet: '- First observation\n- Second observation\n- Third observation',
        description: 'Bulleted item list',
        group: 'Lists',
        icon: '•',
      },
      {
        name: 'Ordered List',
        tag: 'OL',
        snippet: '1. Establish first principles\n2. Iterate with patience\n3. Polish the details',
        description: 'Numbered sequential list',
        group: 'Lists',
        icon: '1.',
      },
      {
        name: 'Task List',
        tag: 'Tasks',
        snippet: '- [x] Initial design\n- [ ] Editorial review\n- [ ] Publication',
        description: 'Checkable checklist items',
        group: 'Lists',
        icon: '☑',
      },
    ],
  },
];

interface ComponentLibrarySidebarProps {
  onInsert: (snippet: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMediaPicker: () => void;
}

export function ComponentLibrarySidebar({
  onInsert,
  isCollapsed,
  onToggleCollapse,
  onOpenMediaPicker,
}: ComponentLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = COMPONENT_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className={`${
        isCollapsed ? 'w-14' : 'w-72'
      } border-l border-[#222] bg-[#0a0a0a] flex flex-col h-full shrink-0 transition-all duration-200`}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#222] bg-[#111]">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } ${!isCollapsed ? 'mb-2.5' : ''}`}
        >
          {!isCollapsed && (
            <h3 className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <span>▦</span> Component Library
            </h3>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#222] rounded text-neutral-500 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? '◀' : '▶'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-md py-1.5 pl-8 pr-3 text-xs font-sans text-neutral-300 focus:outline-none focus:border-[#555] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((comp) => (
                  <button
                    key={comp.name}
                    type="button"
                    title={isCollapsed ? comp.name : undefined}
                    onClick={() => {
                      if (comp.name === 'Media Asset') {
                        onOpenMediaPicker();
                      } else {
                        onInsert(comp.snippet);
                      }
                    }}
                    className={`w-full text-left p-2 rounded-md hover:bg-[#1a1a1a] transition-colors flex items-start gap-2.5 group ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                  >
                    <div
                      className={`h-7 w-7 flex items-center justify-center bg-[#111] border border-[#222] rounded text-xs text-neutral-400 group-hover:text-white group-hover:border-[#333] transition-colors shrink-0 ${
                        !isCollapsed ? 'mt-0.5' : ''
                      }`}
                    >
                      {comp.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium font-sans text-neutral-300 group-hover:text-white transition-colors truncate">
                          {comp.name}
                        </div>
                        <div className="text-[10px] font-sans text-neutral-500 truncate mt-0.5">
                          {comp.description}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs font-sans text-neutral-500">
            {isCollapsed ? '...' : 'No components found.'}
          </div>
        )}
      </div>
    </div>
  );
}
