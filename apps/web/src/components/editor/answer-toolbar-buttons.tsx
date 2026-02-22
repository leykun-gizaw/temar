'use client';

import * as React from 'react';

import {
  BoldIcon,
  Code2Icon,
  FileCodeIcon,
  HighlighterIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PlusIcon,
  SquareIcon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from '@/components/ui/history-toolbar-button';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from '@/components/ui/toolbar';
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from '@/components/ui/indent-toolbar-button';
import { insertBlock } from '@/components/editor/transforms';

function AnswerInsertToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const items = [
    { icon: <FileCodeIcon />, label: 'Code Block', value: KEYS.codeBlock },
    {
      icon: <PenToolIcon />,
      label: 'Code Drawing',
      value: 'code_drawing' as string,
    },
    { icon: <TableIcon />, label: 'Table', value: KEYS.table },
    { icon: <MinusIcon />, label: 'Divider', value: KEYS.hr },
    { icon: <ListIcon />, label: 'Bulleted list', value: KEYS.ul },
    { icon: <ListOrderedIcon />, label: 'Numbered list', value: KEYS.ol },
    { icon: <SquareIcon />, label: 'To-do list', value: KEYS.listTodo },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert" isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        <ToolbarMenuGroup label="Insert block">
          {items.map(({ icon, label, value }) => (
            <DropdownMenuItem
              key={value}
              className="min-w-[180px]"
              onSelect={() => {
                insertBlock(editor, value);
                editor.tf.focus();
              }}
            >
              {icon}
              {label}
            </DropdownMenuItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AnswerToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <AnswerInsertToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <div className="grow" />

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
          <HighlighterIcon />
        </MarkToolbarButton>
      </ToolbarGroup>
    </div>
  );
}
