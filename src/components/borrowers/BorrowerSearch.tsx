import React, { useState, useRef, useEffect } from 'react';
import { useBorrowerSearch } from '@/hooks/useBorrowers';
import { Borrower } from '@/types/borrower';
import { Search, User, Phone, Check, X, Loader2 } from 'lucide-react';

interface BorrowerSearchProps {
  onSelect: (borrower: Borrower | null) => void;
  selectedBorrower?: Borrower | null;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

export const BorrowerSearch: React.FC<BorrowerSearchProps> = ({
  onSelect,
  selectedBorrower,
  placeholder = 'Search borrower by name, phone, or ID...',
  error,
  label = 'Select Borrower',
  required = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useBorrowerSearch(query);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (b: Borrower) => {
    onSelect(b);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative">
      {label && (
        <label className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}

      {selectedBorrower ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary-300 bg-primary-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-100 text-primary-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{selectedBorrower.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">
                {selectedBorrower.borrowerId} • +91 {selectedBorrower.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`block w-full rounded-lg border bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/20'
            }`}
          />
        </div>
      )}

      {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}

      {/* Dropdown Results */}
      {isOpen && !selectedBorrower && query.trim().length >= 2 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Searching borrowers...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching borrowers found for "{query}".
            </div>
          ) : (
            results.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelect(b)}
                className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-primary-100 text-slate-600 group-hover:text-primary-700 flex items-center justify-center font-bold text-xs">
                    {b.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{b.fullName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono">{b.borrowerId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {b.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <Check className="w-4 h-4 text-transparent group-hover:text-primary-600 transition-colors" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BorrowerSearch;
