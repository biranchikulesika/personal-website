import { Fragment } from 'react';
import type { ComponentProps, ComponentType, JSX, ReactNode } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import Link from 'next/link';
import { isSafeUrl, slugify } from '@/lib/utils';
import { BookBlock } from '@/components/blocks/book-block';
import { PostBlock } from '@/components/blocks/post-block';
import { NoteBlock } from '@/components/blocks/note-block';

/**
 * Real MDX rendering for all content surfaces (public pages and editor preview).
 *
 * markdown is compiled + evaluated with @mdx-js/mdx and remark-gfm instead of
 * a hand-rolled parser, so it follows the official Markdown/MDX rules: nested
 * emphasis, escaping, GFM tables/strikethrough/task-lists/footnotes, autolinks,
 * HTML passthrough, and JSX blocks (<Book/> <Post/> <Note/> <YouTube/>).
 */

// ── Shared media components ─────────────────────────────────────────────────

export function MarkdownFigure({
  src,
  alt,
  caption,
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}) {
  const cleanSrc =
    src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('blob:')
      ? `/${src}`
      : src;

  return (
    <figure className={`my-8 block ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
        <Image
          src={cleanSrc}
          alt={alt || 'Document Image'}
          width={1200}
          height={675}
          sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) 720px, 800px"
          className="h-auto w-full object-contain object-center transition-all duration-300"
          loading={priority ? undefined : 'lazy'}
          priority={priority}
        />
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-center font-serif text-xs italic text-ink-soft">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function MarkdownYouTube({ id }: { id: string }) {
  const cleanId = id
    .replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/, '')
    .replace(/https?:\/\/youtu\.be\//, '');

  if (!cleanId) return null;

  return (
    <div className="my-8 aspect-video w-full overflow-hidden rounded-xl border border-tinted/20 bg-black shadow-md">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${cleanId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}

/** Legacy `<Video src|path ... />` block: native HTML5 video player. */
export function MdxVideo({ src, path }: { src?: string; path?: string }) {
  const v = src ?? path;
  if (!v) return null;
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
      <video className="w-full" src={v} controls preload="metadata" />
    </div>
  );
}

// ── Components map ──────────────────────────────────────────────────────────

type ComponentPropsOf<T extends keyof JSX.IntrinsicElements> = ComponentProps<T>;

function headingId(children: ReactNode): string {
  let out = '';
  for (const c of Array.isArray(children) ? children : [children]) {
    if (typeof c === 'string' || typeof c === 'number') out += c;
    else if (c && typeof c === 'object' && 'props' in c && c.props?.children) {
      out += headingId((c.props as { children?: ReactNode }).children);
    }
  }
  return slugify(out);
}

const innerText = (node: ReactNode): string =>
  headingId(node) || String(node ?? '');

function CodeBlockShell({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  return (
    <div className="relative my-6 overflow-hidden rounded-xl border border-tinted/30 bg-night-soft p-4 shadow-sm">
      {lang && (
        <div className="mb-2.5 flex items-center justify-between border-b border-tinted/20 pb-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
            {lang}
          </span>
        </div>
      )}
      <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-paper/90 selection:bg-accent/30 [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:font-normal [&>code]:text-inherit">
        {children}
      </pre>
    </div>
  );
}

function AlertsAndQuotes({ children }: { children: ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);

  const first = items[0] as ReactNode;
  const firstEl = (
    first && typeof first === 'object' && 'type' in first ? first : null
  ) as { props?: { children?: ReactNode } } | null;
  const firstText = innerText(firstEl?.props?.children).trim();

  const alertMatch = firstText.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);

  if (alertMatch) {
    const alertType = alertMatch[1].toUpperCase();
    const rest = items.slice(1);
    return (
      <div className="my-6 rounded-xl border border-tinted/20 bg-post-card p-5 shadow-2xs">
        <span className="rounded bg-night px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-tinted/20">
          {alertType}
        </span>
        {rest.length > 0 && (
          <div className="mt-2 text-sm leading-relaxed text-paper/90 font-serif space-y-1">
            {rest}
          </div>
        )}
      </div>
    );
  }

  return (
    <blockquote className="my-8 border-y border-tinted/20 py-6 text-center font-serif text-lg italic leading-relaxed text-paper/90 md:text-xl">
      {items.map((item, i) => {
        const node = (item && typeof item === 'object' && 'props' in item
          ? (item as { props?: { children?: ReactNode } }).props?.children
          : item) as ReactNode;
        const text = innerText(node).trim();
        if (text.startsWith('—') || text.startsWith('--')) {
          return (
            <cite
              key={i}
              className="mt-3 block text-[11px] not-italic uppercase tracking-widest text-ink-soft"
            >
              {text.replace(/^—+\s?|-+\s?/, '')}
            </cite>
          );
        }
        return <Fragment key={i}>{item}</Fragment>;
      })}
    </blockquote>
  );
}

const mdxImg = ({
  src: srcProp,
  path,
  alt = '',
  title,
  caption,
}: {
  src?: string;
  path?: string;
  alt?: string;
  title?: string;
  caption?: string;
}) => (
  <MarkdownFigure
    src={String(srcProp ?? path ?? '')}
    alt={alt || 'Document Image'}
    caption={typeof title === 'string' ? title : typeof caption === 'string' ? caption : undefined}
  />
);

/**
 * remark plugin: lifts every image out of its paragraph. CommonMark parses
 * `![…]` as inline, but our `img` override renders a block `<figure>`, which
 * can't live inside `<p>` (hydration error). Each image becomes a top-level
 * sibling and the paragraph text is split around it:
 *   `text ![a] more` → `<p>text</p> <figure/> <p>more</p>`
 *   `![a]\n*caption*` → `<figure/> <p><em>caption</em></p>`
 */
export function remarkStandaloneImages() {
  return (tree: { children: unknown[] }) => {
    const toParagraph = (children: unknown[]) => ({
      type: 'paragraph',
      children,
    } as { type: string; children: unknown[] });

    const walk = (node: unknown) => {
      const n = node as { type?: string; children?: unknown[] };
      if (!Array.isArray(n.children)) return;
      const out: unknown[] = [];
      for (const child of n.children) {
        const c = child as { type?: string; children?: unknown[] };
        if (c.type === 'paragraph' && Array.isArray(c.children)) {
          let buf: unknown[] = [];
          for (const inline of c.children) {
            if ((inline as { type?: string }).type === 'image') {
              if (buf.length) {
                out.push(toParagraph(buf));
                buf = [];
              }
              out.push(inline);
            } else {
              buf.push(inline);
            }
          }
          if (buf.length) out.push(toParagraph(buf));
          continue;
        }
        walk(child);
        out.push(child);
      }
      n.children = out;
    };
    walk(tree);
  };
}

export const mdxComponents = {
  p: ({ children, ...props }: ComponentPropsOf<'p'>) => (
    <p {...props} className={`leading-[1.85] text-paper/85 ${props.className ?? ''}`}>
      {children}
    </p>
  ),
  a: ({ href = '', children, ...props }: ComponentPropsOf<'a'>) => {
    if (!href) return <Fragment>{children}</Fragment>;
    if (href.startsWith('#')) {
      return (
        <a href={href} {...props} className="text-accent hover:text-paper transition-colors">
          {children}
        </a>
      );
    }
    if (!isSafeUrl(href)) return <span>{children}</span>;
    const external = /^https?:\/\//i.test(href);
    const className =
      'font-normal text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent';
    if (!external) {
      return (
        <Link href={href} {...props} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  },
  h2: ({ children, ...props }: ComponentPropsOf<'h2'>) => (
    <h2 id={headingId(children)} {...props} className="font-serif text-2xl font-normal text-paper md:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsOf<'h3'>) => (
    <h3 {...props} className="mt-8 mb-2 font-serif text-xl font-normal text-paper md:text-2xl">
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentPropsOf<'h4'>) => (
    <h4 {...props} className="mt-6 mb-2 font-serif text-lg font-normal text-paper md:text-xl">
      {children}
    </h4>
  ),
  strong: ({ children, ...props }: ComponentPropsOf<'strong'>) => (
    <strong {...props} className="font-semibold text-paper">{children}</strong>
  ),
  em: ({ children, ...props }: ComponentPropsOf<'em'>) => (
    <em {...props} className="italic text-paper/90">{children}</em>
  ),
  del: ({ children, ...props }: ComponentPropsOf<'del'>) => (
    <del {...props} className="line-through text-ink-soft">{children}</del>
  ),
  code: (props: ComponentPropsOf<'code'>) => (
    <code
      {...props}
      className={`rounded bg-night-soft px-1.5 py-0.5 font-mono text-[0.875em] font-medium text-accent border border-tinted/40 break-words ${props.className ?? ''}`}
    />
  ),
  pre: ({ children, ...props }: ComponentPropsOf<'pre'>) => {
    const codeEl = Array.isArray(children) ? children[0] : children;
    const meta = (codeEl && typeof codeEl === 'object' && 'props' in codeEl
      ? (codeEl as { props?: { className?: string } }).props?.className
      : '') as string;
    const langMatch = typeof meta === 'string' ? meta.match(/language-([\w-]+)/) : null;
    return <CodeBlockShell lang={langMatch?.[1] ?? ''}>{children}</CodeBlockShell>;
  },
  img: mdxImg,
  // Back-compat aliases: the old regex renderer accepted these tags, so posts
  // written before the MDX migration may still contain them.
  Image: mdxImg,
  Figure: mdxImg,
  Video: MdxVideo,
  ul: ({ children, ...props }: ComponentPropsOf<'ul'>) => (
    <ul {...props} className="my-4 list-disc pl-6 space-y-2 text-base leading-[1.85] text-paper/85 font-serif">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsOf<'ol'>) => (
    <ol {...props} className="my-4 list-decimal pl-6 space-y-2 text-base leading-[1.85] text-paper/85 font-serif">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsOf<'li'>) => (
    <li {...props} className="space-y-1">{children}</li>
  ),
  blockquote: ({ children }: ComponentPropsOf<'blockquote'>) => (
    <AlertsAndQuotes>{children}</AlertsAndQuotes>
  ),
  hr: (props: ComponentPropsOf<'hr'>) => (
    <hr {...props} className="my-8 border-t border-tinted/20" />
  ),
  table: ({ children, ...props }: ComponentPropsOf<'table'>) => (
    <table {...props} className="my-6 block w-full overflow-x-auto text-left text-sm font-sans whitespace-nowrap">
      {children}
    </table>
  ),
  thead: ({ children, ...props }: ComponentPropsOf<'thead'>) => (
    <thead {...props} className="border-b border-tinted/20 bg-night-soft text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {children}
    </thead>
  ),
  tbody: (props: ComponentPropsOf<'tbody'>) => <tbody {...props} />,
  tr: ({ children, ...props }: ComponentPropsOf<'tr'>) => (
    <tr {...props} className="hover:bg-night-soft/40 transition-colors">{children}</tr>
  ),
  th: ({ children, ...props }: ComponentPropsOf<'th'>) => (
    <th {...props} className="px-4 py-3 font-medium">{children}</th>
  ),
  td: ({ children, ...props }: ComponentPropsOf<'td'>) => (
    <td {...props} className="px-4 py-3 text-paper">{children}</td>
  ),
  input: (props: ComponentPropsOf<'input'>) => (
    <input {...props} className="mr-2 inline-block h-4 w-4 accent-accent align-[-2px]" />
  ),
  YouTube: ({ id }: { id: string }) => <MarkdownYouTube id={id} />,
  Book: ({
    title,
    author,
    description,
    cover,
    link,
  }: {
    title: string;
    author?: string;
    description?: string;
    cover?: string;
    link?: string;
  }) => (
    <BookBlock
      title={title}
      author={author ?? ''}
      description={description ?? ''}
      cover={cover}
      link={link}
    />
  ),
  Post: (props: ComponentProps<typeof PostBlock>) => <PostBlock {...props} />,
  Note: (props: ComponentProps<typeof NoteBlock>) => <NoteBlock {...props} />,
};

// ── Evaluation ──────────────────────────────────────────────────────────────

interface MdxModule {
  default: (props: { children?: ReactNode }) => ReactNode;
}

export async function evaluateMdx(src: string): Promise<MdxModule> {
  return evaluate(src, {
    ...runtime,
    Fragment,
    remarkPlugins: [remarkGfm, remarkStandaloneImages],
    useMDXComponents: () => mdxComponents,
  }) as Promise<MdxModule>;
}

/**
 * Evaluates `src` as a single MDX document. If that fails (one bad token
 * currently blanks the whole document), degrades to evaluating each paragraph
 * block on its own so healthy paragraphs still render. Returns all components
 * that compiled, in order.
 */
export async function evaluateBestEffort(src: string): Promise<ComponentType[]> {
  const tryEval = async (chunk: string): Promise<ComponentType | null> => {
    try {
      const { default: Content } = await evaluateMdx(chunk);
      return Content as unknown as ComponentType;
    } catch {
      return null;
    }
  };

  const full = await tryEval(src);
  if (full) return [full];

  // ponytail: per-paragraph fallback. Good enough to keep healthy paragraphs
  // visible; upgrade to a real error-surfacing boundary if legacy content
  // needs to be edited in-place.
  const components: ComponentType[] = [];
  for (const chunk of src.split(/\n\n+/)) {
    if (!chunk.trim()) continue;
    const c = await tryEval(chunk);
    if (c) components.push(c);
  }
  return components;
}

/**
 * Renders a block of MDX to the styled document wrapper. Returns null only if
 * no part of the source compiles (see `evaluateBestEffort`), never blanking
 * healthy paragraphs because of one malformed token.
 */
export async function renderMdx(
  src: string,
  opts: { intro?: boolean; className?: string } = {},
): Promise<ReactNode> {
  if (!src || !src.trim()) return null;
  const components = await evaluateBestEffort(src);
  if (components.length === 0) {
    console.error(`[mdx] no renderable content:\n${src.slice(0, 300)}`);
    return null;
  }
  return (
    <div
      className={`mdx-body ${opts.intro ? 'mdx-intro' : ''} space-y-6 ${opts.className ?? ''}`}
    >
      {components.map((Content, i) => (
        <Content key={i} />
      ))}
    </div>
  );
}

// ── Serialization ────────────────────────────────────────────────────────────
// `sectionsToMarkdown` and `postToDocs` (lib/utils.ts) produce the per-segment
// MDX documents evaluated above.