'use client';

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, ElementNode } from 'lexical';

// ── LayoutContainerNode ────────────────────────────────────────

export type SerializedLayoutContainerNode = Spread<
  { templateColumns: string },
  SerializedElementNode
>;

export class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  static override getType(): string {
    return 'layout-container';
  }

  static override clone(node: LayoutContainerNode): LayoutContainerNode {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  constructor(templateColumns: string, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'grid';
    div.style.gridTemplateColumns = this.__templateColumns;
    div.style.gap = '12px';
    const className = config.theme.layoutContainer;
    if (className) div.className = className;
    return div;
  }

  override updateDOM(
    prevNode: LayoutContainerNode,
    dom: HTMLElement
  ): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  getTemplateColumns(): string {
    return this.__templateColumns;
  }

  setTemplateColumns(value: string): void {
    const writable = this.getWritable();
    writable.__templateColumns = value;
  }

  static override importJSON(
    serializedNode: SerializedLayoutContainerNode
  ): LayoutContainerNode {
    return $createLayoutContainerNode(serializedNode.templateColumns);
  }

  override exportJSON(): SerializedLayoutContainerNode {
    return {
      ...super.exportJSON(),
      type: 'layout-container',
      version: 1,
      templateColumns: this.__templateColumns,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.style.display = 'grid';
    element.style.gridTemplateColumns = this.__templateColumns;
    element.style.gap = '12px';
    element.setAttribute('data-layout-columns', this.__templateColumns);
    return { element };
  }

  override isShadowRoot(): boolean {
    return true;
  }

  override canBeEmpty(): boolean {
    return false;
  }
}

// ── LayoutItemNode ─────────────────────────────────────────────

export type SerializedLayoutItemNode = SerializedElementNode;

export class LayoutItemNode extends ElementNode {
  static override getType(): string {
    return 'layout-item';
  }

  static override clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.style.minHeight = '60px';
    const className = config.theme.layoutItem;
    if (className) div.className = className;
    return div;
  }

  override updateDOM(): boolean {
    return false;
  }

  static override importJSON(
    _serializedNode: SerializedLayoutItemNode
  ): LayoutItemNode {
    return $createLayoutItemNode();
  }

  override exportJSON(): SerializedLayoutItemNode {
    return {
      ...super.exportJSON(),
      type: 'layout-item',
      version: 1,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    return { element };
  }

  override isShadowRoot(): boolean {
    return true;
  }

  override canBeEmpty(): boolean {
    return false;
  }
}

// ── Helpers ────────────────────────────────────────────────────

export function $createLayoutContainerNode(
  templateColumns = '1fr 1fr'
): LayoutContainerNode {
  return $applyNodeReplacement(new LayoutContainerNode(templateColumns));
}

export function $createLayoutItemNode(): LayoutItemNode {
  return $applyNodeReplacement(new LayoutItemNode());
}

export function $isLayoutContainerNode(
  node: LexicalNode | null | undefined
): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}

export function $isLayoutItemNode(
  node: LexicalNode | null | undefined
): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}
