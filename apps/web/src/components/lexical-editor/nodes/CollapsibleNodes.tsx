'use client';

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, ElementNode } from 'lexical';

// --- CollapsibleContainerNode ---

export type SerializedCollapsibleContainerNode = Spread<
  { open: boolean },
  SerializedElementNode
>;

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  static getType(): string {
    return 'collapsible-container';
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  constructor(open: boolean = true, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('details');
    dom.classList.add(
      'border',
      'border-border',
      'rounded-md',
      'my-2',
      'overflow-hidden'
    );
    if (this.__open) dom.open = true;
    return dom;
  }

  updateDOM(
    prevNode: CollapsibleContainerNode,
    dom: HTMLDetailsElement
  ): boolean {
    if (prevNode.__open !== this.__open) {
      dom.open = this.__open;
    }
    return false;
  }

  getOpen(): boolean {
    return this.__open;
  }

  toggleOpen(): void {
    const writable = this.getWritable();
    writable.__open = !writable.__open;
  }

  static importJSON(
    serializedNode: SerializedCollapsibleContainerNode
  ): CollapsibleContainerNode {
    return $createCollapsibleContainerNode(serializedNode.open);
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-container',
      version: 1,
      open: this.__open,
    };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createCollapsibleContainerNode(
  open: boolean = true
): CollapsibleContainerNode {
  return $applyNodeReplacement(new CollapsibleContainerNode(open));
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}

// --- CollapsibleTitleNode ---

export type SerializedCollapsibleTitleNode = SerializedElementNode;

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-title';
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add(
      'font-medium',
      'p-3',
      'cursor-pointer',
      'select-none',
      'hover:bg-muted/50',
      'transition-colors',
      'list-none'
    );
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(): CollapsibleTitleNode {
    return $createCollapsibleTitleNode();
  }

  exportJSON(): SerializedCollapsibleTitleNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-title',
      version: 1,
    };
  }

  collapseAtStart(): boolean {
    return true;
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return $applyNodeReplacement(new CollapsibleTitleNode());
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}

// --- CollapsibleContentNode ---

export type SerializedCollapsibleContentNode = SerializedElementNode;

export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return 'collapsible-content';
  }

  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('p-3', 'border-t', 'border-border');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(): CollapsibleContentNode {
    return $createCollapsibleContentNode();
  }

  exportJSON(): SerializedCollapsibleContentNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-content',
      version: 1,
    };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return $applyNodeReplacement(new CollapsibleContentNode());
}

export function $isCollapsibleContentNode(
  node: LexicalNode | null | undefined
): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode;
}
