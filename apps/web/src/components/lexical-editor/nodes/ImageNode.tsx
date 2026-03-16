'use client';

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode } from 'lexical';
import { JSX, useCallback, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export interface ImagePayload {
  altText: string;
  height?: number;
  key?: NodeKey;
  src: string;
  width?: number;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const imgRef = useRef<HTMLImageElement>(null);
  const [, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isSelected, setIsSelected] = useState(false);
  const isEditable = editor.isEditable();

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!imgRef.current) return;

      const startX = e.clientX;
      const startWidth = imgRef.current.offsetWidth;
      const startHeight = imgRef.current.offsetHeight;
      const ratio = startWidth / startHeight;

      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        let newWidth = startWidth;

        if (corner === 'se' || corner === 'ne') {
          newWidth = Math.max(100, startWidth + dx);
        } else {
          newWidth = Math.max(100, startWidth - dx);
        }

        const newHeight = Math.round(newWidth / ratio);
        setCurrentWidth(newWidth);
        setCurrentHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Persist to node
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node && $isImageNode(node)) {
            node.setDimensions(currentWidth, currentHeight);
          }
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [editor, nodeKey, currentWidth, currentHeight]
  );

  return (
    <div
      className={`relative inline-block max-w-full my-2 ${
        isSelected ? 'ring-2 ring-primary rounded-md' : ''
      }`}
      onClick={() => isEditable && setIsSelected(!isSelected)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={altText}
        style={{
          width: currentWidth ? `${currentWidth}px` : undefined,
          height: currentHeight ? `${currentHeight}px` : undefined,
          maxWidth: '100%',
        }}
        className="rounded-md"
        draggable={false}
      />
      {altText && (
        <span className="block text-xs text-muted-foreground mt-1 text-center">
          {altText}
        </span>
      )}
      {/* Resize handles */}
      {isEditable && isSelected && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <div
              key={corner}
              className={`absolute w-3 h-3 bg-primary border-2 border-background rounded-sm cursor-${
                corner === 'nw' || corner === 'se' ? 'nwse' : 'nesw'
              }-resize z-10 ${
                corner.includes('n') ? 'top-0' : 'bottom-0'
              } ${corner.includes('w') ? 'left-0' : 'right-0'} ${
                corner.includes('n') ? '-translate-y-1/2' : 'translate-y-1/2'
              } ${
                corner.includes('w') ? '-translate-x-1/2' : 'translate-x-1/2'
              }`}
              onMouseDown={(e) => handleResizeStart(e, corner)}
            />
          ))}
        </>
      )}
    </div>
  );
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;

  static override getType(): string {
    return 'image';
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className) span.className = className;
    return span;
  }

  override updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setDimensions(width?: number, height?: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ src, altText, width, height });
  }

  override exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode: HTMLElement): DOMConversionOutput | null => {
          const img = domNode as HTMLImageElement;
          const { src, alt, width, height } = img;
          const node = $createImageNode({
            src,
            altText: alt || '',
            width: width || undefined,
            height: height || undefined,
          });
          return { node };
        },
        priority: 0,
      }),
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) element.setAttribute('width', String(this.__width));
    if (this.__height) element.setAttribute('height', String(this.__height));
    return { element };
  }

  override decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }

  override isInline(): boolean {
    return false;
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      payload.src,
      payload.altText,
      payload.width,
      payload.height,
      payload.key
    )
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
