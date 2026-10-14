import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Folder,
  FileText,
  Settings,
  Plus,
  Edit3,
  Trash2,
  LogOut,
  Database,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { Section, Note, OwnerStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { getSectionIconComponent } from '../utils/icons.tsx';
import { formatDateShort } from '../utils/date.ts';

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onLoginSuccess: () => void;
  onLogoutSuccess: () => void;
  sections: (Section & { noteCount?: number; commentCount?: number })[];
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onOpenNote: (noteId: string) => void;
  onDeleteNote: (note: Note) => void;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({
  isOpen,
  onClose,
  isOwner,
  onLoginSuccess,
  onLogoutSuccess,
  sections,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onOpenNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'sections' | 'notes' | 'settings'>('sections');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ownerNotes, setOwnerNotes] = useState<(Note & { sectionTitle: string; commentCount: number })[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // Load owner notes when tab is switched to notes
  useEffect(() => {
    if (isOpen && isOwner && activeTab === 'notes') {
      api.getOwnerNotes()
        .then((res) => setOwnerNotes(res.notes))
        .catch((err) => console.error(err));
    }
  }, [isOpen, isOwner, activeTab]);

  // Load system info
  useEffect(() => {
    if (isOpen && isOwner && activeTab === 'settings') {
      api.getSystemInfo()
        .then((res) => setSystemInfo(res))
        .catch((err) => console.error(err));
    }
  }, [isOpen, isOwner, activeTab]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!secretCode.trim()) {
      setErrorMsg('Masukkan kode rahasia pemilik.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.ownerLogin(secretCode.trim());
      setSecretCode('');
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kode rahasia tidak valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.ownerLogout();
      onLogoutSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#E7E5DD] shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-[#778078] hover:text-[#26352C] rounded-full hover:bg-[#F5F1E8] transition-colors z-20"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. STATE: LOCKED (Input Secret Code) matching Mockup */}
        {!isOwner ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center">
            {/* Lock Circle Icon */}
            <div className="w-16 h-16 rounded-full bg-[#E4EADF] text-[#344F3D] flex items-center justify-center mb-6 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#26352C] tracking-tight mb-2">
              Akses Pengelolaan
            </h2>

            <p className="text-sm text-[#778078] max-w-sm mb-6">
              Masukkan kode rahasia untuk melanjutkan ke area pengelolaan pemilik.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kode rahasia..."
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-3 pr-12 text-sm bg-[#FAF8F5] border border-[#E7E5DD] rounded-xl text-[#26352C] placeholder-[#778078] focus:bg-white focus:outline-none focus:border-[#879B83] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778078] hover:text-[#26352C] p-1"
                  aria-label={showPassword ? 'Sembunyikan kode' : 'Lihat kode'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-[#9E3B3B] font-medium animate-in fade-in">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !secretCode.trim()}
                className="w-full py-3 bg-[#344F3D] hover:bg-[#263A2D] disabled:opacity-40 text-white text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </form>

            <p className="text-[11px] text-[#778078] mt-8 max-w-xs leading-relaxed">
              Halaman ini hanya untuk pemilik.
              <br />
              Kode rahasia tidak dibagikan ke publik.
            </p>
          </div>
        ) : (
          /* 2. STATE: AUTHENTICATED DASHBOARD matching Mockup */
          <div className="flex flex-col h-full flex-1 overflow-hidden">
            {/* Dashboard Top Header */}
            <div className="px-6 py-4 border-b border-[#E7E5DD] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#26352C]">
                  Dashboard Pengelolaan
                </h2>
                <span className="text-xs text-[#778078]">
                  Sesi pemilik aktif
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9E3B3B] hover:bg-[#FDF2F2] rounded-lg transition-colors mr-8 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Sesi</span>
              </button>
            </div>

            {/* Dashboard Layout: Tabs + Content */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-[#E7E5DD] bg-[#FAF8F5]/60 p-3 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('sections')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap ${
                    activeTab === 'sections'
                      ? 'bg-white text-[#344F3D] shadow-2xs border border-[#E7E5DD]'
                      : 'text-[#778078] hover:text-[#26352C] hover:bg-white/50'
                  }`}
                >
                  <Folder className="w-4 h-4 text-[#879B83]" />
                  <span>Section</span>
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap ${
                    activeTab === 'notes'
                      ? 'bg-white text-[#344F3D] shadow-2xs border border-[#E7E5DD]'
                      : 'text-[#778078] hover:text-[#26352C] hover:bg-white/50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#879B83]" />
                  <span>Catatan</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-white text-[#344F3D] shadow-2xs border border-[#E7E5DD]'
                      : 'text-[#778078] hover:text-[#26352C] hover:bg-white/50'
                  }`}
                >
                  <Settings className="w-4 h-4 text-[#879B83]" />
                  <span>Pengaturan</span>
                </button>
              </div>

              {/* Main Tab Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {/* TAB 1: SECTION MANAGEMENT */}
                {activeTab === 'sections' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-sans font-semibold text-base text-[#26352C]">
                        Kelola Section
                      </h3>
                      <button
                        onClick={onAddSection}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#344F3D] hover:bg-[#263A2D] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Section</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {sections.map((sec) => {
                        const Icon = getSectionIconComponent(sec.icon);
                        return (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between gap-3 p-3.5 bg-white border border-[#E7E5DD] rounded-xl hover:border-[#879B83] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-[#E4EADF] text-[#344F3D] flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm text-[#26352C] truncate">
                                  {sec.title}
                                </h4>
                                <span className="text-xs text-[#778078]">
                                  {sec.noteCount ?? 0} catatan
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onEditSection(sec)}
                                className="p-2 text-[#778078] hover:text-[#344F3D] hover:bg-[#F5F1E8] rounded-lg transition-colors"
                                title="Edit section"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteSection(sec)}
                                className="p-2 text-[#778078] hover:text-[#9E3B3B] hover:bg-[#FDF2F2] rounded-lg transition-colors"
                                title="Hapus section"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: NOTES MANAGEMENT */}
                {activeTab === 'notes' && (
                  <div>
                    <h3 className="font-sans font-semibold text-base text-[#26352C] mb-4">
                      Seluruh Catatan ({ownerNotes.length || '...'})
                    </h3>

                    <div className="space-y-2.5">
                      {ownerNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between gap-3 p-3.5 bg-white border border-[#E7E5DD] rounded-xl hover:border-[#879B83] transition-colors"
                        >
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              onClose();
                              onOpenNote(note.id);
                            }}
                          >
                            <h4 className="font-medium text-sm text-[#26352C] hover:text-[#344F3D] truncate">
                              {note.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[#778078] mt-0.5">
                              <span>{note.sectionTitle}</span>
                              <span aria-hidden="true">·</span>
                              <span>{formatDateShort(note.updatedAt)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{note.commentCount} komentar</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onDeleteNote(note)}
                            className="p-2 text-[#778078] hover:text-[#9E3B3B] hover:bg-[#FDF2F2] rounded-lg transition-colors shrink-0"
                            title="Hapus catatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SETTINGS & DATABASE CONFIG */}
                {activeTab === 'settings' && (
                  <div className="space-y-6 text-xs text-[#26352C]">
                    <div>
                      <h3 className="font-sans font-semibold text-base mb-1">
                        Status Database & Backend
                      </h3>
                      <p className="text-[#778078] leading-relaxed">
                        Data tersimpan secara persisten di server dan dapat diakses dari browser mana pun tanpa mengandalkan localStorage.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FAF8F5] border border-[#E7E5DD] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#778078]">Mesin Database:</span>
                        <span className="font-mono text-xs px-2 py-0.5 bg-white border border-[#E7E5DD] rounded text-[#344F3D]">
                          {systemInfo?.databaseEngine || 'RuangCatatan Relational Store'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#778078]">PostgreSQL Terhubung:</span>
                        <span className="flex items-center gap-1 font-medium">
                          {systemInfo?.postgresConfigured ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                            </span>
                          ) : (
                            <span className="text-[#778078]">
                              Belum (Menggunakan Relational Disk Store)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#778078]">Kode Rahasia Pemilik:</span>
                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terkonfigurasi di Server
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs text-[#26352C]">
                        Konfigurasi Environment Variable (.env)
                      </h4>
                      <p className="text-[#778078] leading-relaxed">
                        Untuk mengubah kode rahasia pemilik atau menghubungkan PostgreSQL eksternal:
                      </p>
                      <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                        {`# Kode rahasia pemilik\nOWNER_SECRET_CODE="kode_rahasia_anda"\n\n# Koneksi PostgreSQL (opsional)\nDATABASE_URL="postgres://user:pass@host:5432/dbname"`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
