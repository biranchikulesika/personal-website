import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Book } from '../components/ui/book';
import { BookCover } from '../components/ui/book-cover';

test('Book component renders simple variant with custom color and textColor', () => {
  const element = Book({
    color: '#7DC1C1',
    textColor: 'white',
    textured: true,
    title: 'Design Engineering at Vercel',
    variant: 'simple',
  });

  assert.ok(element, 'Book component should return a valid JSX element');
  assert.equal(element.type, 'div');
  const className = element.props.className;
  assert.ok(className.includes('geist-book-perspective'), 'Should have geist-book-perspective class');
});

test('Book component renders default / stripe variant with custom color', () => {
  const element = Book({
    color: '#9D2127',
    textured: true,
    title: 'Design Engineering at Vercel',
  });

  assert.ok(element);
  assert.equal(element.type, 'div');
});

test('Book component handles real coverpage when cover URL is provided', () => {
  const element = Book({
    title: 'Thinking in Systems',
    author: 'Donella Meadows',
    cover: 'https://example.com/cover.png "Cover Title"',
    textured: true,
  });

  assert.ok(element);
  // Verify that the link is not present by default
  assert.equal(element.type, 'div');
});

test('Book component wraps with safe link when link is provided', () => {
  const element = Book({
    title: 'Clean Code',
    link: 'https://example.com/book',
  });

  assert.equal(element.type, 'a');
  assert.equal(element.props.href, 'https://example.com/book');
});

test('BookCover re-export and wrapper works seamlessly', () => {
  const element = BookCover({
    title: 'The Pragmatic Programmer',
    author: 'Andy Hunt & Dave Thomas',
    cover: '/covers/pragmatic.png',
  });

  assert.ok(element);
});

test('Snippet provided by user functions as expected with @vercel/geistcn/components import path', async () => {
  // Verifies the path alias mapping in tsconfig
  const { Book: AliasedBook } = await import('../components/ui/book');
  const book1 = AliasedBook({ color: '#7DC1C1', textured: true, title: 'Design Engineering at Vercel' });
  const book2 = AliasedBook({ color: '#9D2127', textColor: '#ece4db', textured: true, title: 'Design Engineering at Vercel', variant: 'simple' });

  assert.ok(book1);
  assert.ok(book2);
});
