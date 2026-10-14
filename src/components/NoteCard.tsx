import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, FileText, Edit3, Trash2, ArrowRight } from 'lucide-react';
import type { Note } from '../types/index.ts';
import { formatDateShort } from '../utils/date.ts';

interface NoteCardProps {
  note: Note & { commentCount?: number };
  onClick: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  isOwner: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onEdit,
  onDelete,
  isOwner,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return;
    }
    onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-[#E7E5DD] p-5 sm:p-6 transition-all duration-200 hover:border-[#879B83] hover:shadow-xs cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar inside card */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#E4EADF]/60 text-[#344F3D] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>

          {/* Three dots menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-1 text-[#778078] hover:text-[#26352C] hover:bg-[#F5F1E8] rounded-md transition-colors"
              aria-label="Menu catatan"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-20 w-40 bg-white border border-[#E7E5DD] rounded-xl shadow-lg py-1.5 animate-in fade-in zoom-in-95 text-xs text-[#26352C]"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F5F1E8] text-left transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#778078]" />
                  <span>Baca Catatan</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(note);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F5F1E8] text-left transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#778078]" />
                      <span>Edit Catatan</span>
                    </button>
                    <div className="border-t border-[#E7E5DD] my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(note);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[#9E3B3B] hover:bg-[#FDF2F2] text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Catatan</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Note Title */}
        <h3 className="font-sans font-semibold text-base text-[#26352C] tracking-tight group-hover:text-[#344F3D] transition-colors line-clamp-2 mb-2">
          {note.title}
        </h3>

        {/* Snippet */}
        <p className="text-xs text-[#778078] line-clamp-3 leading-relaxed mb-4">
          {note.snippet || 'Belum ada konten teks.'}
        </p>
      </div>

      {/* Footer metadata */}
      <div className="pt-3 border-t border-[#E7E5DD]/60 flex items-center gap-2 text-xs text-[#778078]">
        <span>{formatDateShort(note.createdAt)}</span>
        <span aria-hidden="true" className="text-[#879B83]">·</span>
        <span>{note.commentCount ?? 0} komentar</span>
      </div>
    </div>
  );
};
