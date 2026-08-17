export function generateUniqueId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // fallback for older environments
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export const parseToBlocks = (text: string) => {
  if (!text) return [{ id: generateUniqueId('init'), type: 'text', content: '' }];
  
  // Attempt to parse the exact blocks payload if it was saved
  const payloadMatch = text.match(/<!-- BLOCKS_PAYLOAD:(.*?) -->/);
  if (payloadMatch && payloadMatch[1]) {
    try {
      const decodedPayload = payloadMatch[1].replace(/\\u002D\\u002D/g, '--');
      const blocks = JSON.parse(decodedPayload);
      if (Array.isArray(blocks) && blocks.length > 0) {
        return blocks;
      }
    } catch (e) {
      console.error("Failed to parse BLOCKS_PAYLOAD", e);
    }
  }

  // Fallback to primitive heuristic parsing
  const cleanText = text.replace(/<!-- BLOCKS_PAYLOAD:.*? -->/, '').trim();
  const regex = /(<ImageBlock[\s\S]*?\/>)/g;
  const parts = cleanText.split(regex);
  const result: any[] = [];
  
  parts.forEach((part, index) => {
    if (!part) return;
    const trimmed = part.trim();
    if (trimmed.startsWith('<ImageBlock')) {
      const srcMatch = part.match(/src="([^"]*)"/);
      const altMatch = part.match(/alt="([^"]*)"/);
      const captionMatch = part.match(/caption="([^"]*)"/);
      const locationMatch = part.match(/location="([^"]*)"/);
      const creditMatch = part.match(/credit="([^"]*)"/);
      const alignMatch = part.match(/align="([^"]*)"/) || part.match(/alignment="([^"]*)"/);
      
      const srcVal = srcMatch ? srcMatch[1] : '';
      const isUploadingVal = srcVal === 'uploading';
      const uploadIdMatch = part.match(/uploadId="([^"]*)"/);
      const progressMatch = part.match(/progress="([^"]*)"/);
      
      result.push({
        id: uploadIdMatch ? uploadIdMatch[1] : generateUniqueId(`img_${index}`),
        type: 'image',
        src: srcVal,
        alt: altMatch ? altMatch[1] : 'Image',
        caption: captionMatch ? captionMatch[1] : '',
        location: locationMatch ? locationMatch[1] : '',
        credit: creditMatch ? creditMatch[1] : '',
        align: (alignMatch ? alignMatch[1] : 'center') as 'left' | 'center' | 'right' | 'full',
        isUploading: isUploadingVal,
        uploadId: uploadIdMatch ? uploadIdMatch[1] : '',
        progress: progressMatch ? Number(progressMatch[1]) : 0
      });
    } else {
      const subParts = part.split(/\n\s*\n/);
      subParts.forEach((sub, subIdx) => {
        const subTrim = sub.trim();
        if (!subTrim) return;
        const id = generateUniqueId(`blk_${index}_${subIdx}`);
        
        if (subTrim === '---' || subTrim === '***') {
          result.push({ id, type: 'divider' });
        } else if (subTrim.startsWith('```')) {
          const lines = sub.split('\n');
          const codeLines = lines[0].startsWith('```') ? lines.slice(1, -1) : lines;
          result.push({ id, type: 'code', content: codeLines.join('\n') });
        } else if (subTrim.startsWith('[Choice]') || subTrim.startsWith('--callout')) {
          result.push({ id, type: 'callout', content: subTrim.replace(/^--callout\s*/, '') });
        } else if (subTrim.startsWith('|') && subTrim.includes('|---')) {
          result.push({ id, type: 'table', content: subTrim });
        } else if (subTrim.startsWith('#')) {
          const hMatch = subTrim.match(/^(#{1,6})\s+([\s\S]*)$/);
          const level = hMatch ? hMatch[1].length : 2;
          const content = hMatch ? hMatch[2] : subTrim.replace(/^#+\s*/, '');
          result.push({ id, type: 'heading', level, content });
        } else if (subTrim.startsWith('>')) {
          const content = subTrim.replace(/^>\s*/, '');
          result.push({ id, type: 'quote', content });
        } else if (subTrim.startsWith('- ') || subTrim.startsWith('* ') || /^\d+\.\s/.test(subTrim)) {
          result.push({ id, type: 'list', content: subTrim });
        } else {
          result.push({ id, type: 'text', content: sub });
        }
      });
    }
  });

  if (result.length === 0) {
    result.push({ id: generateUniqueId('init_p'), type: 'text', content: '' });
  }
  return result;
};

export const compileFromBlocks = (blocks: any[]) => {
  const md = blocks.map(b => {
    if (b.type === 'image') {
      let tag = `<ImageBlock\n  src="${b.src}"\n  alt="${b.alt || 'Image'}"`;
      if (b.caption) tag += `\n  caption="${b.caption}"`;
      if (b.location) tag += `\n  location="${b.location}"`;
      if (b.credit) tag += `\n  credit="${b.credit}"`;
      if (b.align && b.align !== 'center') tag += `\n  align="${b.align}"`;
      if (b.isUploading) {
        if (b.uploadId) tag += `\n  uploadId="${b.uploadId}"`;
        if (b.progress) tag += `\n  progress="${b.progress}"`;
      }
      tag += '\n/>';
      return tag;
    } else if (b.type === 'heading') {
      return `${'#'.repeat(b.level || 2)} ${b.content}`;
    } else if (b.type === 'quote') {
      return `> ${b.content}`;
    } else if (b.type === 'list') {
      return b.content;
    } else if (b.type === 'divider') {
      return '---';
    } else if (b.type === 'code') {
      return `\`\`\`\n${b.content}\n\`\`\``;
    } else if (b.type === 'callout') {
      return `> ${b.content}`;
    } else if (b.type === 'table') {
      return b.content;
    } else if (b.type === 'embed') {
      return `<iframe src="${b.src}" width="100%" height="450" frameborder="0" allowfullscreen caption="${b.caption || ''}"></iframe>`;
    } else {
      return b.content;
    }
  }).join('\n\n');

  // Safely encode JSON to prevent premature comment closure `-->`
  const jsonEncoded = JSON.stringify(blocks).replace(/--/g, '\\u002D\\u002D');
  return md + `\n\n<!-- BLOCKS_PAYLOAD:${jsonEncoded} -->`;
};
