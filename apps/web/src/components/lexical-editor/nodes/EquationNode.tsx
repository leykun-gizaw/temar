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
import { type JSX, useEffect, useRef, useState } from 'react';

export type SerializedEquationNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

function EquationComponent({
  equation,
  inline,
}: {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
}): JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return;
      try {
        const katex = (await import('katex')).default;
        katex.render(equation, containerRef.current, {
          displayMode: !inline,
          throwOnError: false,
          errorColor: '#cc0000',
        });
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to render equation');
      }
    };
    render();
  }, [equation, inline]);

  if (error) {
    return (
      <span className="text-red-500 font-mono text-sm" title={error}>
        {equation}
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={inline ? 'inline' : 'block text-center my-2'}
    />
  );
}

export class EquationNode extends DecoratorNode<JSX.Element> {
  __equation: string;
  __inline: boolean;

  static override getType(): string {
    return 'equation';
  }

  static override clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = this.__inline
      ? document.createElement('span')
      : document.createElement('div');
    const theme = config.theme;
    const className = theme.equation;
    if (className) element.className = className;
    return element;
  }

  override updateDOM(): false {
    return false;
  }

  getEquation(): string {
    return this.__equation;
  }

  getInline(): boolean {
    return this.__inline;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  static override importJSON(
    serializedNode: SerializedEquationNode
  ): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline);
  }

  override exportJSON(): SerializedEquationNode {
    return {
      type: 'equation',
      version: 1,
      equation: this.__equation,
      inline: this.__inline,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = this.__inline
      ? document.createElement('span')
      : document.createElement('div');
    element.setAttribute('data-lexical-equation', this.__equation);
    element.setAttribute('data-lexical-inline', String(this.__inline));
    element.textContent = this.__equation;
    return { element };
  }

  override decorate(): JSX.Element {
    return (
      <EquationComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.getKey()}
      />
    );
  }

  override isInline(): boolean {
    return this.__inline;
  }
}

export function $createEquationNode(
  equation = '',
  inline = true
): EquationNode {
  return $applyNodeReplacement(new EquationNode(equation, inline));
}

export function $isEquationNode(
  node: LexicalNode | null | undefined
): node is EquationNode {
  return node instanceof EquationNode;
}
