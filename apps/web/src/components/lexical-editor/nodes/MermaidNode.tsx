'use client';

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode } from 'lexical';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Pencil, Trash2, Check } from 'lucide-react';

export type SerializedMermaidNode = Spread<
  { code: string },
  SerializedLexicalNode
>;

// Global counter to ensure every mermaid.render() call gets a unique ID.
// Mermaid internally creates <svg id="..."> elements and fails if the same
// ID is reused before the previous one is cleaned up.
let mermaidRenderCounter = 0;

export async function renderMermaid(
  code: string
): Promise<{ svg: string; error: null } | { svg: null; error: string }> {
  if (!code.trim()) return { svg: '', error: null };
  const renderId = `mermaid_r${++mermaidRenderCounter}`;
  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
    // Remove any leftover element from a previous render with this ID
    // (shouldn't happen with unique IDs, but defensive)
    const stale = document.getElementById(renderId);
    if (stale) stale.remove();

    const { svg } = await mermaid.render(renderId, code);
    return { svg, error: null };
  } catch (e) {
    // Mermaid leaves a broken container in the DOM on error — clean it up
    const broken = document.getElementById('d' + renderId);
    if (broken) broken.remove();
    return {
      svg: null,
      error: e instanceof Error ? e.message : 'Failed to render diagram',
    };
  }
}

function MermaidComponent({
  code,
  nodeKey,
}: {
  code: string;
  nodeKey: NodeKey;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [previewSvg, setPreviewSvg] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isEditable = editor.isEditable();

  // Render the current code
  useEffect(() => {
    let cancelled = false;
    renderMermaid(code).then((result) => {
      if (cancelled) return;
      if (result.error !== null) {
        setError(result.error);
        setSvg('');
      } else {
        setSvg(result.svg ?? '');
        setError(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Live preview while editing (debounced)
  useEffect(() => {
    if (!isEditing || !editCode.trim()) {
      setPreviewSvg('');
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      renderMermaid(editCode).then((result) => {
        if (cancelled) return;
        if (result.error !== null) {
          setPreviewError(result.error);
          setPreviewSvg('');
        } else {
          setPreviewSvg(result.svg ?? '');
          setPreviewError(null);
        }
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editCode, isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditCode(code);
    setIsEditing(true);
  }, [code]);

  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isMermaidNode(node)) {
        node.setCode(editCode);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, editCode]);

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  }, [editor, nodeKey]);

  if (isEditing) {
    return (
      <div className="border rounded-md my-2 overflow-hidden" contentEditable={false}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
          <span className="text-xs font-medium text-muted-foreground">
            Mermaid Editor
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              <Check className="w-3 h-3" /> Done
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-2">
            <textarea
              className="w-full min-h-[150px] bg-background border rounded-md p-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="p-2 flex items-center justify-center overflow-x-auto min-h-[150px]">
            {previewError && (
              <p className="text-xs text-red-500 text-center">{previewError}</p>
            )}
            {previewSvg && (
              <div
                className="[&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            )}
            {!previewSvg && !previewError && (
              <p className="text-xs text-muted-foreground">Preview</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="border border-red-300 bg-red-50 dark:bg-red-950/20 rounded-md p-4 my-2 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditable && isHovered && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              className="p-1 rounded-sm bg-background border shadow-sm hover:bg-accent/50 transition-colors"
              onClick={handleStartEdit}
              title="Edit diagram"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
      className="my-2 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditable && isHovered && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            type="button"
            className="p-1.5 rounded-sm bg-background border shadow-sm hover:bg-accent/50 transition-colors"
            onClick={handleStartEdit}
            title="Edit diagram"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-sm bg-background border shadow-sm hover:bg-accent/50 text-red-500 transition-colors"
            onClick={handleDelete}
            title="Delete diagram"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
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
