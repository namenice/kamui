// src/components/common/SearchableSelect.tsx
// src/components/common/SearchableSelect.tsx
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ArrowDown, Check } from 'lucide-react';

interface SearchableSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  error,
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find(opt => opt.id === value);

  // Filter Logic
  const filteredOptions = query === '' 
    ? options 
    : options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase()));

  // Reset Logic
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  // Sync Input Text with Value
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedItem ? selectedItem.name : '');
    }
  }, [isOpen, selectedItem]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Auto Scroll
  useEffect(() => {
    if (isOpen && listRef.current) {
      const element = listRef.current.children[highlightedIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard Handler
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
        return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          const item = filteredOptions[highlightedIndex];
          onChange(item.id);
          setQuery(item.name);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation(); // ⛔ หยุดการส่งต่อ Event
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          className={`w-full border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 transition-all ${
            error 
              ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
              : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
          } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
          placeholder={placeholder}
          value={isOpen ? query : (selectedItem?.name || '')}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => {
            if (!disabled) {
                setIsOpen(true);
                setQuery('');
            }
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div 
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
          ) : (
            filteredOptions.map((opt, index) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setQuery(opt.name);
                }}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-blue-100 text-blue-800'
                    : value === opt.id 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-slate-700 hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {opt.name}
                {value === opt.id && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}