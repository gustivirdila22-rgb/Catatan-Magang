import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, FileText } from 'lucide-react';
import type { Section, Note } from '../types/index.ts';
import { getSectionIconComponent } from '../utils/icons.tsx';
import { NoteCard } from './NoteCard.tsx';

interface SectionDetailViewProps {
  section: Section & { notes: (Note & { commentCount?: number })[]; noteCount?: number; commentCount?: number };
  isOwner: boolean;
  onBackToHome: () => void;
  onAddNote: () => void;
  onOpenNote: (noteId: string) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onRequestOwnerAuth: () => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  section,
  isOwner,
  onBackToHome,
  onAddNote,
  onOpenNote,
  onEditNote,
  onDeleteNote,
  onRequestOwnerAuth,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const IconComponent = getSectionIconComponent(section.icon);

  const filteredNotes = useMemo(() => {
    if (!localSearch.trim()) return section.notes;
    const q = localSearch.toLowerCase();
    return section.notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.snippet.toLowerCase().includes(q)
    );
  }, [section.notes, localSearch]);

  const handleAddNoteClick = () => {
    if (!isOwner) {
      onRequestOwnerAuth();
      return;
    }
    onAddNote();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Breadcrumb & Section Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#778078] hover:text-[#344F3D] transition-colors py-1 group self-start"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Catatan 7Smarts</span>
        </button>

        {/* Section Search Bar */}
        <div className="w-full sm:max-w-sm relative">
          <Search className="w-4 h-4 text-[#879B83] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari catatan di section ini..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white/80 border border-[#E7E5DD] rounded-full text-[#26352C] placeholder-[#778078] focus:bg-white focus:outline-none focus:border-[#879B83] transition-colors"
          />
        </div>
      </div>

      {/* Section Header Card matching mockup */}
      <div className="bg-white rounded-3xl border border-[#E7E5DD] p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E4EADF] text-[#344F3D] flex items-center justify-center shrink-0">
              <IconComponent className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#26352C] tracking-tight">
                  {section.title}
                </h1>
              </div>

              <div className="text-xs text-[#778078]">
                {section.notes.length} catatan
              </div>

              {section.description && (
                <p className="text-xs sm:text-sm text-[#778078] max-w-2xl pt-1 leading-relaxed">
                  {section.description}
                </p>
              )}
            </div>
          </div>

          <div className="self-start sm:self-center shrink-0">
            <button
              onClick={handleAddNoteClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#344F3D] hover:bg-[#263A2D] active:scale-98 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Catatan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white/60 rounded-2xl border border-dashed border-[#E7E5DD] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#E4EADF] text-[#344F3D] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-medium text-[#26352C] mb-1">
            {localSearch.trim() ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan di section ini'}
          </h3>
          <p className="text-xs text-[#778078] max-w-sm mx-auto mb-4">
            {localSearch.trim()
              ? `Tidak ditemukan catatan dengan kata kunci "${localSearch}".`
              : 'Mulai dokumentasikan ide atau materi dengan membuat catatan baru.'}
          </p>
          <button
            onClick={handleAddNoteClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#344F3D] hover:bg-[#263A2D] text-white text-xs font-medium rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Catatan Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onOpenNote(note.id)}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
};
