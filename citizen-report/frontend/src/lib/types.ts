export type Role = 'CITIZEN' | 'MODERATOR' | 'ADMIN';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface Category {
  slug: string;
  name: string;
  nameEn?: string;
  description?: string | null;
}

export interface MediaItem {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  mimeType?: string;
  url?: string;
  width?: number | null;
  height?: number | null;
  exifTakenAt?: string | null;
}

export interface Report {
  id: string;
  status: ReportStatus;
  description: string;
  summary?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  anonymous: boolean;
  reviewerNote?: string | null;
  createdAt: string;
  category?: Category;
  media?: MediaItem[];
  reporter?: { id: string; email: string; displayName: string | null } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Status display labels are localized via i18n (`t.status[...]`).

export const STATUS_COLORS: Record<ReportStatus, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  INFO_REQUESTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CLOSED: 'bg-slate-200 text-slate-600',
};