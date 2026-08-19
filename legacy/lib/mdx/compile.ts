import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeKatex from 'rehype-katex';

/**
 * SECURITY: Custom remark plugin that strips dangerous MDX AST nodes while
 * preserving safe JSX elements used by the component library (Image, Callout,
 * YouTube, etc.).
 *
 * Removes:
 *   - mdxFlowExpression / mdxTextExpression – `{...}` JSX expressions that
 *     can execute arbitrary JavaScript (e.g. `{eval(atob('...'))}`)
 *   - mdxJsxAttributeValueExpression – inline expressions in JSX element
 *     attributes (e.g. `<Image path={eval(atob('...'))} />`). These are
 *     replaced with empty string values to prevent evaluation.
 *   - import / export – import/export statements that can load arbitrary
 *     modules from external sources
 *
 * Preserves:
 *   - JSX element nodes (<Image>, <Callout>, <YouTube>) – these are safe
 *     because they are resolved through the allow-listed MDXComponents map
 *     at render time. Only explicitly registered components can be used.
 *
 * This allows us to keep `format: 'mdx'` (which supports JSX component
 * resolution) while preventing arbitrary code execution through JS
 * expressions.
 */
function remarkSanitizeMdx() {
  return (tree: any) => {
    // Pass 1: Strip attribute value expressions from JSX elements.
    // An attacker can write <Image path={eval(atob('...'))} /> which produces
    // a mdxJsxAttributeValueExpression node inside the attribute. If not
    // stripped, this expression would be evaluated when MDXRemote renders
    // the compiled source. We replace it with an empty string so the attribute
    // becomes valueless (<Image path />), which is safe.
    sanitizeJsxAttributes(tree);

    // Pass 2: Strip standalone JSX expressions and import/export statements
    visit(tree, ['mdxFlowExpression', 'mdxTextExpression'], (node: any, index: number, parent: any) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
      }
    });
    visit(tree, ['import', 'export'], (node: any, index: number, parent: any) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
      }
    });
  };
}

/**
 * Walk the AST tree and strip mdxJsxAttributeValueExpression nodes from
 * JSX element attributes. Replaces the expression value with an empty
 * string so the attribute becomes a valueless boolean attribute, which
 * is safe.
 */
function sanitizeJsxAttributes(tree: any) {
  if (!tree || typeof tree !== 'object') return;

  const type = tree.type;
  // JSX elements have an `attributes` array on the element node itself
  if ((type === 'mdxJsxFlowElement' || type === 'mdxJsxTextElement') && Array.isArray(tree.attributes)) {
    for (let i = tree.attributes.length - 1; i >= 0; i--) {
      const attr = tree.attributes[i];
      if (attr?.value?.type === 'mdxJsxAttributeValueExpression') {
        // Replace the expression value with an empty string — the attribute
        // becomes a valueless boolean attribute (e.g. <Image path />), which
        // is safe because no JS expression will be evaluated.
        tree.attributes[i] = { ...attr, value: '' };
      }
    }
  }

  // Recurse into children
  if (Array.isArray(tree.children)) {
    for (const child of tree.children) {
      sanitizeJsxAttributes(child);
    }
  }
}

/**
 * Import visit separately to avoid bundling issues
 */
function visit(tree: any, types: string[], callback: (node: any, index: number, parent: any) => void): void {
  if (!tree || typeof tree !== 'object') return;
  
  const type = tree.type;
  const children = tree.children;
  
  if (type && types.includes(type) && children === undefined) {
    // This is a leaf node with a matching type — handle via parent traversal
    return;
  }
  
  if (children && Array.isArray(children)) {
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child && typeof child === 'object') {
        if (child.type && types.includes(child.type)) {
          callback(child, i, tree);
        } else {
          visit(child, types, callback);
        }
      }
    }
  }
}

/**
 * Compile user-authored MDX/MD content into a serializable format for
 * client-side rendering via next-mdx-remote.
 *
 * ── SECURITY NOTE ────────────────────────────────────────────────────────
 * We use `format: 'mdx'` to support JSX elements like `<Image>`, `<Callout>`,
 * and `<YouTube>` which are part of the component library. However, MDX also
 * supports JavaScript expressions like `{console.log(1)}` and `import`
 * statements that could execute arbitrary code.
 *
 * The `remarkSanitizeMdx` plugin strips dangerous nodes (expressions,
 * imports, exports) from the AST before compilation, keeping only safe
 * JSX element nodes. Combined with the allow-listed MDXComponents map,
 * this provides defense-in-depth against XSS.
 *
 * As an additional layer, the PostRenderer sanitizes the final HTML output
 * with DOMPurify at render time.
 * ──────────────────────────────────────────────────────────────────────────
 */
export async function compileMDX(source: string) {
  if (!source || source.trim() === '') {
    return null;
  }

  try {
    const mdxSource = await serialize(source, {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkMath,
          // SECURITY: Strip dangerous JSX expressions and import/export statements
          remarkSanitizeMdx,
        ],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeKatex,
          [
            rehypePrettyCode,
            {
              theme: 'github-dark',
              keepBackground: false,
            },
          ],
        ],
        // Must use 'mdx' format to support JSX element resolution.
        // The remarkSanitizeMdx plugin handles the security aspect.
        format: 'mdx',
      },
      parseFrontmatter: false, // We store metadata in db columns
    });
    
    return mdxSource;
  } catch (error: any) {
    const errMsg = error?.message || 'Failed to compile MDX content';
    console.warn('MDX Compilation Warning:', errMsg);
    throw new Error(errMsg);
  }
}
