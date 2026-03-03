'use client';

import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { CodeDrawingKit } from './plugins/code-drawing-kit';

export const AnswerEditorKit = [
  ...BasicNodesKit,
  ...CodeBlockKit,
  ...CodeDrawingKit,
];
