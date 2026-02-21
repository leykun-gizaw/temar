'use client';

import { CodeDrawingPlugin } from '@platejs/code-drawing/react';
import { CodeDrawingElement } from '@/components/ui/code-drawing-node';

export const CodeDrawingKit = [
  CodeDrawingPlugin.extend({
    key: 'code_drawing',
    node: { isVoid: true, isElement: true },
  }).withComponent(CodeDrawingElement),
];
