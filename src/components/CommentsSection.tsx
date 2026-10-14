
import React, { useState } from 'react';
import {
  Send,
  EyeOff,
  Eye,
  Trash2,
  Reply,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Comment } from '../types/index.ts';
import { formatDateTime } from '../utils/date.ts';

interface CommentsSectionProps {
  noteId: string;
  comments: Comment[];
  isOwner: boolean;
  onAddComment: (
    authorName: string,
    content: string,
    parentCommentId?: string | null
  ) => Promise<void>;
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

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
  const [replyName, setReplyName] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const sortedComments = [...comments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  const commentIds = new Set(sortedComments.map((c) => c.id));

  const roots = sortedComments.filter(
    (c) => !c.parentCommentId || !commentIds.has(c.parentCommentId)
  );

  const childrenOf = (parentId: string) =>
    sortedComments.filter((c) => c.parentCommentId === parentId);

  // Ambil semua balasan dalam satu topik, termasuk balasan bertingkat.
  const getThreadComments = (rootId: string): Comment[] => {
    const result: Comment[] = [];
    const visited = new Set<string>();

    const visit = (parentId: string) => {
      for (const child of childrenOf(parentId)) {
        if (visited.has(child.id)) continue;

        visited.add(child.id);
        result.push(child);
        visit(child.id);
      }
    };

    visit(rootId);
    return result;
  };

  const toggleThreadDetails = (rootId: string) => {
    setExpandedThreads((previous) => {
      const next = new Set(previous);

      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = authorName.trim();
    const cleanContent = content.trim();

    if (!isOwner && cleanName.length < 2) {
      setErrorMsg('Nama panggilan minimal 2 karakter.');
      return;
    }

    if (!isOwner && cleanName.length > 50) {
      setErrorMsg('Nama panggilan maksimal 50 karakter.');
      return;
    }

    if (cleanContent.length < 2) {
      setErrorMsg('Isi komentar minimal 2 karakter.');
      return;
    }

    if (cleanContent.length > 1000) {
      setErrorMsg('Isi komentar maksimal 1000 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddComment(
        isOwner ? 'Pemilik Catatan' : cleanName,
        cleanContent,
        null
      );

      setContent('');
      setAuthorName('');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim komentar. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (
    e: React.FormEvent,
    parentCommentId: string
  ) => {
    e.preventDefault();
    setReplyError(null);

    const cleanName = replyName.trim();
    const cleanContent = replyContent.trim();

    if (!isOwner && cleanName.length < 2) {
      setReplyError('Nama panggilan minimal 2 karakter.');
      return;
    }

    if (!isOwner && cleanName.length > 50) {
      setReplyError('Nama panggilan maksimal 50 karakter.');
      return;
    }

    if (cleanContent.length < 2) {
      setReplyError('Isi balasan minimal 2 karakter.');
      return;
    }

    if (cleanContent.length > 1000) {
      setReplyError('Isi balasan maksimal 1000 karakter.');
      return;
    }

    setSubmittingReply(true);

    try {
      await onAddComment(
        isOwner ? 'Pemilik Catatan' : cleanName,
        cleanContent,
        parentCommentId
      );

      setReplyContent('');
      setReplyName('');
      setReplyingTo(null);
      setReplyError(null);
    } catch (err: unknown) {
      setReplyError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim balasan.'
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  // Moderasi topik mencakup komentar utama dan semua balasannya.
  const handleToggleThreadModeration = async (root: Comment) => {
    const thread = [root, ...getThreadComments(root.id)];
    const shouldHide = !root.isModerated;

    const commentsToToggle = thread.filter(
      (comment) => comment.isModerated !== shouldHide
    );

    await Promise.all(
      commentsToToggle.map((comment) =>
        onToggleModerate(comment.id)
      )
    );
  };

  const handleDeleteThread = async (rootId: string) => {
    if (
      !window.confirm(
        'Hapus topik komentar ini beserta semua balasannya?'
      )
    ) {
      return;
    }

    await onDeleteComment(rootId);
  };

  const renderMessage = (comm: Comment, showActions = true) => {
    const isOwnerComment = comm.isOwnerReply === true;

    return (
      <div
        key={comm.id}
        className={`flex items-start gap-3 ${
          isOwnerComment ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(
            comm.authorName
          )}`}
        >
          {comm.authorName.trim().charAt(0).toUpperCase() || '?'}
        </div>

        <div
          className={`min-w-0 flex-1 ${
            isOwnerComment ? 'text-right' : ''
          }`}
        >
          <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
              isOwnerComment ? 'justify-end' : ''
            }`}
          >
            <span className="text-sm font-semibold text-[#26352C]">
              {comm.authorName}
            </span>

            {isOwnerComment && (
              <span className="rounded-full bg-[#344F3D] px-2 py-0.5 text-[10px] font-semibold text-white">
                PEMILIK
              </span>
            )}

            {comm.isModerated && isOwner && (
              <span className="text-[10px] text-[#8A7860]">
                Disembunyikan
              </span>
            )}

            <span className="text-xs text-[#8A918A]">
              {formatDateTime(comm.createdAt)}
            </span>
          </div>

          <p
            className={`mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed ${
              comm.isModerated
                ? 'text-[#8A918A]'
                : 'text-[#4D584F]'
            }`}
          >
            {comm.content}
          </p>

          {showActions && (
            <div
              className={`mt-2 flex flex-wrap items-center gap-3 ${
                isOwnerComment ? 'justify-end' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(
                    replyingTo === comm.id ? null : comm.id
                  );
                  setReplyError(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-[#526C56] hover:text-[#263A2D]"
              >
                {replyingTo === comm.id ? (
                  <X size={13} />
                ) : (
                  <Reply size={13} />
                )}
                {replyingTo === comm.id ? 'Batal' : 'Balas'}
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void onToggleModerate(comm.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#778078] hover:text-[#344F3D]"
                  >
                    {comm.isModerated ? (
                      <Eye size={13} />
                    ) : (
                      <EyeOff size={13} />
                    )}
                    {comm.isModerated ? 'Tampilkan' : 'Sembunyikan'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteThread(comm.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </>
              )}
            </div>
          )}

          {showActions && replyingTo === comm.id && (
            <form
              onSubmit={(e) => handleReply(e, comm.id)}
              className="mt-3 space-y-3 text-left"
            >
              {!isOwner && (
                <input
                  type="text"
                  value={replyName}
                  onChange={(e) => setReplyName(e.target.value)}
                  maxLength={50}
                  placeholder="Nama panggilan"
                  className="w-full rounded-lg border border-[#E7E5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#879B83]"
                />
              )}

              {isOwner && (
                <p className="text-xs text-[#526C56]">
                  Membalas sebagai <strong>Pemilik Catatan</strong>
                </p>
              )}

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={`Balas komentar ${comm.authorName}...`}
                className="w-full resize-y rounded-lg border border-[#E7E5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#879B83]"
              />

              {replyError && (
                <p role="alert" className="text-xs text-red-600">
                  {replyError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingReply}
                className="inline-flex items-center gap-2 rounded-lg bg-[#344F3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#263A2D] disabled:opacity-50"
              >
                <Send size={13} />
                {submittingReply ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };



  const renderThreadReplies = (
    parentId: string,
    depth = 0
  ): React.ReactNode => {
    const children = childrenOf(parentId);

    if (children.length === 0) return null;

    return (
      <div className="space-y-3">
        {children.map((child) => {
          const isOwnerComment = child.isOwnerReply === true;

          return (
            <React.Fragment key={child.id}>
              <div
                className={`rounded-xl border p-3 sm:p-4 ${
                  child.isModerated && isOwner
                    ? 'border-dashed border-[#C7BFB0] bg-[#F1EEE7]'
                    : isOwnerComment
                      ? 'border-[#CBD8C7] bg-[#F1F5EE]'
                      : 'border-[#E7E5DD] bg-white'
                }`}
              >
                {renderMessage(child)}
              </div>

              {renderThreadReplies(child.id, depth + 1)}
            </React.Fragment>
          );
        })}
      </div>
    );
  };


  return (
    <section className="mt-10 max-w-4xl border-t border-[#E7E5DD] pt-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-[#26352C] sm:text-2xl">
          Komentar ({comments.length})
        </h2>

        <span className="text-xs text-[#778078]">
          Publik tanpa login
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-2xl border border-[#E7E5DD] bg-white p-4 shadow-sm sm:p-5"
      >
        {!isOwner && (
          <div className="mb-4">
            <label
              htmlFor="comment-author"
              className="mb-2 block text-xs font-medium text-[#526057]"
            >
              Nama panggilan
            </label>

            <input
              id="comment-author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={50}
              placeholder="Masukkan nama panggilan"
              className="w-full rounded-xl border border-[#E7E5DD] px-4 py-3 text-sm outline-none focus:border-[#879B83]"
            />
          </div>
        )}

        {isOwner && (
          <p className="mb-4 text-sm text-[#526C56]">
            Kamu berkomentar sebagai{' '}
            <strong>Pemilik Catatan</strong>.
          </p>
        )}

        <label
          htmlFor="comment-content"
          className="mb-2 block text-xs font-medium text-[#526057]"
        >
          Tulis komentar
        </label>

        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Bagikan tanggapan atau pertanyaanmu..."
          className="w-full resize-y rounded-xl border border-[#E7E5DD] px-4 py-3 text-sm outline-none focus:border-[#879B83]"
        />

        {errorMsg && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {errorMsg}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-[#8A918A]">
            {content.length}/1000 karakter
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#344F3D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#263A2D] disabled:opacity-50"
          >
            <Send size={15} />
            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {roots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8D6CC] p-8 text-center">
            <p className="text-sm text-[#778078]">
              Belum ada komentar. Jadilah yang pertama berbagi pendapat!
            </p>
          </div>
        ) : (
          roots.map((root) => {
            const threadReplies = getThreadComments(root.id);
            const isExpanded = expandedThreads.has(root.id);

            return (
              <article
                key={root.id}
                className={`rounded-xl border p-4 sm:p-5 ${
                  root.isModerated
                    ? 'border-dashed border-[#C7BFB0] bg-[#F1EEE7]'
                    : 'border-[#E7E5DD] bg-white'
                }`}
              >
                {renderMessage(root, false)}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(
                        replyingTo === root.id ? null : root.id
                      );
                      setReplyError(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#526C56] hover:text-[#263A2D]"
                  >
                    {replyingTo === root.id ? (
                      <X size={13} />
                    ) : (
                      <Reply size={13} />
                    )}
                    {replyingTo === root.id ? 'Batal' : 'Balas'}
                  </button>

                  {threadReplies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleThreadDetails(root.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#526C56] hover:text-[#263A2D]"
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {isExpanded
                        ? 'Tutup detail'
                        : `Lihat detail (${threadReplies.length} balasan)`}
                    </button>
                  )}

                  {isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          void handleToggleThreadModeration(root);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-[#778078] hover:text-[#344F3D]"
                      >
                        {root.isModerated ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                        {root.isModerated
                          ? 'Tampilkan topik'
                          : 'Sembunyikan topik'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteThread(root.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={13} />
                        Hapus topik
                      </button>
                    </>
                  )}
                </div>

                {replyingTo === root.id && (
                  <form
                    onSubmit={(e) => handleReply(e, root.id)}
                    className="mt-4 space-y-3 border-t border-[#E7E5DD] pt-4"
                  >
                    {!isOwner && (
                      <input
                        type="text"
                        value={replyName}
                        onChange={(e) => setReplyName(e.target.value)}
                        maxLength={50}
                        placeholder="Nama panggilan"
                        className="w-full rounded-lg border border-[#E7E5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#879B83]"
                      />
                    )}

                    {isOwner && (
                      <p className="text-xs text-[#526C56]">
                        Membalas sebagai{' '}
                        <strong>Pemilik Catatan</strong>
                      </p>
                    )}

                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder={`Balas komentar ${root.authorName}...`}
                      className="w-full resize-y rounded-lg border border-[#E7E5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#879B83]"
                    />

                    {replyError && (
                      <p role="alert" className="text-xs text-red-600">
                        {replyError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#344F3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#263A2D] disabled:opacity-50"
                    >
                      <Send size={13} />
                      {submittingReply
                        ? 'Mengirim...'
                        : 'Kirim Balasan'}
                    </button>
                  </form>
                )}

                
                {isExpanded && threadReplies.length > 0 && (
                  <div className="mt-4 border-t border-[#E7E5DD] pt-4">
                    {renderThreadReplies(root.id)}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
