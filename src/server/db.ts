import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Section, Note, Comment, SearchResult } from '../types/index.ts';

interface DatabaseData {
  sections: Section[];
  notes: Note[];
  comments: Comment[];
  version: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'ruang_catatan.json');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'sec-1',
    title: 'Catatan Magang',
    slug: 'catatan-magang',
    icon: 'file-text',
    description: 'Berisi catatan selama kegiatan magang, mulai dari ide, diskusi, hingga hasil kerja.',
    sortOrder: 1,
    createdAt: '2025-04-01T08:00:00.000Z',
    updatedAt: '2025-04-11T14:32:00.000Z',
  },
  {
    id: 'sec-2',
    title: 'Ide Project',
    slug: 'ide-project',
    icon: 'lightbulb',
    description: 'Kumpulan gagasan kreatif, eksplorasi teknologi baru, dan rencana arsitektur sistem.',
    sortOrder: 2,
    createdAt: '2025-04-02T09:30:00.000Z',
    updatedAt: '2025-04-10T11:20:00.000Z',
  },
  {
    id: 'sec-3',
    title: 'Kuliah',
    slug: 'kuliah',
    icon: 'graduation-cap',
    description: 'Rangkuman materi perkuliahan, tugas akhir, dan jadwal bimbingan akademik.',
    sortOrder: 3,
    createdAt: '2025-04-03T10:00:00.000Z',
    updatedAt: '2025-04-09T16:45:00.000Z',
  },
  {
    id: 'sec-4',
    title: 'Referensi',
    slug: 'referensi',
    icon: 'link',
    description: 'Tautan dokumentasi, artikel ilmiah, panduan desain, dan inspirasi open source.',
    sortOrder: 4,
    createdAt: '2025-04-04T13:15:00.000Z',
    updatedAt: '2025-04-08T15:10:00.000Z',
  },
  {
    id: 'sec-5',
    title: 'Meeting',
    slug: 'meeting',
    icon: 'users',
    description: 'Notula rapat internal tim, sync mingguan, dan tindak lanjut action items.',
    sortOrder: 5,
    createdAt: '2025-04-05T14:00:00.000Z',
    updatedAt: '2025-04-07T17:00:00.000Z',
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    sectionId: 'sec-1',
    title: 'Hasil diskusi mentor',
    slug: 'hasil-diskusi-mentor',
    content: `<p>Hari ini kami berdiskusi mengenai arah pengembangan aplikasi. Beberapa poin penting yang dibahas antara lain:</p><ol><li>Fokus pada fitur utama terlebih dahulu.</li><li>Gunakan teknologi yang lebih stabil dan mudah di-maintain.</li><li>Pertimbangkan integrasi dengan layanan pihak ketiga.</li></ol><h3>Catatan tambahan</h3><ul data-type="taskList"><li data-checked="false"><label><input type="checkbox"></label><div><p>Perbaiki struktur database</p></div></li><li data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Update dokumentasi API</p></div></li><li data-checked="false"><label><input type="checkbox"></label><div><p>Siapkan prototype untuk evaluasi</p></div></li></ul><p>Link referensi: <a href="https://example.com/mentorship" target="_blank" rel="noopener noreferrer">https://example.com/mentorship</a></p>`,
    snippet: 'Hari ini kami berdiskusi mengenai arah pengembangan aplikasi. Beberapa poin penting yang dibahas antara lain: fokus pada fitur utama terlebih dahulu...',
    sortOrder: 1,
    createdAt: '2025-04-10T08:30:00.000Z',
    updatedAt: '2025-04-11T14:32:00.000Z',
  },
  {
    id: 'note-2',
    sectionId: 'sec-1',
    title: 'Ide pengembangan aplikasi',
    slug: 'ide-pengembangan-aplikasi',
    content: `<p>Beberapa ide fitur yang bisa dikembangkan untuk project magang, seperti sistem notifikasi dan integrasi API yang lebih modular.</p><ul><li>Desain antarmuka yang lebih clean dan ramah pengguna mobile.</li><li>Optimalisasi debounce autosave untuk pengalaman menulis tanpa jeda.</li><li>Pengelompokan catatan dengan sistem penanda dan pencarian cepat.</li></ul>`,
    snippet: 'Beberapa ide fitur yang bisa dikembangkan untuk project magang, seperti sistem notifikasi dan integrasi API...',
    sortOrder: 2,
    createdAt: '2025-04-12T09:00:00.000Z',
    updatedAt: '2025-04-12T09:00:00.000Z',
  },
  {
    id: 'note-3',
    sectionId: 'sec-1',
    title: 'Daftar revisi',
    slug: 'daftar-revisi',
    content: `<p>Berikut adalah daftar revisi yang perlu dilakukan sebelum presentasi final minggu depan:</p><ul data-type="taskList"><li data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Uji responsivitas pada perangkat layar sentuh</p></div></li><li data-checked="false"><label><input type="checkbox"></label><div><p>Periksa validasi input komentar terhadap konten spam</p></div></li><li data-checked="false"><label><input type="checkbox"></label><div><p>Tambahkan breadcrumb navigasi yang intuitif</p></div></li></ul>`,
    snippet: 'Berikut adalah daftar revisi yang perlu dilakukan sebelum presentasi final...',
    sortOrder: 3,
    createdAt: '2025-04-08T10:15:00.000Z',
    updatedAt: '2025-04-08T10:15:00.000Z',
  },
  {
    id: 'note-4',
    sectionId: 'sec-1',
    title: 'Referensi project',
    slug: 'referensi-project',
    content: `<p>Beberapa referensi project yang bisa dijadikan inspirasi untuk pengembangan fitur dan pengalaman antarmuka yang nyaman.</p><p>Prinsip utama yang diadaptasi adalah estetika editorial tenang dengan aksen warna sage green dan cream hangat.</p>`,
    snippet: 'Beberapa referensi project yang bisa dijadikan inspirasi untuk pengembangan fitur...',
    sortOrder: 4,
    createdAt: '2025-04-05T11:45:00.000Z',
    updatedAt: '2025-04-05T11:45:00.000Z',
  },
  {
    id: 'note-5',
    sectionId: 'sec-2',
    title: 'Arsitektur micro-services sederhana',
    slug: 'arsitektur-micro-services-sederhana',
    content: `<p>Rancangan pemisahan service otorisasi dan konten utama untuk menjaga performa server tetap stabil.</p>`,
    snippet: 'Rancangan pemisahan service otorisasi dan konten utama untuk menjaga performa...',
    sortOrder: 1,
    createdAt: '2025-04-02T10:00:00.000Z',
    updatedAt: '2025-04-06T12:00:00.000Z',
  },
  {
    id: 'note-6',
    sectionId: 'sec-2',
    title: 'Benchmarking state management',
    slug: 'benchmarking-state-management',
    content: `<p>Hasil perbandingan performa antara optimistic updates dan server-rendered state.</p>`,
    snippet: 'Hasil perbandingan performa antara optimistic updates dan server-rendered state...',
    sortOrder: 2,
    createdAt: '2025-04-04T15:20:00.000Z',
    updatedAt: '2025-04-07T08:10:00.000Z',
  },
  {
    id: 'note-7',
    sectionId: 'sec-2',
    title: 'Desain sistem tema tenang',
    slug: 'desain-sistem-tema-tenang',
    content: `<p>Eksplorasi palet warna sage, cream, dan forest green untuk menghindari kelelahan mata pengguna saat membaca panjang.</p>`,
    snippet: 'Eksplorasi palet warna sage, cream, dan forest green untuk menghindari kelelahan mata...',
    sortOrder: 3,
    createdAt: '2025-04-06T14:00:00.000Z',
    updatedAt: '2025-04-09T18:00:00.000Z',
  },
  {
    id: 'note-8',
    sectionId: 'sec-3',
    title: 'Rangkuman kuliah basis data lanjut',
    slug: 'rangkuman-kuliah-basis-data-lanjut',
    content: `<p>Konsep indexing B-Tree, query optimization, dan normalisasi bentuk ketiga hingga BCNF.</p>`,
    snippet: 'Konsep indexing B-Tree, query optimization, dan normalisasi bentuk ketiga hingga BCNF...',
    sortOrder: 1,
    createdAt: '2025-04-03T08:00:00.000Z',
    updatedAt: '2025-04-05T09:00:00.000Z',
  },
  {
    id: 'note-9',
    sectionId: 'sec-4',
    title: 'Dokumentasi REST API & Best Practices',
    slug: 'dokumentasi-rest-api-best-practices',
    content: `<p>Kumpulan tautan panduan REST API standar industri, status codes yang tepat, dan teknik caching.</p>`,
    snippet: 'Kumpulan tautan panduan REST API standar industri, status codes yang tepat...',
    sortOrder: 1,
    createdAt: '2025-04-04T14:00:00.000Z',
    updatedAt: '2025-04-08T11:00:00.000Z',
  },
  {
    id: 'note-10',
    sectionId: 'sec-5',
    title: 'Sinkronisasi mingguan sprint 4',
    slug: 'sinkronisasi-mingguan-sprint-4',
    content: `<p>Catatan pembahasan sprint 4 mengenai integrasi rich text dan autosave debounce.</p>`,
    snippet: 'Catatan pembahasan sprint 4 mengenai integrasi rich text dan autosave debounce...',
    sortOrder: 1,
    createdAt: '2025-04-05T15:00:00.000Z',
    updatedAt: '2025-04-07T16:00:00.000Z',
  },
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    noteId: 'note-1',
    authorName: 'Rina',
    content: 'Terima kasih atas rangkumannya! Sangat membantu sekali ✨',
    createdAt: '2025-04-11T15:20:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-2',
    noteId: 'note-1',
    authorName: 'Dika',
    content: 'Menurutku poin nomor 2 juga penting banget, semoga bisa segera diimplementasikan.',
    createdAt: '2025-04-11T14:50:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-3',
    noteId: 'note-1',
    authorName: 'Sari',
    content: 'Link referensinya menarik, makasih sudah share!',
    createdAt: '2025-04-10T16:30:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-4',
    noteId: 'note-1',
    authorName: 'Budi',
    content: 'Siap, untuk prototipe evaluasi sudah mulai kami kerjakan bersama tim.',
    createdAt: '2025-04-10T11:15:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-5',
    noteId: 'note-1',
    authorName: 'Andra',
    content: 'Mantap rangkumannya, jelas dan to the point.',
    createdAt: '2025-04-09T09:40:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-6',
    noteId: 'note-2',
    authorName: 'Fajar',
    content: 'Idenya bagus, terutama bagian autosave!',
    createdAt: '2025-04-12T10:00:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-7',
    noteId: 'note-2',
    authorName: 'Maya',
    content: 'Bisa ditambah shortcut keyboard juga nantinya.',
    createdAt: '2025-04-12T11:20:00.000Z',
    isModerated: false,
  },
  {
    id: 'comm-8',
    noteId: 'note-2',
    authorName: 'Gusti',
    content: 'Setuju, integrasi API modular akan memudahkan penambahan fitur baru.',
    createdAt: '2025-04-12T12:00:00.000Z',
    isModerated: false,
  },
];

class DatabaseService {
  private data: DatabaseData;
  private isPersisting = false;

  constructor() {
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseData {
    try {
      this.ensureDirectory();
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.sections) && Array.isArray(parsed.notes)) {
          return {
            sections: parsed.sections,
            notes: parsed.notes,
            comments: Array.isArray(parsed.comments) ? parsed.comments : [],
            version: parsed.version || 1,
          };
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to load existing database file, falling back to seed data:', err);
    }

    const initialData: DatabaseData = {
      sections: DEFAULT_SECTIONS,
      notes: DEFAULT_NOTES,
      comments: DEFAULT_COMMENTS,
      version: 1,
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: DatabaseData) {
    try {
      this.ensureDirectory();
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('[DB] Critical error saving database:', err);
    }
  }

  private save() {
    if (this.isPersisting) return;
    this.isPersisting = true;
    try {
      this.saveDataDirect(this.data);
    } finally {
      this.isPersisting = false;
    }
  }

  // --- SECTIONS ---

  getSections(): (Section & { noteCount: number; commentCount: number })[] {
    return this.data.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((sec) => {
        const secNotes = this.data.notes.filter((n) => n.sectionId === sec.id);
        const noteIds = new Set(secNotes.map((n) => n.id));
        const comments = this.data.comments.filter(
          (c) => noteIds.has(c.noteId) && !c.isModerated
        );
        return {
          ...sec,
          noteCount: secNotes.length,
          commentCount: comments.length,
        };
      });
  }

  getSectionByIdOrSlug(idOrSlug: string) {
    const sec = this.data.sections.find(
      (s) => s.id === idOrSlug || s.slug === idOrSlug
    );
    if (!sec) return null;

    const secNotes = this.data.notes
      .filter((n) => n.sectionId === sec.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((n) => {
        const comms = this.data.comments.filter(
          (c) => c.noteId === n.id && !c.isModerated
        );
        return {
          ...n,
          commentCount: comms.length,
          sectionTitle: sec.title,
        };
      });

    const noteIds = new Set(secNotes.map((n) => n.id));
    const totalComments = this.data.comments.filter(
      (c) => noteIds.has(c.noteId) && !c.isModerated
    ).length;

    return {
      ...sec,
      notes: secNotes,
      noteCount: secNotes.length,
      commentCount: totalComments,
    };
  }

  createSection(input: {
    title: string;
    description?: string;
    icon?: string;
  }): Section {
    const title = input.title.trim();
    if (!title) throw new Error('Judul section wajib diisi');

    const id = `sec-${crypto.randomUUID().slice(0, 8)}`;
    let baseSlug = slugify(title) || 'section';
    let slug = baseSlug;
    let counter = 1;
    while (this.data.sections.some((s) => s.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const now = new Date().toISOString();
    const maxOrder = this.data.sections.reduce(
      (acc, s) => Math.max(acc, s.sortOrder || 0),
      0
    );

    const newSection: Section = {
      id,
      title,
      slug,
      icon: input.icon?.trim() || 'file-text',
      description: input.description?.trim() || '',
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    this.data.sections.push(newSection);
    this.save();
    return newSection;
  }

  updateSection(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      icon: string;
      sortOrder: number;
    }>
  ): Section {
    const idx = this.data.sections.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Section tidak ditemukan');

    const sec = this.data.sections[idx];
    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (!trimmed) throw new Error('Judul section tidak boleh kosong');
      sec.title = trimmed;
      sec.slug = slugify(trimmed) || sec.slug;
    }
    if (updates.description !== undefined) {
      sec.description = updates.description.trim();
    }
    if (updates.icon !== undefined) {
      sec.icon = updates.icon.trim() || sec.icon;
    }
    if (updates.sortOrder !== undefined) {
      sec.sortOrder = updates.sortOrder;
    }
    sec.updatedAt = new Date().toISOString();

    this.data.sections[idx] = sec;
    this.save();
    return sec;
  }

  deleteSection(id: string): { deletedNotesCount: number; deletedCommentsCount: number } {
    const secIdx = this.data.sections.findIndex((s) => s.id === id);
    if (secIdx === -1) throw new Error('Section tidak ditemukan');

    // Cascade delete notes and comments
    const noteIdsToDelete = this.data.notes
      .filter((n) => n.sectionId === id)
      .map((n) => n.id);
    const deletedNotesCount = noteIdsToDelete.length;

    const noteSet = new Set(noteIdsToDelete);
    const initialCommentsCount = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => !noteSet.has(c.noteId));
    const deletedCommentsCount = initialCommentsCount - this.data.comments.length;

    this.data.notes = this.data.notes.filter((n) => n.sectionId !== id);
    this.data.sections.splice(secIdx, 1);

    this.save();
    return { deletedNotesCount, deletedCommentsCount };
  }

  // --- NOTES ---

  getNoteById(id: string) {
    const note = this.data.notes.find((n) => n.id === id);
    if (!note) return null;

    const sec = this.data.sections.find((s) => s.id === note.sectionId);
    const comments = this.data.comments
      .filter((c) => c.noteId === note.id && !c.isModerated)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      ...note,
      sectionTitle: sec ? sec.title : 'Section',
      sectionSlug: sec ? sec.slug : '',
      comments,
      commentCount: comments.length,
    };
  }

  createNote(input: {
    sectionId: string;
    title: string;
    content?: string;
  }): Note {
    const title = input.title.trim();
    if (!title) throw new Error('Judul catatan wajib diisi');

    const sec = this.data.sections.find((s) => s.id === input.sectionId);
    if (!sec) throw new Error('Section tujuan tidak ditemukan');

    const id = `note-${crypto.randomUUID().slice(0, 8)}`;
    let baseSlug = slugify(title) || 'catatan';
    let slug = baseSlug;
    let counter = 1;
    while (this.data.notes.some((n) => n.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const content = input.content || '<p></p>';
    const snippet = stripHtml(content).slice(0, 160);
    const now = new Date().toISOString();

    const secNotes = this.data.notes.filter((n) => n.sectionId === sec.id);
    const maxOrder = secNotes.reduce((acc, n) => Math.max(acc, n.sortOrder || 0), 0);

    const newNote: Note = {
      id,
      sectionId: sec.id,
      title,
      slug,
      content,
      snippet,
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    this.data.notes.push(newNote);
    sec.updatedAt = now;
    this.save();
    return newNote;
  }

  updateNote(
    id: string,
    updates: Partial<{
      title: string;
      content: string;
      sortOrder: number;
    }>
  ): Note {
    const idx = this.data.notes.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Catatan tidak ditemukan');

    const note = this.data.notes[idx];
    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (!trimmed) throw new Error('Judul catatan tidak boleh kosong');
      note.title = trimmed;
    }

    if (updates.content !== undefined) {
      note.content = updates.content;
      note.snippet = stripHtml(updates.content).slice(0, 160);
    }

    if (updates.sortOrder !== undefined) {
      note.sortOrder = updates.sortOrder;
    }

    const now = new Date().toISOString();
    note.updatedAt = now;

    // Update parent section updatedAt too
    const sec = this.data.sections.find((s) => s.id === note.sectionId);
    if (sec) {
      sec.updatedAt = now;
    }

    this.data.notes[idx] = note;
    this.save();
    return note;
  }

  deleteNote(id: string): { deletedCommentsCount: number } {
    const noteIdx = this.data.notes.findIndex((n) => n.id === id);
    if (noteIdx === -1) throw new Error('Catatan tidak ditemukan');

    const initialCommentsCount = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.noteId !== id);
    const deletedCommentsCount = initialCommentsCount - this.data.comments.length;

    this.data.notes.splice(noteIdx, 1);
    this.save();
    return { deletedCommentsCount };
  }

  // --- COMMENTS ---

  getCommentsByNoteId(noteId: string, includeModerated = false): Comment[] {
    return this.data.comments
      .filter((c) => c.noteId === noteId && (includeModerated || !c.isModerated))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addComment(input: {
    noteId: string;
    authorName: string;
    content: string;
  }): Comment {
    const authorName = input.authorName.trim();
    const content = input.content.trim();

    if (!authorName || authorName.length < 2) {
      throw new Error('Nama panggilan minimal 2 karakter');
    }
    if (authorName.length > 50) {
      throw new Error('Nama panggilan maksimal 50 karakter');
    }
    if (!content || content.length < 2) {
      throw new Error('Isi komentar minimal 2 karakter');
    }
    if (content.length > 1000) {
      throw new Error('Isi komentar maksimal 1000 karakter');
    }

    const note = this.data.notes.find((n) => n.id === input.noteId);
    if (!note) throw new Error('Catatan tidak ditemukan');

    const id = `comm-${crypto.randomUUID().slice(0, 8)}`;
    const newComment: Comment = {
      id,
      noteId: note.id,
      authorName,
      content,
      createdAt: new Date().toISOString(),
      isModerated: false,
    };

    this.data.comments.push(newComment);
    this.save();
    return newComment;
  }

  toggleModerateComment(id: string): Comment {
    const comm = this.data.comments.find((c) => c.id === id);
    if (!comm) throw new Error('Komentar tidak ditemukan');

    comm.isModerated = !comm.isModerated;
    this.save();
    return comm;
  }

  deleteComment(id: string): void {
    const idx = this.data.comments.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Komentar tidak ditemukan');

    this.data.comments.splice(idx, 1);
    this.save();
  }

  // --- SEARCH ---

  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    // Search Sections
    for (const sec of this.data.sections) {
      if (
        sec.title.toLowerCase().includes(q) ||
        (sec.description && sec.description.toLowerCase().includes(q))
      ) {
        const secNotes = this.data.notes.filter((n) => n.sectionId === sec.id);
        results.push({
          id: sec.id,
          type: 'section',
          title: sec.title,
          snippet: sec.description || 'Section catatan',
          updatedAt: sec.updatedAt,
          noteCount: secNotes.length,
        });
      }
    }

    // Search Notes
    for (const note of this.data.notes) {
      const titleMatch = note.title.toLowerCase().includes(q);
      const textMatch = note.snippet.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);

      if (titleMatch || textMatch) {
        const sec = this.data.sections.find((s) => s.id === note.sectionId);
        const comms = this.data.comments.filter(
          (c) => c.noteId === note.id && !c.isModerated
        );
        results.push({
          id: note.id,
          type: 'note',
          title: note.title,
          snippet: note.snippet,
          sectionId: note.sectionId,
          sectionTitle: sec ? sec.title : undefined,
          updatedAt: note.updatedAt,
          commentCount: comms.length,
        });
      }
    }

    return results;
  }

  // --- STATS & SYSTEM INFO ---

  getStats() {
    return {
      totalSections: this.data.sections.length,
      totalNotes: this.data.notes.length,
      totalComments: this.data.comments.length,
    };
  }

  getAllNotesForOwner() {
    return this.data.notes.map((n) => {
      const sec = this.data.sections.find((s) => s.id === n.sectionId);
      const comms = this.data.comments.filter((c) => c.noteId === n.id);
      return {
        ...n,
        sectionTitle: sec ? sec.title : 'Section',
        commentCount: comms.length,
      };
    });
  }

  getAllCommentsForOwner() {
    return this.data.comments.map((c) => {
      const note = this.data.notes.find((n) => n.id === c.noteId);
      return {
        ...c,
        noteTitle: note ? note.title : 'Catatan',
      };
    });
  }
}

export const db = new DatabaseService();
