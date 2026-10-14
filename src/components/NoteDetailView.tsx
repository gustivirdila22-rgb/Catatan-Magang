import React, { useState } from 'react';
import { ArrowLeft, Edit3, Check, Trash2, MoreHorizontal } from 'lucide-react';
import type { Note, Comment } from '../types/index.ts';
import { formatDateLong, formatDateTime } from '../utils/date.ts';
import { RichTextEditor } from './RichTextEditor.tsx';
import { CommentsSection } from './CommentsSection.tsx';

interface NoteDetailViewProps {
  note: Note & { sectionSlug?: string; comments: Comment[] };
  isOwner: boolean;
  onBackToSection: () => void;
  onSaveContent: (contentHtml: string) => Promise<void>;
  onSaveTitle: (newTitle: string) => Promise<void>;
  onDeleteNote: () => void;
  onAddComment: (authorName: string, content: string) => Promise<void>;
  onToggleModerateComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onRequestOwnerAuth: () => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  note,
  isOwner,
  onBackToSection,
  onSaveContent,
  onSaveTitle,
  onDeleteNote,
  onAddComment,
  onToggleModerateComment,
  onDeleteComment,
  onRequestOwnerAuth,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);
  const [isEditMode, setIsEditMode] = useState(isOwner);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTitleSubmit = async () => {
    if (!titleInput.trim() || titleInput.trim() === note.title) {
      setTitleInput(note.title);
      setIsEditingTitle(false);
      return;
    }
    await onSaveTitle(titleInput.trim());
    setIsEditingTitle(false);
  };

  const handleEditClick = () => {
    if (!isOwner) {
      onRequestOwnerAuth();
      return;
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back navigation */}
      <div className="mb-6">
        <button
          onClick={onBackToSection}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#778078] hover:text-[#344F3D] transition-colors py-1 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Section</span>
        </button>
      </div>

      {/* Note Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {/* Editable Title */}
          {isEditingTitle && isOwner ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleInput(note.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="font-serif text-2xl sm:text-3xl font-semibold text-[#26352C] bg-white border border-[#879B83] rounded-lg px-2.5 py-1 w-full focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-2 bg-[#344F3D] text-white rounded-lg hover:bg-[#263A2D] transition-colors"
                title="Simpan Judul"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => {
                if (isOwner) setIsEditingTitle(true);
              }}
              className={`font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#26352C] tracking-tight mb-2 leading-tight ${
                isOwner ? 'cursor-pointer hover:text-[#344F3D] transition-colors' : ''
              }`}
              title={isOwner ? 'Klik untuk mengubah judul' : undefined}
            >
              {note.title}
            </h1>
          )}

          {/* Clean Unboxed Metadata with dot separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#778078]">
            <span>{formatDateLong(note.createdAt)}</span>
            <span aria-hidden="true" className="text-[#879B83]">·</span>
            <span>Diperbarui {formatDateLong(note.updatedAt)}</span>
            <span aria-hidden="true" className="text-[#879B83]">·</span>
            <span>{note.comments?.length ?? 0} komentar</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            onClick={handleEditClick}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isEditMode
                ? 'bg-[#344F3D] text-white hover:bg-[#263A2D] shadow-xs'
                : 'bg-white hover:bg-[#F5F1E8] text-[#26352C] border border-[#E7E5DD]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Mode Edit' : 'Edit Catatan'}</span>
          </button>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 bg-white border border-[#E7E5DD] hover:bg-[#F5F1E8] text-[#778078] hover:text-[#26352C] rounded-xl transition-colors"
                aria-label="Menu opsi"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 w-44 bg-white border border-[#E7E5DD] rounded-xl shadow-lg py-1.5 animate-in fade-in zoom-in-95 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditingTitle(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F5F1E8] text-left text-[#26352C]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#778078]" />
                    <span>Ubah Judul</span>
                  </button>
                  <div className="border-t border-[#E7E5DD] my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteNote();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[#9E3B3B] hover:bg-[#FDF2F2] text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Catatan</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Rich Text Card */}
      <div className="bg-white rounded-2xl border border-[#E7E5DD] shadow-xs overflow-hidden mb-8">
        <RichTextEditor
          initialContent={note.content}
          onSave={onSaveContent}
          isEditable={isEditMode && isOwner}
          lastUpdatedAt={note.updatedAt}
        />
      </div>

      {/* Public Comments Section */}
      <CommentsSection
        noteId={note.id}
        comments={note.comments || []}
        isOwner={isOwner}
        onAddComment={onAddComment}
        onToggleModerate={onToggleModerateComment}
        onDeleteComment={onDeleteComment}
      />
    </div>
  );
};
