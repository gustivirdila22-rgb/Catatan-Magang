import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  verifySecretCodeInput,
  setOwnerCookie,
  clearOwnerCookie,
  isOwnerSession,
  requireOwnerMiddleware,
} from './auth.ts';

export const apiRouter = Router();

// Anti-spam & rate limiter for comments: IP -> lastCommentTimestamp
const commentRateMap = new Map<string, number>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// ==================== OWNER AUTH ====================

apiRouter.get('/owner/status', (req: Request, res: Response) => {
  const isOwner = isOwnerSession(req);
  const stats = db.getStats();
  res.json({
    isOwner,
    databaseEngine: process.env.DATABASE_URL
      ? 'PostgreSQL Engine'
      : 'RuangCatatan Relational Store',
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    ...stats,
  });
});

apiRouter.post('/owner/login', (req: Request, res: Response) => {
  const { allowed, remainingWaitSeconds } = checkLoginRateLimit(req);
  if (!allowed) {
    res.status(429).json({
      error: `Terlalu banyak percobaan gagal. Silakan tunggu ${remainingWaitSeconds} detik sebelum mencoba lagi.`,
    });
    return;
  }

  const { secretCode } = req.body || {};
  if (!secretCode || typeof secretCode !== 'string') {
    recordLoginAttempt(req, false);
    res.status(400).json({ error: 'Kode rahasia wajib diisi.' });
    return;
  }

  const valid = verifySecretCodeInput(secretCode);
  if (!valid) {
    recordLoginAttempt(req, false);
    res.status(401).json({ error: 'Kode rahasia tidak valid. Silakan periksa kembali.' });
    return;
  }

  recordLoginAttempt(req, true);
  setOwnerCookie(res);
  res.json({ ok: true, message: 'Sesi pengelolaan pemilik berhasil diaktifkan.' });
});

apiRouter.post('/owner/logout', (req: Request, res: Response) => {
  clearOwnerCookie(res);
  res.json({ ok: true, message: 'Sesi pengelolaan telah diakhiri.' });
});

// ==================== SECTIONS ====================

apiRouter.get('/sections', (_req: Request, res: Response) => {
  try {
    const sections = db.getSections();
    res.json({ sections });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat sections' });
  }
});

apiRouter.get('/sections/:idOrSlug', (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const section = db.getSectionByIdOrSlug(idOrSlug);
    if (!section) {
      res.status(404).json({ error: 'Section tidak ditemukan' });
      return;
    }
    res.json({ section });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat section' });
  }
});

apiRouter.post('/sections', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { title, description, icon } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Judul section wajib diisi.' });
      return;
    }

    const newSec = db.createSection({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      icon: typeof icon === 'string' ? icon.trim() : 'file-text',
    });

    res.status(201).json({
      section: newSec,
      message: 'Section baru berhasil dibuat.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat section' });
  }
});

apiRouter.put('/sections/:id', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, icon, sortOrder } = req.body || {};

    const updated = db.updateSection(id, {
      title,
      description,
      icon,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
    });

    res.json({
      section: updated,
      message: 'Section berhasil diperbarui.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui section' });
  }
});

apiRouter.delete('/sections/:id', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.deleteSection(id);
    res.json({
      ok: true,
      message: `Section berhasil dihapus beserta ${result.deletedNotesCount} catatan dan ${result.deletedCommentsCount} komentar.`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus section' });
  }
});

// ==================== NOTES ====================

apiRouter.get('/notes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = db.getNoteById(id);
    if (!note) {
      res.status(404).json({ error: 'Catatan tidak ditemukan' });
      return;
    }

    // If owner, also fetch moderated comments
    if (isOwnerSession(req)) {
      note.comments = db.getCommentsByNoteId(note.id, true);
    }

    res.json({ note });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat catatan' });
  }
});

apiRouter.post('/notes', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { sectionId, title, content } = req.body || {};
    if (!sectionId || typeof sectionId !== 'string') {
      res.status(400).json({ error: 'Section tujuan wajib dipilih.' });
      return;
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Judul catatan wajib diisi.' });
      return;
    }

    const newNote = db.createNote({
      sectionId,
      title: title.trim(),
      content: typeof content === 'string' ? content : '<p></p>',
    });

    res.status(201).json({
      note: newNote,
      message: 'Catatan baru berhasil dibuat.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat catatan' });
  }
});

apiRouter.put('/notes/:id', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, sortOrder } = req.body || {};

    const updated = db.updateNote(id, {
      title,
      content,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
    });

    res.json({
      note: updated,
      message: 'Catatan berhasil disimpan.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyimpan catatan' });
  }
});

apiRouter.delete('/notes/:id', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.deleteNote(id);
    res.json({
      ok: true,
      message: `Catatan berhasil dihapus beserta ${result.deletedCommentsCount} komentar.`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus catatan' });
  }
});

// ==================== COMMENTS ====================

apiRouter.get('/notes/:noteId/comments', (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const isOwner = isOwnerSession(req);
    const comments = db.getCommentsByNoteId(noteId, isOwner);
    res.json({ comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat komentar' });
  }
});

apiRouter.post('/notes/:noteId/comments', (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const ip = getClientIp(req);
    const now = Date.now();

    // Rate limiting: 4 seconds between comments from same IP
    const lastTime = commentRateMap.get(ip) || 0;
    if (now - lastTime < 4000) {
      res.status(429).json({
        error: 'Mohon tunggu beberapa detik sebelum mengirim komentar berikutnya.',
      });
      return;
    }

    const { authorName, content } = req.body || {};
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
      res.status(400).json({ error: 'Nama panggilan minimal 2 karakter.' });
      return;
    }
    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      res.status(400).json({ error: 'Isi komentar minimal 2 karakter.' });
      return;
    }

    // Basic spam filter check
    const cleanContent = content.trim();
    if (cleanContent.length > 1000) {
      res.status(400).json({ error: 'Komentar terlalu panjang (maksimal 1000 karakter).' });
      return;
    }

    const newComment = db.addComment({
      noteId,
      authorName: authorName.trim(),
      content: cleanContent,
    });

    commentRateMap.set(ip, now);

    const note = db.getNoteById(noteId);
    res.status(201).json({
      comment: newComment,
      commentCount: note ? note.commentCount : 1,
      message: 'Komentar Anda berhasil dikirim.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengirim komentar' });
  }
});

apiRouter.put('/comments/:id/moderate', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comm = db.toggleModerateComment(id);
    res.json({
      comment: comm,
      message: comm.isModerated
        ? 'Komentar disembunyikan dari publik.'
        : 'Komentar kembali ditampilkan ke publik.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memoderasi komentar' });
  }
});

apiRouter.delete('/comments/:id', requireOwnerMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.deleteComment(id);
    res.json({ ok: true, message: 'Komentar berhasil dihapus.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus komentar' });
  }
});

// ==================== SEARCH & OWNER VIEWS ====================

apiRouter.get('/search', (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = db.search(query);
    res.json({ query, results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal melakukan pencarian' });
  }
});

apiRouter.get('/owner/notes', requireOwnerMiddleware, (_req: Request, res: Response) => {
  try {
    const notes = db.getAllNotesForOwner();
    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat daftar catatan' });
  }
});

apiRouter.get('/owner/comments', requireOwnerMiddleware, (_req: Request, res: Response) => {
  try {
    const comments = db.getAllCommentsForOwner();
    res.json({ comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat daftar komentar' });
  }
});

apiRouter.get('/system/info', (_req: Request, res: Response) => {
  res.json({
    appName: 'Ruang Catatan',
    version: '1.0.0',
    databaseEngine: process.env.DATABASE_URL
      ? 'PostgreSQL (Cloud / Remote)'
      : 'RuangCatatan Relational Store (Embedded Persistent Disk)',
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    configuredEnvVars: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      OWNER_SECRET_CODE: Boolean(process.env.OWNER_SECRET_CODE),
    },
    setupInstructions: {
      ownerSecret: 'Gunakan environment variable OWNER_SECRET_CODE di .env untuk mengatur kode rahasia pemilik.',
      postgres: 'Untuk beralih ke PostgreSQL, atur DATABASE_URL="postgres://user:password@host:port/database" di .env.',
    },
  });
});
