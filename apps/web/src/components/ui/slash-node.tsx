'use client';

import * as React from 'react';

import {
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
  TableIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useEditorRef,
} from 'platejs/react';

import { insertBlock } from '@/components/editor/transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@/components/ui/inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    keywords?: string[];
    label: string;
    value: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'Basic blocks',
    items: [
      {
        icon: <PilcrowIcon className="size-4" />,
        keywords: ['paragraph', 'text'],
        label: 'Text',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon className="size-4" />,
        keywords: ['title', 'h1'],
        label: 'Heading 1',
        value: 'h1',
      },
      {
        icon: <Heading2Icon className="size-4" />,
        keywords: ['subtitle', 'h2'],
        label: 'Heading 2',
        value: 'h2',
      },
      {
        icon: <Heading3Icon className="size-4" />,
        keywords: ['h3'],
        label: 'Heading 3',
        value: 'h3',
      },
      {
        icon: <QuoteIcon className="size-4" />,
        keywords: ['blockquote', 'quote'],
        label: 'Quote',
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon className="size-4" />,
        keywords: ['divider', 'separator', 'hr'],
        label: 'Divider',
        value: KEYS.hr,
      },
    ],
  },
  {
    group: 'Lists',
    items: [
      {
        icon: <ListIcon className="size-4" />,
        keywords: ['unordered', 'ul'],
        label: 'Bulleted list',
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon className="size-4" />,
        keywords: ['ordered', 'ol'],
        label: 'Numbered list',
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon className="size-4" />,
        keywords: ['checklist', 'todo', 'checkbox'],
        label: 'To-do list',
        value: KEYS.listTodo,
      },
    ],
  },
  {
    group: 'Code & Diagrams',
    items: [
      {
        icon: <FileCodeIcon className="size-4" />,
        keywords: ['code', 'codeblock', 'snippet'],
        label: 'Code Block',
        value: KEYS.codeBlock,
      },
      {
        icon: <PenToolIcon className="size-4" />,
        keywords: ['drawing', 'mermaid', 'diagram', 'plantuml'],
        label: 'Code Drawing',
        value: 'code_drawing',
      },
      {
        icon: <TableIcon className="size-4" />,
        keywords: ['table', 'grid'],
        label: 'Table',
        value: KEYS.table,
      },
    ],
  },
];

export function SlashInputElement(props: PlateElementProps) {
  const { children } = props;
  const editor = useEditorRef();

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={props.element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(({ icon, keywords, label, value }) => (
                <InlineComboboxItem
                  key={value}
                  value={value}
                  keywords={keywords}
                  onClick={() => insertBlock(editor, value)}
                  label={label}
                >
                  <div className="mr-2 text-muted-foreground">{icon}</div>
                  {label}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {children}
    </PlateElement>
  );
}
