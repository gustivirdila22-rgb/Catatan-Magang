import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit3, Trash2, ArrowRight } from 'lucide-react';
import type { Section } from '../types/index.ts';
import { getSectionIconComponent } from '../utils/icons.tsx';

interface SectionCardProps {
  section: Section & { noteCount?: number; commentCount?: number };
  onClick: () => void;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
  isOwner: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  onClick,
  onEdit,
  onDelete,
  isOwner,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const IconComponent = getSectionIconComponent(section.icon);

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
    // Prevent navigation if clicking inside action menu
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
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#E4EADF] text-[#344F3D] flex items-center justify-center transition-transform group-hover:scale-105">
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Three dots menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-1.5 text-[#778078] hover:text-[#26352C] hover:bg-[#F5F1E8] rounded-lg transition-colors"
              aria-label="Menu section"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-20 w-44 bg-white border border-[#E7E5DD] rounded-xl shadow-lg py-1.5 animate-in fade-in zoom-in-95 text-xs text-[#26352C]"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClick();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5F1E8] text-left transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#778078]" />
                  <span>Buka Section</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(section);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5F1E8] text-left transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#778078]" />
                      <span>Edit Section</span>
                    </button>
                    <div className="border-t border-[#E7E5DD] my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(section);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-[#9E3B3B] hover:bg-[#FDF2F2] text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Section</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-sans font-semibold text-base sm:text-lg text-[#26352C] tracking-tight group-hover:text-[#344F3D] transition-colors line-clamp-1 mb-1">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-xs text-[#778078] line-clamp-2 mb-3 leading-relaxed">
            {section.description}
          </p>
        )}
      </div>

      {/* Footer metadata: unboxed text with dot separator */}
      <div className="pt-3 border-t border-[#E7E5DD]/60 flex items-center gap-2 text-xs text-[#778078] font-normal">
        <span>{section.noteCount ?? 0} catatan</span>
        <span aria-hidden="true" className="text-[#879B83]">·</span>
        <span>{section.commentCount ?? 0} komentar</span>
      </div>
    </div>
  );
};
