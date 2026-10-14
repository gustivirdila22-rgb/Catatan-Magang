import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import type { Section } from '../types/index.ts';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { sectionId: string; title: string }) => Promise<void>;
  sections: Section[];
  defaultSectionId?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sections,
  defaultSectionId,
}) => {
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState(defaultSectionId || sections[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSectionId) {
      setSectionId(defaultSectionId);
    } else if (sections.length > 0 && !sectionId) {
      setSectionId(sections[0].id);
    }
    setTitle('');
    setErrorMsg(null);
  }, [isOpen, defaultSectionId, sections]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Judul catatan wajib diisi.');
      return;
    }
    if (!sectionId) {
      setErrorMsg('Pilih section tempat catatan ini disimpan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        sectionId,
        title: title.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#E7E5DD] shadow-xl p-6 relative animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-[#778078] hover:text-[#26352C] rounded-lg transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#E4EADF] text-[#344F3D] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-[#26352C]">
            Tambah Catatan Baru
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#26352C] mb-1.5">
              Pilih Section <span className="text-[#9E3B3B]">*</span>
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] focus:bg-white focus:outline-none focus:border-[#879B83]"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#26352C] mb-1.5">
              Judul Catatan <span className="text-[#9E3B3B]">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Hasil diskusi mentor, Ide pengembangan fitur"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] focus:bg-white focus:outline-none focus:border-[#879B83]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-[#9E3B3B] font-medium pt-1">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E5DD]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#778078] hover:text-[#26352C] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#344F3D] hover:bg-[#263A2D] disabled:opacity-40 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
