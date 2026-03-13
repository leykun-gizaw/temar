'use client';

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import { JSX, useEffect, useId, useRef, useState } from 'react';

export type SerializedMermaidNode = Spread<
  { code: string },
  SerializedLexicalNode
>;

function MermaidComponent({
  code,
}: {
  code: string;
  nodeKey: NodeKey;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/:/g, '_');

  useEffect(() => {
    const render = async () => {
      if (!code.trim()) {
        setSvg('');
        setError(null);
        return;
      }
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid_${id}`,
          code
        );
        setSvg(renderedSvg);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to render diagram');
        setSvg('');
      }
    };
    render();
  }, [code, id]);

  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 dark:bg-red-950/20 rounded-md p-4 my-2">
        <p className="text-red-500 text-sm font-medium mb-1">Mermaid Error</p>
        <pre className="text-xs text-red-400 whitespace-pre-wrap">{error}</pre>
        <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-mono">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="border rounded-md p-4 my-2 text-muted-foreground text-sm text-center">
        Loading diagram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-2 flex justify-center overflow-x-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static override getType(): string {
    return 'mermaid';
  }

  static override clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__code, node.__key);
  }

  constructor(code: string, key?: NodeKey) {
    super(key);
    this.__code = code;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const theme = config.theme;
    const className = theme.mermaid;
    if (className) div.className = className;
    return div;
  }

  override updateDOM(): false {
    return false;
  }

  getCode(): string {
    return this.__code;
  }

  setCode(code: string): void {
    const writable = this.getWritable();
    writable.__code = code;
  }

  static override importJSON(
    serializedNode: SerializedMermaidNode
  ): MermaidNode {
    return $createMermaidNode(serializedNode.code);
  }

  override exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      code: this.__code,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('pre');
    element.setAttribute('data-lexical-mermaid', 'true');
    element.textContent = this.__code;
    return { element };
  }

  override decorate(): JSX.Element {
    return <MermaidComponent code={this.__code} nodeKey={this.getKey()} />;
  }

  override isInline(): boolean {
    return false;
  }
}

export function $createMermaidNode(code = ''): MermaidNode {
  return $applyNodeReplacement(new MermaidNode(code));
}

export function $isMermaidNode(
  node: LexicalNode | null | undefined
): node is MermaidNode {
  return node instanceof MermaidNode;
}
