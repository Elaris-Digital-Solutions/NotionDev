import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  content: any;
  onClick: () => void;
  className?: string;
}

export function BlockRenderer({ content, onClick, className }: BlockRendererProps) {
  const html = useMemo(() => {
    if (!content) return '<p></p>';
    try {
      // Use the same extensions as the editor to ensure consistent rendering
      return generateHTML(content, [StarterKit]);
    } catch (e) {
      console.error('Failed to render block HTML', e);
      return '<p>Invalid Content</p>';
    }
  }, [content]);

  return (
    <div 
      className={cn("prose prose-sm max-w-none cursor-text min-h-[1.5rem]", className)}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
