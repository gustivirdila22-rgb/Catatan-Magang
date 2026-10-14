import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatDateTime } from '../utils/date.ts';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (contentHtml: string) => Promise<void>;
  isEditable: boolean;
  lastUpdatedAt?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  onSave,
  isEditable,
  lastUpdatedAt,
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    lastUpdatedAt ? formatDateTime(lastUpdatedAt) : formatDateTime(new Date().toISOString())
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<string>(initialContent);

  const performSave = useCallback(
    async (contentToSave: string) => {
      if (!isEditable) return;

      setSaveStatus('saving');
      try {
        await onSave(contentToSave);
        setSaveStatus('saved');
        setLastSavedTime(formatDateTime(new Date().toISOString()));
      } catch (err) {
        console.error('[Editor] Autosave error:', err);
        setSaveStatus('error');
      }
    },
    [isEditable, onSave]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: !isEditable,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-[#344F3D] underline underline-offset-4 font-medium hover:opacity-80 transition-opacity',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      if (!isEditable) return;

      const html = editor.getHTML();
      pendingContentRef.current = html;
      setSaveStatus('unsaved');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Autosave debounce of 1200ms
      debounceTimerRef.current = setTimeout(() => {
        performSave(html);
      }, 1200);
    },
  });

  // Keep editor editable state in sync
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable);
    }
  }, [editor, isEditable]);

  useEffect(() => {
    if (!isEditable && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [isEditable]);

  // Clean up timer on unmount and perform final save if pending
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL tautan:', previousUrl || 'https://');

    // cancelled
    if (url === null) return;

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleRetrySave = () => {
    if (editor) {
      performSave(editor.getHTML());
    }
  };

  if (!editor) {
    return (
      <div className="p-8 text-center text-sm text-[#778078] animate-pulse">
        Memuat editor...
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Editor Toolbar (only shown in edit mode) */}
      {isEditable && (
        <div className="flex items-center gap-1 p-2 bg-[#F5F1E8]/70 border-b border-[#E7E5DD] rounded-t-2xl overflow-x-auto scrollbar-none">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              editor.isActive('bold')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Tebal (Ctrl+B)"
          >
            <BoldIcon className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              editor.isActive('italic')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Miring (Ctrl+I)"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#E7E5DD] mx-1 shrink-0" />

          {/* Heading 2 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg text-xs font-serif transition-colors shrink-0 ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg text-xs font-serif transition-colors shrink-0 ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#E7E5DD] mx-1 shrink-0" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              editor.isActive('bulletList')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Daftar Poin"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              editor.isActive('orderedList')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Daftar Nomor"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Checklist */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              editor.isActive('taskList')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Daftar Tugas / Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#E7E5DD] mx-1 shrink-0" />

          {/* Link */}
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              editor.isActive('link')
                ? 'bg-[#344F3D] text-white shadow-xs'
                : 'text-[#26352C] hover:bg-white'
            }`}
            title="Sisipkan Tautan"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded-lg text-xs text-[#9E3B3B] hover:bg-white transition-colors shrink-0"
              title="Hapus Tautan"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-4 bg-[#E7E5DD] mx-1 shrink-0" />

          {/* Undo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded-lg text-xs text-[#26352C] hover:bg-white disabled:opacity-30 transition-colors shrink-0"
            title="Batal (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded-lg text-xs text-[#26352C] hover:bg-white disabled:opacity-30 transition-colors shrink-0"
            title="Ulangi (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Main Content Area */}
      <div className={`p-6 sm:p-8 min-h-[220px] tiptap-content ${!isEditable ? 'cursor-default' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar at Bottom of Document */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E7E5DD] rounded-b-2xl text-xs text-[#778078]">
        {/* Autosave Indicator */}
        {isEditable && (
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-[#344F3D] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#879B83]" />
                <span>Tersimpan</span>
              </span>
            )}

            {saveStatus === 'unsaved' && (
              <span className="inline-flex items-center gap-1.5 text-[#778078]">
                <Clock className="w-4 h-4 text-[#879B83]" />
                <span>Perubahan belum disimpan</span>
              </span>
            )}

            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-[#344F3D]">
                <span className="w-3.5 h-3.5 border-2 border-[#879B83] border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </span>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[#9E3B3B] font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Gagal menyimpan</span>
                </span>
                <button
                  type="button"
                  onClick={handleRetrySave}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#E7E5DD] hover:bg-[#F5F1E8] text-[#26352C] rounded-md transition-colors font-medium text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[11px] sm:text-xs text-[#778078] font-normal">
          Terakhir diperbarui: {lastSavedTime}
        </div>
      </div>
    </div>
  );
};
