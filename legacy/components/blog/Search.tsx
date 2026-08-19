'use client';

import React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { PERSONA_BLOG_THEMES } from './themes';

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  persona: 'wanderer' | 'thinker' | 'builder' | 'operator';
}

export function Search({ value, onChange, persona }: SearchProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;

  // Custom adaptive classes for input styling
  const getInputStyles = () => {
    switch (persona) {
      case 'operator':
        return 'font-mono text-xs border border-dashed focus:border-solid bg-muted px-3 py-2 text-foreground placeholder:text-primary/50 focus:ring-1 focus:ring-primary/30';
      case 'builder':
        return 'font-mono text-foreground text-xs border border-border bg-muted/50 px-3.5 py-2 placeholder:text-primary/50 focus:border-primary/80 focus:ring-1 focus:ring-primary/10 rounded-md';
      case 'thinker':
        return 'font-sans text-foreground text-sm border-b bg-transparent py-2 px-1 focus:border-primary placeholder:text-primary/50 border-border';
      case 'wanderer':
      default:
        return 'font-sans text-foreground text-xs sm:text-sm bg-muted border border-border px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-md placeholder:text-primary/50 focus:outline-none focus:border-primary';
    }
  };

  const getIconStyles = () => {
    return 'text-primary/60';
  };

  return (
    <div className={`relative w-full flex items-center ${persona === 'wanderer' ? 'max-w-none' : 'max-w-lg mx-auto md:my-6'}`}>
      <div className="absolute right-3 pointer-events-none">
        <SearchIcon className={`w-4 h-4 ${getIconStyles()}`} id="search-icon" />
      </div>
      <input
        type="text"
        id="archive-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={theme.searchText}
        className={`w-full outline-none transition-all pr-10 ${getInputStyles()}`}
      />
    </div>
  );
}
