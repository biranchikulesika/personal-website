import { resetDatabase } from '../lib/data/mock-db';

const db = resetDatabase();
const counts = {
  posts: db.posts.length,
  writing: db.writing.items.length,
  notes: db.notes.items.length,
  books: db.books.items.length,
};

console.log('Mock database reset. Seeded collections:');
for (const [collection, count] of Object.entries(counts)) {
  console.log(`- ${collection}: ${count}`);
}
console.log(`- site content: identity, nav, hero, footer`);