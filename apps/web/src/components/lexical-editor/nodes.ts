import type { Klass, LexicalNode } from 'lexical';

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { ImageNode } from './nodes/ImageNode';
import { EquationNode } from './nodes/EquationNode';
import { MermaidNode } from './nodes/MermaidNode';
import { YouTubeNode } from './nodes/YouTubeNode';
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
} from './nodes/CollapsibleNodes';
import { PageBreakNode } from './nodes/PageBreakNode';
import {
  LayoutContainerNode,
  LayoutItemNode,
} from './nodes/LayoutNodes';

export const editorNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageNode,
  EquationNode,
  MermaidNode,
  YouTubeNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  PageBreakNode,
  LayoutContainerNode,
  LayoutItemNode,
];
