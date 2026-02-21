'use client';

import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { CodeDrawingKit } from './plugins/code-drawing-kit';
import { ListKit } from './plugins/list-kit';
import { SlashKit } from './plugins/slash-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const AnswerEditorKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...CodeBlockKit,
  ...CodeDrawingKit,
  ...ListKit,
  ...AutoformatKit,
  ...SlashKit,
  ...MarkdownKit,
];
