import React, { useState, useEffect, useCallback } from 'react';
import type { Section, Note, Comment, SearchResult, ViewMode } from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { SectionCard } from './components/SectionCard.tsx';
import { SectionDetailView } from './components/SectionDetailView.tsx';
import { NoteDetailView } from './components/NoteDetailView.tsx';
import { SectionModal } from './components/SectionModal.tsx';
import { NoteModal } from './components/NoteModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { OwnerModal } from './components/OwnerModal.tsx';
import { BottomNavMobile } from './components/BottomNavMobile.tsx';
import { Toast, type ToastMessage } from './components/Toast.tsx';

export default function App() {
  // Navigation / View State
  const [viewState, setViewState] = useState<ViewMode>({ view: 'home' });

  // Data State
  const [sections, setSections] = useState<(Section & { noteCount?: number; commentCount?: number })[]>([]);
  const [currentSection, setCurrentSection] = useState<(Section & { notes: (Note & { commentCount?: number })[]; noteCount?: number; commentCount?: number }) | null>(null);
  const [currentNote, setCurrentNote] = useState<(Note & { sectionSlug?: string; comments: Comment[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Owner Auth State
  const [isOwner, setIsOwner] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  // Modals
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [targetSectionIdForNote, setTargetSectionIdForNote] = useState<string | undefined>(undefined);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    warningNote?: string;
    confirmText?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Owner Status
  const checkOwner = useCallback(async () => {
    try {
      const status = await api.getOwnerStatus();
      setIsOwner(status.isOwner);
    } catch {
      setIsOwner(false);
    }
  }, []);

  // Fetch Sections List
  const loadSections = useCallback(async () => {
    try {
      const data = await api.getSections();
      setSections(data.sections);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat sections');
    }
  }, [addToast]);

  // Initial Boot
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await Promise.all([checkOwner(), loadSections()]);
      setIsLoading(false);
    }
    init();
  }, [checkOwner, loadSections]);

  // Keyboard shortcut for search (⌘K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Section detail
  const handleOpenSection = async (sectionIdOrSlug: string) => {
    setIsLoading(true);
    try {
      const data = await api.getSection(sectionIdOrSlug);
      setCurrentSection(data.section);
      setViewState({ view: 'section', sectionId: data.section.id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuka section');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Note detail
  const handleOpenNote = async (noteId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getNote(noteId);
      setCurrentNote(data.note);
      setViewState({ view: 'note', noteId: data.note.id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuka catatan');
    } finally {
      setIsLoading(false);
    }
  };

  // Back to home
  const handleGoHome = () => {
    setViewState({ view: 'home' });
    setCurrentSection(null);
    setCurrentNote(null);
    loadSections();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from note to current section
  const handleBackToSection = () => {
    if (currentNote?.sectionId) {
      handleOpenSection(currentNote.sectionId);
    } else {
      handleGoHome();
    }
  };

  // Section CRUD Handlers
  const handleCreateOrEditSection = async (data: { title: string; description?: string; icon?: string }) => {
    if (editingSection) {
      const res = await api.updateSection(editingSection.id, data);
      addToast('success', res.message);
      setEditingSection(null);
      if (currentSection && currentSection.id === editingSection.id) {
        handleOpenSection(currentSection.id);
      }
    } else {
      const res = await api.createSection(data);
      addToast('success', res.message);
    }
    loadSections();
  };

  const promptDeleteSection = (section: Section) => {
    setConfirmModal({
      isOpen: true,
      title: `Hapus Section "${section.title}"?`,
      description: 'Tindakan ini akan menghapus section secara permanen.',
      warningNote: 'Semua catatan di dalam section ini beserta komentar publik di dalamnya juga akan terhapus.',
      confirmText: 'Hapus Section & Catatan',
      onConfirm: async () => {
        try {
          const res = await api.deleteSection(section.id);
          addToast('success', res.message);
          if (currentSection && currentSection.id === section.id) {
            handleGoHome();
          } else {
            loadSections();
          }
        } catch (err: any) {
          addToast('error', err.message || 'Gagal menghapus section');
        }
      },
    });
  };

  // Note CRUD Handlers
  const handleCreateNote = async (data: { sectionId: string; title: string }) => {
    const res = await api.createNote(data);
    addToast('success', res.message);
    // Reload current section or open the newly created note directly
    handleOpenNote(res.note.id);
    loadSections();
  };

  const handleSaveNoteContent = async (contentHtml: string) => {
    if (!currentNote) return;
    const res = await api.updateNote(currentNote.id, { content: contentHtml });
    setCurrentNote((prev) => (prev ? { ...prev, content: res.note.content, updatedAt: res.note.updatedAt } : null));
  };

  const handleSaveNoteTitle = async (newTitle: string) => {
    if (!currentNote) return;
    try {
      const res = await api.updateNote(currentNote.id, { title: newTitle });
      setCurrentNote((prev) => (prev ? { ...prev, title: res.note.title, updatedAt: res.note.updatedAt } : null));
      addToast('success', 'Judul catatan berhasil diperbarui.');
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengubah judul');
    }
  };

  const promptDeleteNote = (note: Note) => {
    setConfirmModal({
      isOpen: true,
      title: `Hapus Catatan "${note.title}"?`,
      description: 'Tindakan ini akan menghapus catatan dan komentar di dalamnya secara permanen.',
      warningNote: 'Data yang dihapus tidak dapat dipulihkan kembali.',
      confirmText: 'Hapus Catatan',
      onConfirm: async () => {
        try {
          const res = await api.deleteNote(note.id);
          addToast('success', res.message);
          if (viewState.view === 'note') {
            handleBackToSection();
          } else if (currentSection) {
            handleOpenSection(currentSection.id);
          }
          loadSections();
        } catch (err: any) {
          addToast('error', err.message || 'Gagal menghapus catatan');
        }
      },
    });
  };

  // Comment Handlers
const handleAddComment = async (
  authorName: string,
  content: string,
  parentCommentId?: string | null
) => {
  if (!currentNote) return;

  const res = await api.addComment(currentNote.id, {
    authorName,
    content,
    parentCommentId,
  });

  setCurrentNote((prev) => {
    if (!prev) return null;

    const comments = [
      res.comment,
      ...prev.comments.filter((c) => c.id !== res.comment.id),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    return {
      ...prev,
      comments,
      commentCount: res.commentCount,
    };
  });

  addToast('success', res.message);
};

const handleToggleModerateComment = async (commentId: string) => {
  try {
    const res = await api.toggleModerateComment(commentId);

    setCurrentNote((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        comments: prev.comments.map((c) =>
          c.id === commentId ? res.comment : c
        ),
      };
    });

    addToast('info', res.message);
  } catch (err: any) {
    addToast('error', err.message || 'Gagal memoderasi komentar');
  }
};

const handleDeleteComment = async (commentId: string) => {
  try {
    await api.deleteComment(commentId);

    // Muat ulang dari server agar semua balasan turunan
    // yang ikut dihapus juga langsung hilang dari tampilan.
    if (currentNote) {
      const res = await api.getNote(currentNote.id);
      setCurrentNote(res.note);
    }

    addToast('success', 'Komentar dan balasannya berhasil dihapus.');
  } catch (err: any) {
    addToast('error', err.message || 'Gagal menghapus komentar');
  }
};

  // Search selection handler
  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.type === 'section') {
      handleOpenSection(result.id);
    } else {
      handleOpenNote(result.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F1E8] text-[#26352C] pb-16 sm:pb-8">
      {/* Top Header */}
      <Header
        onGoHome={handleGoHome}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenOwner={() => setOwnerModalOpen(true)}
        isOwner={isOwner}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME (Daftar Section) */}
        {viewState.view === 'home' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            {/* Hero Section */}
            <Hero
              onAddSection={() => {
                if (!isOwner) {
                  setOwnerModalOpen(true);
                } else {
                  setEditingSection(null);
                  setSectionModalOpen(true);
                }
              }}
            />

            {/* Section Section Header matching mockup */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#26352C] tracking-tight">
                Daftar Section
              </h2>
              <span className="text-xs text-[#778078] font-mono">
                {sections.length} section
              </span>
            </div>

            {/* Loading State */}
            {isLoading && sections.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-[#E7E5DD] p-6 h-40 animate-pulse flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E4EADF]/60 mb-3" />
                    <div className="h-4 bg-[#E7E5DD] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#E7E5DD]/60 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Section Cards Grid */}
            {!isLoading && sections.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E7E5DD] p-12 text-center max-w-lg mx-auto">
                <h3 className="font-serif text-xl font-medium text-[#26352C] mb-2">
                  Belum ada section catatan
                </h3>
                <p className="text-sm text-[#778078] mb-6 leading-relaxed">
                  Buat section pertama Anda untuk mulai mengorganisir ide, kegiatan magang, materi kuliah, atau tautan referensi.
                </p>
                <button
                  onClick={() => {
                    if (!isOwner) {
                      setOwnerModalOpen(true);
                    } else {
                      setEditingSection(null);
                      setSectionModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#344F3D] hover:bg-[#263A2D] text-white text-sm font-medium rounded-xl shadow-xs transition-all"
                >
                  <span>Tambah Section Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sections.map((sec) => (
                  <SectionCard
                    key={sec.id}
                    section={sec}
                    onClick={() => handleOpenSection(sec.id)}
                    onEdit={(s) => {
                      setEditingSection(s);
                      setSectionModalOpen(true);
                    }}
                    onDelete={promptDeleteSection}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SECTION DETAIL (Daftar Catatan) */}
        {viewState.view === 'section' && currentSection && (
          <SectionDetailView
            section={currentSection}
            isOwner={isOwner}
            onBackToHome={handleGoHome}
            onAddNote={() => {
              setTargetSectionIdForNote(currentSection.id);
              setNoteModalOpen(true);
            }}
            onOpenNote={handleOpenNote}
            onEditNote={(note) => {
              handleOpenNote(note.id);
            }}
            onDeleteNote={promptDeleteNote}
            onRequestOwnerAuth={() => setOwnerModalOpen(true)}
          />
        )}

        {/* VIEW 3: NOTE DETAIL (Detail Catatan & Komentar) */}
        {viewState.view === 'note' && currentNote && (
          <NoteDetailView
            note={currentNote}
            isOwner={isOwner}
            onBackToSection={handleBackToSection}
            onSaveContent={handleSaveNoteContent}
            onSaveTitle={handleSaveNoteTitle}
            onDeleteNote={() => promptDeleteNote(currentNote)}
            onAddComment={handleAddComment}
            onToggleModerateComment={handleToggleModerateComment}
            onDeleteComment={handleDeleteComment}
            onRequestOwnerAuth={() => setOwnerModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavMobile
        currentView={viewState.view}
        onGoHome={handleGoHome}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenOwner={() => setOwnerModalOpen(true)}
        isOwner={isOwner}
      />

      {/* Modals */}
      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={handleCreateOrEditSection}
        editingSection={editingSection}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSubmit={handleCreateNote}
        sections={sections}
        defaultSectionId={targetSectionIdForNote}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        warningNote={confirmModal.warningNote}
        confirmText={confirmModal.confirmText}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      <OwnerModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        isOwner={isOwner}
        onLoginSuccess={() => {
          setIsOwner(true);
          addToast('success', 'Sesi pemilik aktif. Anda dapat mengelola catatan sekarang.');
        }}
        onLogoutSuccess={() => {
          setIsOwner(false);
          addToast('info', 'Sesi pemilik telah berakhir.');
        }}
        sections={sections}
        onAddSection={() => {
          setOwnerModalOpen(false);
          setEditingSection(null);
          setSectionModalOpen(true);
        }}
        onEditSection={(sec) => {
          setOwnerModalOpen(false);
          setEditingSection(sec);
          setSectionModalOpen(true);
        }}
        onDeleteSection={(sec) => {
          promptDeleteSection(sec);
        }}
        onOpenNote={(noteId) => {
          setOwnerModalOpen(false);
          handleOpenNote(noteId);
        }}
        onDeleteNote={(note) => {
          promptDeleteNote(note);
        }}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
