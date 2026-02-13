'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="text-sm text-destructive whitespace-pre-wrap p-2 bg-muted/30 rounded-md">
        Mermaid error: {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto my-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
