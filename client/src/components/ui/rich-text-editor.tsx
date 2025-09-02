import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Link, Type } from 'lucide-react';
import { Button } from './button';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className, 'data-testid': dataTestId }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content when value changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  }, [handleInput]);

  const toggleBold = useCallback(() => {
    execCommand('bold');
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Введите URL ссылки:');
    if (url) {
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      execCommand('createLink', formattedUrl);
    }
  }, [execCommand]);

  const removeFormatting = useCallback(() => {
    execCommand('removeFormat');
  }, [execCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleBold();
    }
    // Handle Ctrl+K for link
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      insertLink();
    }
  }, [toggleBold, insertLink]);

  return (
    <div className={`border rounded-md ${isFocused ? 'ring-2 ring-ring ring-offset-2' : ''} ${className || ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          className="h-8 w-8 p-0"
          title="Жирный (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
          title="Ссылка (Ctrl+K)"
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={removeFormatting}
          className="h-8 w-8 p-0"
          title="Очистить форматирование"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className="min-h-[100px] p-3 outline-none resize-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-gray-400 [&[data-placeholder]:empty]:before:pointer-events-none [&_a]:text-blue-600 [&_a]:underline [&_strong]:font-semibold"
        style={{ 
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
        data-testid={dataTestId}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}