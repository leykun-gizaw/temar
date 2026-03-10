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
import type { JSX } from 'react';

export type SerializedYouTubeNode = Spread<
  { videoID: string },
  SerializedLexicalNode
>;

function YouTubeComponent({
  videoID,
}: {
  videoID: string;
}): JSX.Element {
  return (
    <div className="my-2">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-md"
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    </div>
  );
}

export class YouTubeNode extends DecoratorNode<JSX.Element> {
  __id: string;

  static override getType(): string {
    return 'youtube';
  }

  static override clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const theme = config.theme;
    const className = theme.embedBlock;
    if (className) {
      if (typeof className === 'string') {
        div.className = className;
      } else if (className.base) {
        div.className = className.base;
      }
    }
    return div;
  }

  override updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  static override importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoID);
  }

  override exportJSON(): SerializedYouTubeNode {
    return {
      type: 'youtube',
      version: 1,
      videoID: this.__id,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('iframe');
    element.setAttribute(
      'src',
      `https://www.youtube-nocookie.com/embed/${this.__id}`
    );
    element.setAttribute('allowfullscreen', 'true');
    element.setAttribute('width', '560');
    element.setAttribute('height', '315');
    return { element };
  }

  override decorate(): JSX.Element {
    return <YouTubeComponent videoID={this.__id} />;
  }

  override isInline(): boolean {
    return false;
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return $applyNodeReplacement(new YouTubeNode(videoID));
}

export function $isYouTubeNode(
  node: LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
