'use client';

import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@temar/ui';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading editor...
      </div>
    ),
  },
);

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'scala', label: 'Scala' },
  { value: 'r', label: 'R' },
  { value: 'dart', label: 'Dart' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
  { value: 'lua', label: 'Lua' },
] as const;

interface MonacoEditorLazyProps {
  value: string;
  onChange: (value: string) => void;
  defaultLanguage?: string;
  readOnly?: boolean;
  headerActions?: React.ReactNode;
}

export default function MonacoEditorLazy({
  value,
  onChange,
  defaultLanguage = 'javascript',
  readOnly = false,
  headerActions,
}: MonacoEditorLazyProps) {
  const [language, setLanguage] = useState(defaultLanguage);
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '');
    },
    [onChange],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border rounded-t-xl">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-6 w-[130px] text-xs rounded-md bg-muted border-border text-muted-foreground focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {headerActions && (
          <div className="flex items-center gap-1.5">
            {headerActions}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 rounded-b-xl overflow-hidden">
        <MonacoEditor
          language={language}
          theme={monacoTheme}
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            readOnly,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
