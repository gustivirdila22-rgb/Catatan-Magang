export interface Section {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  noteCount?: number;
  commentCount?: number;
}

export interface Note {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  content: string; // Rich text HTML
  snippet: string; // Plain-text excerpt
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  sectionTitle?: string;
}

export interface Comment {
  id: string;
  noteId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isModerated: boolean;
}

export interface OwnerStatus {
  isOwner: boolean;
  databaseEngine: string;
  postgresConfigured: boolean;
  totalSections: number;
  totalNotes: number;
  totalComments: number;
}

export interface SearchResult {
  id: string;
  type: 'section' | 'note';
  title: string;
  snippet?: string;
  sectionId?: string;
  sectionTitle?: string;
  updatedAt: string;
  noteCount?: number;
  commentCount?: number;
}

export type ViewMode =
  | { view: 'home' }
  | { view: 'section'; sectionId: string }
  | { view: 'note'; noteId: string }
  | { view: 'owner' };
