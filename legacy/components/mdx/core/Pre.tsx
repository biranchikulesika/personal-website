'use client';

import { HTMLAttributes, useState, useRef } from 'react';
import { Check, Copy } from 'lucide-react';

export const Pre = ({ children, ...props }: HTMLAttributes<HTMLPreElement>) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const onCopy = () => {
    if (preRef.current) {
      // Find the inner code element to get text content, or just fallback to textContent
      const codeElement = preRef.current.querySelector('code');
      const text = codeElement ? codeElement.innerText : preRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-8 rounded-lg font-mono overflow-hidden bg-muted/40 border border-border">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onCopy}
          className="p-1.5 rounded-md bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#333] shadow-sm transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre
        ref={preRef}
        className="p-6 overflow-x-auto text-[12.5px] leading-relaxed max-md:text-[11.5px] select-text"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};
