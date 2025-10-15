import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Link, Type } from 'lucide-react';
import { Button } from './button';
import DOMPurify from 'dompurify';

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

  // Configure DOMPurify to allow only safe tags and attributes
  const sanitizeConfig = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'b'],
    ALLOWED_ATTR: ['href'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  // Initialize content when value changes from outside
  useEffect(() => {
    if (editorRef.current) {
      const sanitizedValue = DOMPurify.sanitize(value || '', sanitizeConfig);
      const currentContent = editorRef.current.textContent || '';
      const newContent = new DOMParser().parseFromString(sanitizedValue, 'text/html').body.textContent || '';
      
      if (currentContent !== newContent) {
        // Use textContent for safe update
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Clear and update safely
        while (editorRef.current.firstChild) {
          editorRef.current.removeChild(editorRef.current.firstChild);
        }
        
        // Parse sanitized HTML and append nodes
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedValue, 'text/html');
        const nodes = Array.from(doc.body.childNodes);
        
        nodes.forEach(node => {
          if (editorRef.current) {
            editorRef.current.appendChild(node.cloneNode(true));
          }
        });
      }
    }
  }, [value]);

  // Функция для очистки HTML от лишней разметки
  const cleanHTML = useCallback((html: string) => {
    // First pass - remove unwanted elements with regex
    let cleanedHTML = html
      .replace(/data-metadata="[^"]*"/g, '')
      .replace(/<\/?figmeta[^>]*>/g, '')
      .replace(/<!--.*?-->/g, '')
      .replace(/<\/?o:p[^>]*>/g, '')
      .replace(/<\/?meta[^>]*>/g, '')
      .replace(/mso-[^;]*:[^;]*;?/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/<span[^>]*>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/<div([^>]*)>/g, '<p$1>')
      .replace(/<\/div>/g, '</p>')
      .replace(/<p\s+[^>]*>/g, '<p>')
      .replace(/<br\s*\/?>/g, '<br>')
      .replace(/\s+/g, ' ')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .trim();

    // Second pass - sanitize with DOMPurify
    const sanitized = DOMPurify.sanitize(cleanedHTML, sanitizeConfig);
    
    return sanitized;
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Get content safely
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      
      // Serialize current content
      const serializer = new XMLSerializer();
      const currentHTML = Array.from(editorRef.current.childNodes)
        .map(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
          }
          return serializer.serializeToString(node);
        })
        .join('');
      
      const cleanedHTML = cleanHTML(currentHTML);
      onChange(cleanedHTML);
    }
  }, [onChange, cleanHTML]);

  const toggleBold = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const strong = document.createElement('strong');
      strong.textContent = selectedText;
      range.deleteContents();
      range.insertNode(strong);
      
      // Move cursor after inserted element
      range.setStartAfter(strong);
      range.setEndAfter(strong);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [handleInput]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Введите URL ссылки:');
    if (!url) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.textContent = selectedText;
      
      range.deleteContents();
      range.insertNode(link);
      
      // Move cursor after inserted element
      range.setStartAfter(link);
      range.setEndAfter(link);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [handleInput]);

  const removeFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const textNode = document.createTextNode(selectedText);
      range.deleteContents();
      range.insertNode(textNode);
      
      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [handleInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (htmlData) {
      const cleanedHTML = cleanHTML(htmlData);
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanedHTML, 'text/html');
      const fragment = document.createDocumentFragment();
      
      Array.from(doc.body.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true));
      });
      
      range.deleteContents();
      range.insertNode(fragment);
    } else if (textData) {
      const textNode = document.createTextNode(textData);
      range.deleteContents();
      range.insertNode(textNode);
    }
    
    handleInput();
  }, [cleanHTML, handleInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleBold();
    }
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
        onPaste={handlePaste}
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