import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  warningNote?: string;
  confirmText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningNote,
  confirmText = 'Hapus',
  isDangerous = true,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
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
          aria-label="Batal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#9E3B3B] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#26352C]">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#778078] mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {warningNote && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 mb-4 leading-relaxed">
            ⚠️ {warningNote}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E5DD]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-[#778078] hover:text-[#26352C] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer ${
              isDangerous
                ? 'bg-[#9E3B3B] hover:bg-[#852E2E]'
                : 'bg-[#344F3D] hover:bg-[#263A2D]'
            }`}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? 'Memproses...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
