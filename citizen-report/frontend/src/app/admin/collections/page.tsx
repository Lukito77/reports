'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Lock } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { CollectionMeta } from '@/lib/types';

export default function CollectionsPage() {
  const { lang } = useI18n();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ collections: CollectionMeta[] }>('/admin/collections')
      .then((d) => setCollections(d.collections))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tr('მონაცემთა ბაზა', 'Database collections')}</h1>
      <p className="text-sm text-slate-500">
        {tr(
          'ნებისმიერი კოლექციის ჩანაწერების დათვალიერება, შექმნა, რედაქტირება და წაშლა.',
          'Browse, create, edit, and delete documents in any collection.',
        )}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.name}
            href={`/admin/collections/${c.name}`}
            className="card flex items-center gap-3 transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{c.label}</div>
              <code className="text-xs text-slate-400">{c.name}</code>
            </div>
            {c.readOnly && <Lock className="h-4 w-4 text-slate-400" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
