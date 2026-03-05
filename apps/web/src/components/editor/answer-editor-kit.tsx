'use client';

import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { CodeDrawingKit } from './plugins/code-drawing-kit';
import { ListKit } from './plugins/list-kit';
import { SlashKit } from './plugins/slash-kit';

export const AnswerEditorKit = [
  ...BasicNodesKit,
  ...CodeBlockKit,
  ...CodeDrawingKit,
  ...ListKit,
  ...SlashKit,
  ...AutoformatKit,
];
