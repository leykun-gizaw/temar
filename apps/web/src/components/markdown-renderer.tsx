'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneLight,
  oneDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();

  const components: Components = {
    // In react-markdown v9+, inline vs block code is detected by whether
    // the `className` contains a `language-*` match (fenced blocks always have it).
    code({ className: cls, children: codeChildren, ...rest }) {
      const match = /language-(\w+)/.exec(cls ?? '');

      if (!match) {
        // Inline code — no language class
        return (
          <code
            className="rounded px-1 py-0.5 bg-muted font-mono text-[0.85em]"
            {...rest}
          >
            {codeChildren}
          </code>
        );
      }

      const language = match[1];

      return (
        <div className="my-3 rounded-md overflow-hidden border border-border">
          <div className="flex items-center px-3 py-1 bg-muted border-b border-border">
            <span className="text-[11px] font-mono text-muted-foreground">
              {language}
            </span>
          </div>
          <SyntaxHighlighter
            style={resolvedTheme === 'dark' ? oneDark : oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.8rem',
              background: 'transparent',
            }}
          >
            {String(codeChildren).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },

    // Pre wraps fenced code blocks — our code handler renders the container itself.
    pre({ children: preChildren }) {
      return <>{preChildren}</>;
    },

    // Tables with horizontal scrolling
    table({ children: tableChildren, ...rest }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse text-sm" {...rest}>
            {tableChildren}
          </table>
        </div>
      );
    },
    thead({ children: theadChildren, ...rest }) {
      return (
        <thead className="bg-muted/50" {...rest}>
          {theadChildren}
        </thead>
      );
    },
    th({ children: thChildren, ...rest }) {
      return (
        <th
          className="border border-border px-3 py-1.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground"
          {...rest}
        >
          {thChildren}
        </th>
      );
    },
    td({ children: tdChildren, ...rest }) {
      return (
        <td className="border border-border px-3 py-1.5 align-top" {...rest}>
          {tdChildren}
        </td>
      );
    },
    tr({ children: trChildren, ...rest }) {
      return (
        <tr
          className="even:bg-muted/20 hover:bg-muted/30 transition-colors"
          {...rest}
        >
          {trChildren}
        </tr>
      );
    },

    // Blockquotes
    blockquote({ children: bqChildren, ...rest }) {
      return (
        <blockquote
          className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-3"
          {...rest}
        >
          {bqChildren}
        </blockquote>
      );
    },

    // Links
    a({ children: aChildren, href, ...rest }) {
      return (
        <a
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          {...rest}
        >
          {aChildren}
        </a>
      );
    },

    // Headings
    h1({ children: hChildren, ...rest }) {
      return (
        <h1 className="text-xl font-bold mt-5 mb-2 first:mt-0" {...rest}>
          {hChildren}
        </h1>
      );
    },
    h2({ children: hChildren, ...rest }) {
      return (
        <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...rest}>
          {hChildren}
        </h2>
      );
    },
    h3({ children: hChildren, ...rest }) {
      return (
        <h3
          className="text-base font-semibold mt-3 mb-1.5 first:mt-0"
          {...rest}
        >
          {hChildren}
        </h3>
      );
    },
    h4({ children: hChildren, ...rest }) {
      return (
        <h4 className="text-sm font-semibold mt-3 mb-1 first:mt-0" {...rest}>
          {hChildren}
        </h4>
      );
    },

    // Lists
    ul({ children: listChildren, ...rest }) {
      return (
        <ul className="my-2 ml-4 space-y-0.5 list-disc" {...rest}>
          {listChildren}
        </ul>
      );
    },
    ol({ children: listChildren, ...rest }) {
      return (
        <ol className="my-2 ml-4 space-y-0.5 list-decimal" {...rest}>
          {listChildren}
        </ol>
      );
    },
    li({ children: liChildren, ...rest }) {
      return (
        <li className="leading-relaxed pl-0.5" {...rest}>
          {liChildren}
        </li>
      );
    },

    // Horizontal rule
    hr({ ...rest }) {
      return <hr className="my-4 border-border" {...rest} />;
    },

    // Paragraphs
    p({ children: pChildren, ...rest }) {
      return (
        <p className="leading-relaxed mb-2 last:mb-0" {...rest}>
          {pChildren}
        </p>
      );
    },

    // Strong / emphasis
    strong({ children: sChildren, ...rest }) {
      return (
        <strong className="font-semibold" {...rest}>
          {sChildren}
        </strong>
      );
    },
    em({ children: eChildren, ...rest }) {
      return (
        <em className="italic" {...rest}>
          {eChildren}
        </em>
      );
    },
  };

  return (
    <div className={cn('text-foreground text-sm', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
