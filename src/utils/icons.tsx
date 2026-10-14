import React from 'react';
import {
  FileText,
  Lightbulb,
  GraduationCap,
  Link2,
  Users,
  Folder,
  BookOpen,
  Bookmark,
  Briefcase,
  Coffee,
  Code2,
  PenTool,
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { id: 'file-text', label: 'Dokumen', icon: FileText },
  { id: 'lightbulb', label: 'Ide / Gagasan', icon: Lightbulb },
  { id: 'graduation-cap', label: 'Pendidikan / Kuliah', icon: GraduationCap },
  { id: 'link', label: 'Tautan Referensi', icon: Link2 },
  { id: 'users', label: 'Tim / Meeting', icon: Users },
  { id: 'folder', label: 'Folder / Proyek', icon: Folder },
  { id: 'book', label: 'Buku / Membaca', icon: BookOpen },
  { id: 'bookmark', label: 'Penanda', icon: Bookmark },
  { id: 'briefcase', label: 'Pekerjaan / Bisnis', icon: Briefcase },
  { id: 'coffee', label: 'Santai / Personal', icon: Coffee },
  { id: 'code', label: 'Pemrograman', icon: Code2 },
  { id: 'pen-tool', label: 'Desain / Catatan', icon: PenTool },
];

export function getSectionIconComponent(iconName?: string): React.ComponentType<{ className?: string }> {
  switch (iconName?.toLowerCase()) {
    case 'file-text':
    case 'file':
      return FileText;
    case 'lightbulb':
    case 'idea':
      return Lightbulb;
    case 'graduation-cap':
    case 'education':
    case 'kuliah':
      return GraduationCap;
    case 'link':
    case 'link2':
      return Link2;
    case 'users':
    case 'meeting':
    case 'team':
      return Users;
    case 'folder':
      return Folder;
    case 'book':
    case 'book-open':
      return BookOpen;
    case 'bookmark':
      return Bookmark;
    case 'briefcase':
      return Briefcase;
    case 'coffee':
      return Coffee;
    case 'code':
      return Code2;
    case 'pen-tool':
      return PenTool;
    default:
      return FileText;
  }
}
