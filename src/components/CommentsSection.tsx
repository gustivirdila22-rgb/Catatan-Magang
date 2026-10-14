import React, { useState } from 'react';
import { Send, EyeOff, Eye, Trash2 } from 'lucide-react';
import type { Comment } from '../types/index.ts';
import { formatDateTime } from '../utils/date.ts';

interface CommentsSectionProps {
  noteId: string;
  comments: Comment[];
  isOwner: boolean;
  onAddComment: (authorName: string, content: string) => Promise<void>;
  onToggleModerate: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

const AVATAR_COLORS = [
  'bg-[#344F3D] text-[#E4EADF]',
  'bg-[#879B83] text-white',
  'bg-[#5C7360] text-white',
  'bg-[#4A6352] text-[#E4EADF]',
  'bg-[#263A2D] text-white',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  isOwner,
  onAddComment,
  onToggleModerate,
  onDeleteComment,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = authorName.trim();
    const cleanContent = content.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Nama panggilan minimal 2 karakter.');
      return;
    }
    if (cleanName.length > 50) {
      setErrorMsg('Nama panggilan maksimal 50 karakter.');
      return;
    }
    if (!cleanContent || cleanContent.length < 2) {
      setErrorMsg('Isi komentar minimal 2 karakter.');
      return;
    }
    if (cleanContent.length > 1000) {
      setErrorMsg('Isi komentar maksimal 1000 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment(cleanName, cleanContent);
      setContent('');
      // Keep name for convenience of next comment
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim komentar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialLetter = authorName.trim() ? authorName.trim().charAt(0).toUpperCase() : 'N';

  return (
    <div className="mt-10 pt-8 border-t border-[#E7E5DD] max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#26352C] tracking-tight">
          Komentar ({comments.length})
        </h2>
        <span className="text-xs text-[#778078]">Publik tanpa login</span>
      </div>

      {/* New Comment Form matching mockup */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E7E5DD] p-4 sm:p-5 mb-8 shadow-xs"
      >
        <div className="flex gap-3 sm:gap-4 items-start">
          {/* Avatar Preview */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm shrink-0 transition-all ${
              authorName.trim() ? getAvatarColor(authorName) : 'bg-[#E4EADF] text-[#344F3D]'
            }`}
          >
            {initialLetter}
          </div>

          <div className="flex-1 space-y-3">
            {/* Author Name Input */}
            <div>
              <input
                type="text"
                placeholder="Nama panggilan Anda (wajib)..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={50}
                required
                className="w-full sm:max-w-xs px-3.5 py-1.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-lg text-[#26352C] focus:bg-white focus:outline-none focus:border-[#879B83] transition-colors"
              />
            </div>

            {/* Comment Textarea */}
            <div className="relative">
              <textarea
                placeholder="Tulis komentar..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                maxLength={1000}
                required
                className="w-full px-3.5 py-2.5 pr-14 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] placeholder-[#778078] focus:bg-white focus:outline-none focus:border-[#879B83] transition-all resize-none"
              />

              {/* Submit button on right side */}
              <button
                type="submit"
                disabled={isSubmitting || !authorName.trim() || !content.trim()}
                className="absolute right-2.5 bottom-3.5 w-8 h-8 rounded-full bg-[#344F3D] hover:bg-[#263A2D] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Kirim Komentar"
                aria-label="Kirim Komentar"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 -ml-0.5" />
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-[#9E3B3B] font-medium animate-in fade-in">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="bg-white/60 rounded-xl border border-dashed border-[#E7E5DD] p-6 text-center text-sm text-[#778078]">
            Belum ada komentar untuk catatan ini. Jadilah yang pertama memberikan masukan!
          </div>
        ) : (
          comments.map((comm) => (
            <div
              key={comm.id}
              className={`flex gap-3 sm:gap-4 p-4 rounded-xl border transition-all ${
                comm.isModerated
                  ? 'bg-neutral-100 border-neutral-300 opacity-60'
                  : 'bg-white border-[#E7E5DD]'
              }`}
            >
              {/* Avatar circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs shrink-0 ${getAvatarColor(
                  comm.authorName
                )}`}
              >
                {comm.authorName.charAt(0).toUpperCase()}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[#26352C]">
                      {comm.authorName}
                    </span>
                    <span className="text-[11px] text-[#778078]">
                      {formatDateTime(comm.createdAt)}
                    </span>
                  </div>

                  {/* Owner moderation actions */}
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      {comm.isModerated && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Disembunyikan
                        </span>
                      )}
                      <button
                        onClick={() => onToggleModerate(comm.id)}
                        className="p-1 text-[#778078] hover:text-[#26352C] rounded transition-colors"
                        title={comm.isModerated ? 'Tampilkan ke publik' : 'Sembunyikan dari publik'}
                        aria-label="Moderasi komentar"
                      >
                        {comm.isModerated ? (
                          <Eye className="w-3.5 h-3.5 text-[#344F3D]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteComment(comm.id)}
                        className="p-1 text-[#778078] hover:text-[#9E3B3B] rounded transition-colors"
                        title="Hapus komentar"
                        aria-label="Hapus komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#26352C] leading-relaxed whitespace-pre-wrap break-words">
                  {comm.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
