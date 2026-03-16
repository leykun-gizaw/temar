'use client';

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import { JSX } from 'react';

function PageBreakComponent(): JSX.Element {
  return (
    <div className="my-4 flex items-center gap-3 select-none" contentEditable={false}>
      <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">
        Page Break
      </span>
      <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
    </div>
  );
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  static override getType(): string {
    return 'page-break';
  }

  static override clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.pageBreak;
    if (className) div.className = className;
    return div;
  }

  override updateDOM(): false {
    return false;
  }

  static override importJSON(_serializedNode: SerializedLexicalNode): PageBreakNode {
    return $createPageBreakNode();
  }

  override exportJSON(): SerializedLexicalNode {
    return {
      type: 'page-break',
      version: 1,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('hr');
    element.setAttribute('data-page-break', 'true');
    return { element };
  }

  override decorate(): JSX.Element {
    return <PageBreakComponent />;
  }

  override isInline(): boolean {
    return false;
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return $applyNodeReplacement(new PageBreakNode());
}

export function $isPageBreakNode(
  node: LexicalNode | null | undefined
): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
