import type { ReactNode } from 'react';
import { BookBlock } from './book-block';
import { PostBlock } from './post-block';
import { NoteBlock } from './note-block';

/**
 * Component library for MDX blocks usable inside the editor and preview.
 *
 * Each entry defines an insertable snippet (what the toolbar pastes into the
 * document) plus the React component used to render the `<Tag ... />` form.
 */
export interface MDXBlockDefinition {
  name: string;
  tag: string;
  label: string;
  snippet: string;
  description: string;
}

export const MDX_BLOCK_LIBRARY: MDXBlockDefinition[] = [
  {
    name: 'book',
    tag: 'Book',
    label: 'Book',
    description: 'Book card with cover and link',
    snippet:
      '<Book title="The Shallows" author="Nicholas Carr" year="2025" description="A one-line note about the book." />',
  },
  {
    name: 'post',
    tag: 'Post',
    label: 'Essay Embed',
    description: 'Embed a linked essay card',
    snippet:
      '<Post slug="your-essay-slug" title="Your Essay Title" description="A short summary of the essay." />',
  },
  {
    name: 'note',
    tag: 'Note',
    label: 'Note Embed',
    description: 'Embed a linked note card',
    snippet:
      '<Note slug="your-note-slug" title="Your Note Title" description="A short summary of the note." />',
  },
];

export function findBlock(tag: string): MDXBlockDefinition | undefined {
  return MDX_BLOCK_LIBRARY.find(
    (b) => b.tag.toLowerCase() === tag.toLowerCase(),
  );
}

/**
 * Parses `key="value"` attribute pairs out of a tag body.
 */
export function parseBlockAttributes(
  tagString: string,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tagString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Renders a library block by its tag name. Returns null when the tag is not
 * part of the library (so callers fall through to other parsing).
 */
export function renderBlock(
  tag: string,
  attrs: Record<string, string>,
  key: string,
): ReactNode | null {
  const block = findBlock(tag);
  if (!block) return null;

  switch (block.tag) {
    case 'Book':
      return (
        <BookBlock
          key={key}
          title={attrs.title || 'Untitled'}
          author={attrs.author || ''}
          year={attrs.year}
          description={attrs.description || ''}
          cover={attrs.cover}
          link={attrs.link}
        />
      );
    case 'Post':
      return (
        <PostBlock
          key={key}
          slug={attrs.slug || 'essay'}
          title={attrs.title}
          subtitle={attrs.subtitle}
          description={attrs.description}
          date={attrs.date}
        />
      );
    case 'Note':
      return (
        <NoteBlock
          key={key}
          slug={attrs.slug || 'note'}
          title={attrs.title}
          description={attrs.description}
          date={attrs.date}
        />
      );
    default:
      return null;
  }
}