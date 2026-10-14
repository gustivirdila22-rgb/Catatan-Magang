import type { Section, Note, Comment, OwnerStatus, SearchResult } from '../types/index.ts';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `HTTP error ${res.status}`;
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).code = data.code;
    throw error;
  }

  return data as T;
}

export const api = {
  // Owner auth
  async getOwnerStatus(): Promise<OwnerStatus> {
    return request<OwnerStatus>('/api/owner/status');
  },

  async ownerLogin(secretCode: string): Promise<{ ok: boolean; message: string }> {
    return request('/api/owner/login', {
      method: 'POST',
      body: JSON.stringify({ secretCode }),
    });
  },

  async ownerLogout(): Promise<{ ok: boolean; message: string }> {
    return request('/api/owner/logout', {
      method: 'POST',
    });
  },

  // Sections
  async getSections(): Promise<{ sections: (Section & { noteCount: number; commentCount: number })[] }> {
    return request('/api/sections');
  },

  async getSection(idOrSlug: string): Promise<{ section: Section & { notes: (Note & { commentCount: number })[]; noteCount: number; commentCount: number } }> {
    return request(`/api/sections/${encodeURIComponent(idOrSlug)}`);
  },

  async createSection(input: { title: string; description?: string; icon?: string }): Promise<{ section: Section; message: string }> {
    return request('/api/sections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateSection(id: string, input: { title?: string; description?: string; icon?: string; sortOrder?: number }): Promise<{ section: Section; message: string }> {
    return request(`/api/sections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteSection(id: string): Promise<{ ok: boolean; message: string; deletedNotesCount: number; deletedCommentsCount: number }> {
    return request(`/api/sections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Notes
  async getNote(id: string): Promise<{ note: Note & { sectionSlug?: string; comments: Comment[] } }> {
    return request(`/api/notes/${encodeURIComponent(id)}`);
  },

  async createNote(input: { sectionId: string; title: string; content?: string }): Promise<{ note: Note; message: string }> {
    return request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateNote(id: string, input: { title?: string; content?: string }): Promise<{ note: Note; message: string }> {
    return request(`/api/notes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteNote(id: string): Promise<{ ok: boolean; message: string; deletedCommentsCount: number }> {
    return request(`/api/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Comments
  async getComments(noteId: string): Promise<{ comments: Comment[] }> {
    return request(`/api/notes/${encodeURIComponent(noteId)}/comments`);
  },

  async addComment(
  noteId: string,
  input: {
    authorName: string;
    content: string;
    parentCommentId?: string | null;
  }
): Promise<{
  comment: Comment;
  commentCount: number;
  message: string;
}> {
  return request(
    `/api/notes/${encodeURIComponent(noteId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
},

  async toggleModerateComment(id: string): Promise<{ comment: Comment; message: string }> {
    return request(`/api/comments/${encodeURIComponent(id)}/moderate`, {
      method: 'PUT',
    });
  },

  async deleteComment(id: string): Promise<{ ok: boolean; message: string }> {
    return request(`/api/comments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Search
  async search(query: string): Promise<{ query: string; results: SearchResult[]; count: number }> {
    return request(`/api/search?q=${encodeURIComponent(query)}`);
  },

  // Owner dashboard lists
  async getOwnerNotes(): Promise<{ notes: (Note & { sectionTitle: string; commentCount: number })[] }> {
    return request('/api/owner/notes');
  },

  async getOwnerComments(): Promise<{ comments: (Comment & { noteTitle: string })[] }> {
    return request('/api/owner/comments');
  },

  // System info
  async getSystemInfo(): Promise<any> {
    return request('/api/system/info');
  },
};
