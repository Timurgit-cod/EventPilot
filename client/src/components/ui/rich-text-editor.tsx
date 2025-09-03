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

  // Функция для очистки HTML от лишней разметки
  const cleanHTML = useCallback((html: string) => {
    // Удаляем метаданные Figma и другие нежелательные элементы
    let cleanedHTML = html
      .replace(/data-metadata="[^"]*"/g, '') // Удаляем data-metadata атрибуты
      .replace(/<\/?figmeta[^>]*>/g, '') // Удаляем figmeta теги
      .replace(/<!--.*?-->/g, '') // Удаляем комментарии
      .replace(/<\/?o:p[^>]*>/g, '') // Удаляем Office теги
      .replace(/<\/?meta[^>]*>/g, '') // Удаляем meta теги
      .replace(/mso-[^;]*:[^;]*;?/g, '') // Удаляем MS Office стили
      .replace(/style="[^"]*"/g, '') // Удаляем все inline стили
      .replace(/class="[^"]*"/g, '') // Удаляем все классы
      .replace(/<span[^>]*>/g, '') // Удаляем span открывающие теги
      .replace(/<\/span>/g, '') // Удаляем span закрывающие теги
      .replace(/<div([^>]*)>/g, '<p$1>') // Заменяем div на p
      .replace(/<\/div>/g, '</p>') // Заменяем /div на /p
      .replace(/<p\s+[^>]*>/g, '<p>') // Очищаем атрибуты у p тегов
      .replace(/<br\s*\/?>/g, '<br>') // Нормализуем br теги
      .replace(/\s+/g, ' ') // Заменяем множественные пробелы одним
      .replace(/<p><\/p>/g, '') // Удаляем пустые параграфы
      .replace(/<p>\s*<\/p>/g, '') // Удаляем параграфы с пробелами
      .trim();

    // Создаем временный элемент для дальнейшей очистки
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanedHTML;
    
    // Проходим по элементам и оставляем только разрешенные теги
    const allowedTags = ['P', 'BR', 'STRONG', 'EM', 'A'];
    const elementsToClean = tempDiv.querySelectorAll('*');
    elementsToClean.forEach(element => {
      if (!allowedTags.includes(element.tagName)) {
        // Заменяем неразрешенные теги на их содержимое
        element.outerHTML = element.innerHTML;
      } else if (element.tagName === 'A') {
        // Для ссылок оставляем только href атрибут
        const href = element.getAttribute('href');
        const text = element.textContent;
        if (href && text) {
          element.outerHTML = `<a href="${href}">${text}</a>`;
        } else {
          element.outerHTML = element.innerHTML;
        }
      }
    });
    
    return tempDiv.innerHTML;
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      console.log('Raw HTML from editor:', html);
      const cleanedHTML = cleanHTML(html);
      console.log('Cleaned HTML before onChange:', cleanedHTML);
      onChange(cleanedHTML);
    }
  }, [onChange, cleanHTML]);

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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Получаем текст из буфера обмена
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    // Если есть HTML данные, очищаем их
    if (htmlData) {
      const cleanedHTML = cleanHTML(htmlData);
      document.execCommand('insertHTML', false, cleanedHTML);
    } else {
      // Если только текст, вставляем как есть
      document.execCommand('insertText', false, textData);
    }
    
    // Обновляем состояние
    handleInput();
  }, [cleanHTML, handleInput]);

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