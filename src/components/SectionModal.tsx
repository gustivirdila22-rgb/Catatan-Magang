import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Section } from '../types/index.ts';
import { AVAILABLE_ICONS } from '../utils/icons.tsx';

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; icon?: string }) => Promise<void>;
  editingSection?: Section | null;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSection,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('file-text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingSection) {
      setTitle(editingSection.title);
      setDescription(editingSection.description || '');
      setIcon(editingSection.icon || 'file-text');
    } else {
      setTitle('');
      setDescription('');
      setIcon('file-text');
    }
    setErrorMsg(null);
  }, [editingSection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Judul section wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        icon,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan section.');
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

        <h2 className="font-serif text-xl font-semibold text-[#26352C] mb-4">
          {editingSection ? 'Edit Section' : 'Tambah Section Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#26352C] mb-1.5">
              Judul Section <span className="text-[#9E3B3B]">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Catatan Magang, Ide Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] focus:bg-white focus:outline-none focus:border-[#879B83]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#26352C] mb-1.5">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              placeholder="Tuliskan gambaran singkat konten yang akan disimpan di section ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] focus:bg-white focus:outline-none focus:border-[#879B83] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#26352C] mb-2">
              Pilih Ikon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setIcon(item.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#E4EADF] border-[#344F3D] text-[#344F3D] shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E7E5DD] text-[#778078] hover:bg-white hover:text-[#26352C]'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
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
              {isSubmitting ? 'Menyimpan...' : editingSection ? 'Simpan Perubahan' : 'Buat Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
