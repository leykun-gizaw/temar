'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isCodeNode,
  CodeNode,
  getCodeLanguages,
  getDefaultCodeLanguage,
} from '@lexical/code';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { ChevronDown, Copy, Check } from 'lucide-react';

const CODE_LANGUAGES = getCodeLanguages();

export default function CodeActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [codeNodeKey, setCodeNodeKey] = useState<string | null>(null);
  const [language, setLanguage] = useState(getDefaultCodeLanguage());
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCodeNodeState = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      setCodeNodeKey(null);
      return;
    }

    const anchorNode = selection.anchor.getNode();
    const topElement = anchorNode.getTopLevelElementOrThrow();

    if ($isCodeNode(topElement)) {
      setCodeNodeKey(topElement.getKey());
      setLanguage(topElement.getLanguage() || getDefaultCodeLanguage());

      const domElement = editor.getElementByKey(topElement.getKey());
      if (domElement) {
        const rect = domElement.getBoundingClientRect();
        setPosition({ top: rect.top + 4, right: window.innerWidth - rect.right + 4 });
      }
    } else {
      setCodeNodeKey(null);
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateCodeNodeState();
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateCodeNodeState]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateCodeNodeState();
      });
    });
  }, [editor, updateCodeNodeState]);

  const onLanguageSelect = useCallback(
    (lang: string) => {
      if (!codeNodeKey) return;
      editor.update(() => {
        const node = $getNodeByKey(codeNodeKey);
        if ($isCodeNode(node)) {
          node.setLanguage(lang);
        }
      });
      setLanguage(lang);
      setShowDropdown(false);
    },
    [editor, codeNodeKey]
  );

  const onCopyCode = useCallback(() => {
    if (!codeNodeKey) return;
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(codeNodeKey);
      if ($isCodeNode(node)) {
        const text = node.getTextContent();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    });
  }, [editor, codeNodeKey]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  if (!codeNodeKey || !position) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1"
      style={{ top: position.top, right: position.right }}
    >
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
        >
          {language}
          <ChevronDown className="h-3 w-3" />
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-40 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md z-50">
            <div className="p-1">
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onLanguageSelect(lang)}
                  className={`flex w-full items-center rounded-sm px-2 py-1 text-xs font-mono cursor-pointer ${
                    language === lang
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCopyCode}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
