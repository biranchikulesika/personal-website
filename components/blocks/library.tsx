/**
 * Component library for MDX blocks usable inside the editor.
 *
 * Each entry defines an insertable snippet (what the toolbar pastes into the
 * document). Rendering of `<Book />` / `<Post />` / `<Note />` tags is handled
 * by the real MDX components map in `lib/mdx.tsx`.
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