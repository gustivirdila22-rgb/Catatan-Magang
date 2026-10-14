import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import type { Comment, Note, SearchResult, Section } from '../types/index.ts';

interface DatabaseData {
  sections: Section[];
  notes: Note[];
  comments: Comment[];
}

interface SectionRow {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  note_count?: string | number;
  comment_count?: string | number;
}

interface NoteRow {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  content: string;
  snippet: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  section_title?: string;
  section_slug?: string;
  comment_count?: string | number;
}

interface CommentRow {
  id: string;
  note_id: string;
  author_name: string;
  content: string;
  created_at: string;
  is_moderated: boolean;
  parent_comment_id: string | null;
  is_owner_reply: boolean;
  note_title?: string;
}

const LOCAL_DATA_FILE = path.resolve(process.cwd(), 'data', 'ruang_catatan.json');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSection(row: SectionRow): Section {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    icon: row.icon,
    description: row.description ?? '',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    sectionId: row.section_id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    snippet: row.snippet,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    noteId: row.note_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
    isModerated: row.is_moderated,
    parentCommentId: row.parent_comment_id,
    isOwnerReply: row.is_owner_reply,
  };
}

export class SupabaseDatabaseService {
  private readonly pool: Pool;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'file-text',
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        snippet TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
        parent_comment_id TEXT,
        is_owner_reply BOOLEAN NOT NULL DEFAULT FALSE
      );

      ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id TEXT;
      ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_owner_reply BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS notes_section_id_idx ON notes(section_id);
      CREATE INDEX IF NOT EXISTS comments_note_id_idx ON comments(note_id);
    `);

    await this.importLocalDataIfDatabaseIsEmpty();
    this.initialized = true;
    console.info('[DB] Connected to Supabase PostgreSQL.');
  }

  private async importLocalDataIfDatabaseIsEmpty(): Promise<void> {
    if (!fs.existsSync(LOCAL_DATA_FILE)) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(8675309, 1)');
      const { rows } = await client.query<{ is_empty: boolean }>(`
        SELECT
          NOT EXISTS (SELECT 1 FROM sections)
          AND NOT EXISTS (SELECT 1 FROM notes)
          AND NOT EXISTS (SELECT 1 FROM comments) AS is_empty
      `);
      if (!rows[0]?.is_empty) {
        await client.query('COMMIT');
        return;
      }

      const parsed = JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8')) as Partial<DatabaseData>;
      if (!Array.isArray(parsed.sections) || !Array.isArray(parsed.notes)) {
        throw new Error('File data/ruang_catatan.json tidak berisi data section dan catatan yang valid.');
      }

      for (const section of parsed.sections) {
        await client.query(
          `INSERT INTO sections (id, title, slug, icon, description, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            section.id,
            section.title,
            section.slug,
            section.icon,
            section.description ?? '',
            section.sortOrder,
            section.createdAt,
            section.updatedAt,
          ],
        );
      }
      for (const note of parsed.notes) {
        await client.query(
          `INSERT INTO notes (id, section_id, title, slug, content, snippet, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            note.id,
            note.sectionId,
            note.title,
            note.slug,
            note.content,
            note.snippet,
            note.sortOrder,
            note.createdAt,
            note.updatedAt,
          ],
        );
      }
      for (const comment of parsed.comments ?? []) {
        await client.query(
          `INSERT INTO comments
             (id, note_id, author_name, content, created_at, is_moderated, parent_comment_id, is_owner_reply)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            comment.id,
            comment.noteId,
            comment.authorName,
            comment.content,
            comment.createdAt,
            comment.isModerated,
            comment.parentCommentId ?? null,
            comment.isOwnerReply ?? false,
          ],
        );
      }
      await client.query('COMMIT');
      console.info(
        `[DB] Imported local data into Supabase (${parsed.sections.length} sections, ${parsed.notes.length} notes).`,
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getSections(): Promise<(Section & { noteCount: number; commentCount: number })[]> {
    const { rows } = await this.pool.query<SectionRow>(`
      SELECT s.*,
        COUNT(DISTINCT n.id)::int AS note_count,
        COUNT(c.id) FILTER (WHERE c.is_moderated = FALSE)::int AS comment_count
      FROM sections s
      LEFT JOIN notes n ON n.section_id = s.id
      LEFT JOIN comments c ON c.note_id = n.id
      GROUP BY s.id
      ORDER BY s.sort_order
    `);
    return rows.map((row) => ({
      ...toSection(row),
      noteCount: Number(row.note_count ?? 0),
      commentCount: Number(row.comment_count ?? 0),
    }));
  }

  async getSectionByIdOrSlug(idOrSlug: string) {
    const { rows: sectionRows } = await this.pool.query<SectionRow>(
      'SELECT * FROM sections WHERE id = $1 OR slug = $1 LIMIT 1',
      [idOrSlug],
    );
    const row = sectionRows[0];
    if (!row) return null;

    const section = toSection(row);
    const { rows: noteRows } = await this.pool.query<NoteRow>(
      `SELECT n.*, s.title AS section_title,
        COUNT(c.id) FILTER (WHERE c.is_moderated = FALSE)::int AS comment_count
       FROM notes n
       JOIN sections s ON s.id = n.section_id
       LEFT JOIN comments c ON c.note_id = n.id
       WHERE n.section_id = $1
       GROUP BY n.id, s.title
       ORDER BY n.sort_order, n.updated_at DESC`,
      [section.id],
    );
    const notes = noteRows.map((note) => ({
      ...toNote(note),
      commentCount: Number(note.comment_count ?? 0),
      sectionTitle: section.title,
    }));
    const commentCount = notes.reduce((total, note) => total + (note.commentCount ?? 0), 0);
    return { ...section, notes, noteCount: notes.length, commentCount };
  }

  async createSection(input: { title: string; description?: string; icon?: string }): Promise<Section> {
    const title = input.title.trim();
    if (!title) throw new Error('Judul section wajib diisi');

    const baseSlug = slugify(title) || 'section';
    let slug = baseSlug;
    let counter = 1;
    while ((await this.pool.query('SELECT 1 FROM sections WHERE slug = $1', [slug])).rowCount) {
      slug = `${baseSlug}-${counter++}`;
    }

    const now = new Date().toISOString();
    const id = `sec-${crypto.randomUUID().slice(0, 8)}`;
    const { rows } = await this.pool.query<SectionRow>(
      `INSERT INTO sections (id, title, slug, icon, description, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order) FROM sections), 0) + 1, $6, $6)
       RETURNING *`,
      [id, title, slug, input.icon?.trim() || 'file-text', input.description?.trim() || '', now],
    );
    return toSection(rows[0]);
  }

  async updateSection(
    id: string,
    updates: Partial<{ title: string; description: string; icon: string; sortOrder: number }>,
  ): Promise<Section> {
    const { rows: existingRows } = await this.pool.query<SectionRow>(
      'SELECT * FROM sections WHERE id = $1',
      [id],
    );
    const existing = existingRows[0];
    if (!existing) throw new Error('Section tidak ditemukan');

    let title = existing.title;
    let slug = existing.slug;
    if (updates.title !== undefined) {
      title = updates.title.trim();
      if (!title) throw new Error('Judul section tidak boleh kosong');
      slug = slugify(title) || slug;
    }
    const { rows } = await this.pool.query<SectionRow>(
      `UPDATE sections
       SET title = $2, slug = $3, description = $4, icon = $5, sort_order = $6, updated_at = $7
       WHERE id = $1 RETURNING *`,
      [
        id,
        title,
        slug,
        updates.description === undefined ? existing.description : updates.description.trim(),
        updates.icon === undefined ? existing.icon : updates.icon.trim() || existing.icon,
        updates.sortOrder === undefined ? existing.sort_order : updates.sortOrder,
        new Date().toISOString(),
      ],
    );
    return toSection(rows[0]);
  }

  async deleteSection(id: string): Promise<{ deletedNotesCount: number; deletedCommentsCount: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ note_count: string; comment_count: string }>(
        `SELECT COUNT(DISTINCT n.id)::text AS note_count, COUNT(c.id)::text AS comment_count
         FROM sections s
         LEFT JOIN notes n ON n.section_id = s.id
         LEFT JOIN comments c ON c.note_id = n.id
         WHERE s.id = $1
         GROUP BY s.id`,
        [id],
      );
      if (!rows[0]) throw new Error('Section tidak ditemukan');
      await client.query('DELETE FROM sections WHERE id = $1', [id]);
      await client.query('COMMIT');
      return {
        deletedNotesCount: Number(rows[0].note_count),
        deletedCommentsCount: Number(rows[0].comment_count),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getNoteById(id: string) {
    const { rows } = await this.pool.query<NoteRow>(
      `SELECT n.*, s.title AS section_title, s.slug AS section_slug,
        COUNT(c.id) FILTER (WHERE c.is_moderated = FALSE)::int AS comment_count
       FROM notes n
       LEFT JOIN sections s ON s.id = n.section_id
       LEFT JOIN comments c ON c.note_id = n.id
       WHERE n.id = $1
       GROUP BY n.id, s.title, s.slug`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;

    const note = toNote(row);
    const comments = await this.getCommentsByNoteId(id);
    return {
      ...note,
      sectionTitle: row.section_title ?? 'Section',
      sectionSlug: row.section_slug ?? '',
      comments,
      commentCount: Number(row.comment_count ?? 0),
    };
  }

  async createNote(input: { sectionId: string; title: string; content?: string }): Promise<Note> {
    const title = input.title.trim();
    if (!title) throw new Error('Judul catatan wajib diisi');

    const { rows: sectionRows } = await this.pool.query<SectionRow>(
      'SELECT * FROM sections WHERE id = $1',
      [input.sectionId],
    );
    if (!sectionRows[0]) throw new Error('Section tujuan tidak ditemukan');

    const baseSlug = slugify(title) || 'catatan';
    let slug = baseSlug;
    let counter = 1;
    while ((await this.pool.query('SELECT 1 FROM notes WHERE slug = $1', [slug])).rowCount) {
      slug = `${baseSlug}-${counter++}`;
    }

    const content = input.content || '<p></p>';
    const now = new Date().toISOString();
    const id = `note-${crypto.randomUUID().slice(0, 8)}`;
    const { rows } = await this.pool.query<NoteRow>(
      `INSERT INTO notes (id, section_id, title, slug, content, snippet, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6,
         COALESCE((SELECT MAX(sort_order) FROM notes WHERE section_id = $2), 0) + 1, $7, $7)
       RETURNING *`,
      [id, input.sectionId, title, slug, content, stripHtml(content).slice(0, 160), now],
    );
    await this.pool.query('UPDATE sections SET updated_at = $2 WHERE id = $1', [input.sectionId, now]);
    return toNote(rows[0]);
  }

  async updateNote(
    id: string,
    updates: Partial<{ title: string; content: string; sortOrder: number }>,
  ): Promise<Note> {
    const { rows: existingRows } = await this.pool.query<NoteRow>(
      'SELECT * FROM notes WHERE id = $1',
      [id],
    );
    const existing = existingRows[0];
    if (!existing) throw new Error('Catatan tidak ditemukan');

    let title = existing.title;
    if (updates.title !== undefined) {
      title = updates.title.trim();
      if (!title) throw new Error('Judul catatan tidak boleh kosong');
    }
    const content = updates.content ?? existing.content;
    const now = new Date().toISOString();
    const { rows } = await this.pool.query<NoteRow>(
      `UPDATE notes
       SET title = $2, content = $3, snippet = $4, sort_order = $5, updated_at = $6
       WHERE id = $1 RETURNING *`,
      [
        id,
        title,
        content,
        updates.content === undefined ? existing.snippet : stripHtml(content).slice(0, 160),
        updates.sortOrder ?? existing.sort_order,
        now,
      ],
    );
    await this.pool.query('UPDATE sections SET updated_at = $2 WHERE id = $1', [existing.section_id, now]);
    return toNote(rows[0]);
  }

  async deleteNote(id: string): Promise<{ deletedCommentsCount: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ comment_count: string }>(
        'SELECT COUNT(*)::text AS comment_count FROM comments WHERE note_id = $1',
        [id],
      );
      const { rowCount } = await client.query('DELETE FROM notes WHERE id = $1', [id]);
      if (!rowCount) throw new Error('Catatan tidak ditemukan');
      await client.query('COMMIT');
      return { deletedCommentsCount: Number(rows[0].comment_count) };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getCommentsByNoteId(noteId: string, includeModerated = false): Promise<Comment[]> {
    const { rows } = await this.pool.query<CommentRow>(
      `SELECT * FROM comments WHERE note_id = $1 AND ($2::boolean OR is_moderated = FALSE)
       ORDER BY created_at`,
      [noteId, includeModerated],
    );
    return rows.map(toComment);
  }

  async addComment(input: {
    noteId: string;
    authorName: string;
    content: string;
    parentCommentId?: string | null;
    isOwnerReply?: boolean;
  }): Promise<Comment> {
    const authorName = input.authorName.trim();
    const content = input.content.trim();
    if (authorName.length < 2) throw new Error('Nama panggilan minimal 2 karakter');
    if (authorName.length > 50) throw new Error('Nama panggilan maksimal 50 karakter');
    if (content.length < 2) throw new Error('Isi komentar minimal 2 karakter');
    if (content.length > 1000) throw new Error('Isi komentar maksimal 1000 karakter');

    const parentCommentId = input.parentCommentId || null;
    const isOwnerReply = input.isOwnerReply === true;
    if (parentCommentId) {
      const { rows: parentRows } = await this.pool.query<CommentRow>(
        'SELECT * FROM comments WHERE id = $1 AND note_id = $2',
        [parentCommentId, input.noteId],
      );
      const parent = parentRows[0];
      if (!parent) throw new Error('Komentar yang akan dibalas tidak ditemukan');
      if (parent.is_moderated && !isOwnerReply) {
        throw new Error('Komentar ini tidak tersedia untuk dibalas');
      }
    }

    const id = `comm-${crypto.randomUUID().slice(0, 8)}`;
    const { rows } = await this.pool.query<CommentRow>(
      `INSERT INTO comments
         (id, note_id, author_name, content, created_at, is_moderated, parent_comment_id, is_owner_reply)
       SELECT $1, id, $3, $4, $5, FALSE, $6, $7 FROM notes WHERE id = $2
       RETURNING *`,
      [
        id,
        input.noteId,
        isOwnerReply ? 'Pemilik Catatan' : authorName,
        content,
        new Date().toISOString(),
        parentCommentId,
        isOwnerReply,
      ],
    );
    if (!rows[0]) throw new Error('Catatan tidak ditemukan');
    return toComment(rows[0]);
  }

  async toggleModerateComment(id: string): Promise<Comment> {
    const { rows } = await this.pool.query<CommentRow>(
      'UPDATE comments SET is_moderated = NOT is_moderated WHERE id = $1 RETURNING *',
      [id],
    );
    if (!rows[0]) throw new Error('Komentar tidak ditemukan');
    return toComment(rows[0]);
  }

  async deleteComment(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: string }>(
        `WITH RECURSIVE comment_thread AS (
           SELECT id FROM comments WHERE id = $1
           UNION ALL
           SELECT child.id
           FROM comments child
           JOIN comment_thread parent ON child.parent_comment_id = parent.id
         )
         SELECT id FROM comment_thread`,
        [id],
      );
      if (!rows.length) throw new Error('Komentar tidak ditemukan');
      await client.query('DELETE FROM comments WHERE id = ANY($1::text[])', [
        rows.map((row) => row.id),
      ]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const { rows: sectionRows } = await this.pool.query<SectionRow>(
      `SELECT s.*,
        COUNT(DISTINCT n.id)::int AS note_count,
        COUNT(c.id) FILTER (WHERE c.is_moderated = FALSE)::int AS comment_count
       FROM sections s
       LEFT JOIN notes n ON n.section_id = s.id
       LEFT JOIN comments c ON c.note_id = n.id
       WHERE LOWER(s.title) LIKE $1 OR LOWER(s.description) LIKE $1
       GROUP BY s.id`,
      [`%${q}%`],
    );
    const { rows: noteRows } = await this.pool.query<NoteRow>(
      `SELECT n.*, s.title AS section_title,
        COUNT(c.id) FILTER (WHERE c.is_moderated = FALSE)::int AS comment_count
       FROM notes n
       LEFT JOIN sections s ON s.id = n.section_id
       LEFT JOIN comments c ON c.note_id = n.id
       WHERE LOWER(n.title) LIKE $1 OR LOWER(n.snippet) LIKE $1 OR LOWER(n.content) LIKE $1
       GROUP BY n.id, s.title`,
      [`%${q}%`],
    );

    return [
      ...sectionRows.map((row): SearchResult => ({
        id: row.id,
        type: 'section',
        title: row.title,
        snippet: row.description || 'Section catatan',
        updatedAt: row.updated_at,
        noteCount: Number(row.note_count ?? 0),
      })),
      ...noteRows.map((row): SearchResult => ({
        id: row.id,
        type: 'note',
        title: row.title,
        snippet: row.snippet,
        sectionId: row.section_id,
        sectionTitle: row.section_title ?? undefined,
        updatedAt: row.updated_at,
        commentCount: Number(row.comment_count ?? 0),
      })),
    ];
  }

  async getStats(): Promise<{ totalSections: number; totalNotes: number; totalComments: number }> {
    const { rows } = await this.pool.query<{ total_sections: string; total_notes: string; total_comments: string }>(`
      SELECT
        (SELECT COUNT(*) FROM sections)::text AS total_sections,
        (SELECT COUNT(*) FROM notes)::text AS total_notes,
        (SELECT COUNT(*) FROM comments)::text AS total_comments
    `);
    return {
      totalSections: Number(rows[0].total_sections),
      totalNotes: Number(rows[0].total_notes),
      totalComments: Number(rows[0].total_comments),
    };
  }

  async getAllNotesForOwner() {
    const { rows } = await this.pool.query<NoteRow>(
      `SELECT n.*, s.title AS section_title, COUNT(c.id)::int AS comment_count
       FROM notes n
       LEFT JOIN sections s ON s.id = n.section_id
       LEFT JOIN comments c ON c.note_id = n.id
       GROUP BY n.id, s.title
       ORDER BY n.updated_at DESC`,
    );
    return rows.map((row) => ({
      ...toNote(row),
      sectionTitle: row.section_title ?? 'Section',
      commentCount: Number(row.comment_count ?? 0),
    }));
  }

  async getAllCommentsForOwner() {
    const { rows } = await this.pool.query<CommentRow>(
      `SELECT c.*, n.title AS note_title
       FROM comments c LEFT JOIN notes n ON n.id = c.note_id
       ORDER BY c.created_at DESC`,
    );
    return rows.map((row) => ({
      ...toComment(row),
      noteTitle: row.note_title ?? 'Catatan',
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
