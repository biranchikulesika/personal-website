import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { ImageBlock } from './ImageBlock';

export function MarkdownRenderer({ content }: { content: string }) {
  // Strip out the invisible blocks payload from the markdown content prior to rendering
  const cleanContent = content ? content.replace(/<!-- BLOCKS_PAYLOAD:.*? -->/, '') : '';

  const parts = [];
  const imageBlockRegex = /<ImageBlock[\s\S]*?\/>/g;
  let lastIndex = 0;
  
  let match;
  while ((match = imageBlockRegex.exec(cleanContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: cleanContent.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'image-block', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < cleanContent.length) {
    parts.push({ type: 'markdown', content: cleanContent.substring(lastIndex) });
  }

  const parseProps = (tagStr: string) => {
    const propsRegex = /([a-zA-Z]+)="([^"]*)"/g;
    const props: any = {};
    let propMatch;
    while ((propMatch = propsRegex.exec(tagStr)) !== null) {
      props[propMatch[1]] = propMatch[2];
    }
    return props;
  };

  return (
    <div className="prose prose-invert prose-neutral max-w-none">
      {parts.map((part, i) => {
        if (part.type === 'markdown') {
          return (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {part.content}
            </ReactMarkdown>
          );
        } else {
          const props = parseProps(part.content);
          return <ImageBlock key={i} {...props} />;
        }
      })}
    </div>
  );
}
