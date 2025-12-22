import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand, getSuggestionItems, renderItems } from './extensions/SlashCommand';

interface TiptapBlockProps {
  content: any;
  onUpdate: (content: any, plainText: string) => void;
  onBlur: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export function TiptapBlock({ content, onUpdate, onBlur, onKeyDown, autoFocus = true }: TiptapBlockProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[1.5rem] w-full max-w-none',
      },
      handleKeyDown: (view, event) => {
        if (onKeyDown) {
          // React event wrapper is barely needed here, can pass native
          // But for consistency we might just trigger simple checks
          // We can just bubble up specific keys if needed
          return false;
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      // Debounce should happen at parent level or here. 
      // For now, we pass up immediately, but parent should guard db writes.
      // Actually, guardrails say: "Trigger: onBlur or Debounce".
      // We will implement onBlur saving in the wrapper. 
      // But we need to keep local state in sync? 
      // Actually, for Tiptap, we shouldn't lift state on every keystroke if it causes re-render of parent.
      // But assuming we want to save on blur, we need to pass the new content out.
    },
    onBlur: ({ editor }) => {
      onUpdate(editor.getJSON(), editor.getText());
      onBlur();
    },
  });

  // Cleanup on unmount is handled by useEditor automatically.

  // Handle external content updates? 
  // "Last Write Wins" warning: if content prop changes while editing, we might overwrite?
  // But we are in Edit Mode, we assume we have lock/focus. 
  // We generally ignore external content updates while focused to avoid cursor jumps.

  if (!editor) {
    return null;
  }

  // Pass keydown events to parent for navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div onKeyDown={handleKeyDown} className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
