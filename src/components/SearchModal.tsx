import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api.ts';
import type { SearchResult } from '../types/index.ts';
import { formatDateShort } from '../utils/date.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query.trim());
        setResults(data.results || []);
      } catch (err) {
        console.error('[Search] Error querying:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E7E5DD] shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E5DD] bg-[#FAF8F5]">
          <Search className="w-5 h-5 text-[#879B83] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari judul section, catatan, atau isi teks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#26352C] placeholder-[#778078] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#778078] hover:text-[#26352C] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium px-2 py-1 text-[#778078] hover:text-[#26352C] bg-white border border-[#E7E5DD] rounded-md"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-[#E7E5DD]/40">
          {isLoading && (
            <div className="p-8 text-center text-xs text-[#778078] flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#879B83] border-t-transparent rounded-full animate-spin" />
              <span>Mencari catatan...</span>
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-xs text-[#778078]">
              Tidak ditemukan hasil untuk <span className="font-semibold text-[#26352C]">"{query}"</span>.
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="p-8 text-center text-xs text-[#778078]">
              Ketik kata kunci untuk mencari di seluruh section dan catatan.
            </div>
          )}

          {!isLoading &&
            results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="w-full pt-2 first:pt-0 flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F1E8] text-left transition-colors group cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'section'
                      ? 'bg-[#E4EADF] text-[#344F3D]'
                      : 'bg-white border border-[#E7E5DD] text-[#879B83]'
                  }`}
                >
                  {item.type === 'section' ? (
                    <Folder className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#26352C] group-hover:text-[#344F3D] transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[#778078] uppercase tracking-wider font-mono shrink-0">
                      {item.type === 'section' ? 'Section' : item.sectionTitle || 'Catatan'}
                    </span>
                  </div>

                  {item.snippet && (
                    <p className="text-xs text-[#778078] line-clamp-1 mt-0.5">
                      {item.snippet}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#778078]">
                    <span>{formatDateShort(item.updatedAt)}</span>
                    {item.commentCount !== undefined && (
                      <>
                        <span aria-hidden="true" className="text-[#879B83]">·</span>
                        <span>{item.commentCount} komentar</span>
                      </>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#778078] group-hover:text-[#344F3D] group-hover:translate-x-0.5 transition-all self-center shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
