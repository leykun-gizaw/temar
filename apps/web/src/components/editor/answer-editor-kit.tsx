'use client';

import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ListKit } from './plugins/list-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const AnswerEditorKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...CodeBlockKit,
  ...ListKit,
  ...AutoformatKit,
  ...MarkdownKit,
];
