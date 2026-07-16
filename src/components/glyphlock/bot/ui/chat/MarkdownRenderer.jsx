import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

/**
 * DACO 007 Phase B — full markdown rendering for bot messages:
 * GFM tables, code blocks with copy button, safe external links,
 * lists, blockquotes. Shared by GlyphBot main and Jr surfaces.
 */
export default function MarkdownRenderer({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="text-sm leading-relaxed max-w-none
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
        [&_p]:my-1.5 [&_p]:text-slate-100
        [&_strong]:text-amber-300 [&_strong]:font-semibold
        [&_em]:text-slate-300
        [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:text-slate-200
        [&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:text-slate-200
        [&_li]:my-0.5
        [&_a]:text-amber-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-all
        [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-2
        [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-amber-200 [&_h3]:mt-2 [&_h3]:mb-1
        [&_blockquote]:border-l-2 [&_blockquote]:border-amber-400/50 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-slate-400 [&_blockquote]:italic
        [&_hr]:border-white/10 [&_hr]:my-3"
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
        ),
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const isBlock = /language-/.test(className || '') || String(children).includes('\n');
          return isBlock
            ? <CodeBlock className={className}>{children}</CodeBlock>
            : <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 text-[0.85em] font-mono">{children}</code>;
        },
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/[0.05]">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold text-amber-200 border-b border-white/10">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 text-slate-300 border-b border-white/5">{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}