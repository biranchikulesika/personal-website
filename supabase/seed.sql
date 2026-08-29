-- =============================================================================
-- Biranchi Kulesika — Local Development Seed Data
-- =============================================================================
-- Minimal sample data so the site loads and renders in local development.
-- All data is idempotent-safe (uses ON CONFLICT DO NOTHING).
-- =============================================================================

-- ── Sample Books (Library) ───────────────────────────────────────────────────

INSERT INTO public.books (id, slug, title, author, description, date, persona, tags)
VALUES
  ('book-001', 'designing-data-intensive-applications', 'Designing Data-Intensive Applications', 'Martin Kleppmann',
   'A deep dive into the internals of distributed data systems — the kind of book that changes how you think about architecture.',
   '2024', 'builder', ARRAY['systems', 'architecture', 'databases']),

  ('book-002', 'the-structure-of-scientific-revolutions', 'The Structure of Scientific Revolutions', 'Thomas S. Kuhn',
   'How paradigms shift in science — and why the same pattern appears in technology and culture.',
   '2023', 'thinker', ARRAY['philosophy', 'science', 'history']),

  ('book-003', 'atomic-habits', 'Atomic Habits', 'James Clear',
   'Practical framework for building systems that compound over time. Small changes, remarkable results.',
   '2024', 'operator', ARRAY['productivity', 'habits', 'self-improvement'])
ON CONFLICT (id) DO NOTHING;

-- ── Sample Posts (Essays) ────────────────────────────────────────────────────
-- posts.id is UUID — use gen_random_uuid() and store slugs for featured_items.

INSERT INTO public.posts (slug, title, subtitle, description, persona, tags, published_at, last_edited_at, status, intro, sections)
VALUES
  ('hello-world', 'Hello World', 'Starting this site',
   'An introduction to this personal website and what it aims to be.',
   'builder', ARRAY['meta', 'launch'], '2026-08-01', '2026-08-01', 'published',
   '["This is the beginning of something. A personal website built to stay — not a template, not a theme, but a living document of work and thought."]'::jsonb,
   '[{"id":"what-is-this","heading":"What Is This","paragraphs":["This site is my digital home — a place for long-form writing, notes, and things I am reading. It is built with Next.js, Supabase, and a lot of care."]}]'::jsonb),

  ('building-in-public', 'Building in Public', 'Lessons from shipping software',
   'Reflections on the practice of building things and sharing the process openly.',
   'builder', ARRAY['engineering', 'culture'], '2026-08-15', '2026-08-15', 'published',
   '["Building in public is uncomfortable. It means showing the messy middle, not just the polished end. But that discomfort is where growth lives."]'::jsonb,
   '[{"id":"why-build-in-public","heading":"Why Build in Public","paragraphs":["Transparency creates accountability. When people can see your work, you are motivated to ship it."]}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ── Sample Notes (Atomic Thinking) ───────────────────────────────────────────

INSERT INTO public.notes (id, slug, title, description, date, persona, tags, status, content)
VALUES
  ('note-001', 'complexity-is-not-complicated', 'Complexity Is Not Complicated',
   'Distinction between essential complexity and accidental complexity in software systems.',
   '2026-08-10', 'thinker', ARRAY['systems', 'thinking'], 'published',
   '["Essential complexity is inherent to the problem. Accidental complexity comes from our tools and choices. Good engineering reduces the latter while respecting the former."]'::jsonb),

  ('note-002', 'defaults-shape-behavior', 'Defaults Shape Behavior',
   'The most powerful design decisions are often the ones users never see.',
   '2026-08-20', 'builder', ARRAY['design', 'ux'], 'published',
   '["Every default is a recommendation. Choose them carefully — most users will never change them."]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── Featured Items (Homepage Highlights) ─────────────────────────────────────

INSERT INTO public.featured_items (item_type, item_id, position)
VALUES
  ('post', 'hello-world', 1),
  ('post', 'building-in-public', 2),
  ('book', 'book-001', 1)
ON CONFLICT (item_type, position) DO NOTHING;
