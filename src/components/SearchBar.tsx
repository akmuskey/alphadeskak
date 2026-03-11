import { useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (ticker: string) => void;
  currentTicker: string;
}

export default function SearchBar({ onSearch, currentTicker }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim().toUpperCase();
    if (val) {
      onSearch(val);
      inputRef.current!.value = '';
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={`Search ticker... (/) — ${currentTicker}`}
          className="font-mono text-xs bg-secondary border border-border pl-7 pr-3 py-1.5 w-64 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-lg"
        />
      </div>
    </form>
  );
}
