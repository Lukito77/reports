'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Doc = Record<string, unknown>;

interface ListResponse {
  items: Doc[];
  total: number;
  page: number;
  pageSize: number;
  readOnly: boolean;
}

interface EditorState {
  mode: 'create' | 'edit';
  id?: string;
  json: string;
}

const PAGE_SIZE = 25;

function cellValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function CollectionDetailPage() {
  const params = useParams<{ name: string }>();
  const name = params.name;
  const { lang } = useI18n();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);

  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) qs.set('q', q);
    try {
      setData(await apiFetch<ListResponse>(`/admin/collections/${name}?${qs.toString()}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    }
  }, [name, page, q]);

  useEffect(() => {
    load();
  }, [load]);

  // Column set: id first, then the union of keys across the page (capped).
  const columns = useMemo(() => {
    if (!data) return [];
    const keys = new Set<string>();
    for (const item of data.items) for (const k of Object.keys(item)) keys.add(k);
    keys.delete('id');
    return ['id', ...[...keys].slice(0, 6)];
  }, [data]);

  function openCreate() {
    setEditorError(null);
    setEditor({ mode: 'create', json: '{\n  \n}' });
  }
  function openEdit(doc: Doc) {
    setEditorError(null);
    const { id, ...rest } = doc;
    void id;
    setEditor({ mode: 'edit', id: String(doc.id), json: JSON.stringify(rest, null, 2) });
  }

  async function saveEditor() {
    if (!editor) return;
    let body: unknown;
    try {
      body = JSON.parse(editor.json);
    } catch {
      setEditorError(tr('არასწორი JSON', 'Invalid JSON'));
      return;
    }
    setSaving(true);
    setEditorError(null);
    try {
      if (editor.mode === 'create') {
        await apiFetch(`/admin/collections/${name}`, { method: 'POST', body });
      } else {
        await apiFetch(`/admin/collections/${name}/${editor.id}`, { method: 'PATCH', body });
      }
      setEditor(null);
      await load();
    } catch (err) {
      setEditorError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(doc: Doc) {
    if (!window.confirm(tr('წავშალო ეს ჩანაწერი?', 'Delete this document?'))) return;
    try {
      await apiFetch(`/admin/collections/${name}/${doc.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const readOnly = data?.readOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/admin/collections" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{name}</h1>
          {readOnly && (
            <span className="badge bg-slate-100 text-slate-500">{tr('მხოლოდ კითხვა', 'Read-only')}</span>
          )}
        </div>
        {!readOnly && (
          <button className="btn-primary" onClick={openCreate}>
            {tr('+ ახალი ჩანაწერი', '+ New document')}
          </button>
        )}
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">{tr('ძიება', 'Search')}</label>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
          />
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          {tr('ძიება', 'Search')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((doc, i) => (
              <tr key={String(doc.id) || i} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c} className="max-w-[220px] truncate px-3 py-2" title={cellValue(doc[c])}>
                    {cellValue(doc[c])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <button
                    className="rounded px-2 py-1 text-xs text-brand-700 hover:bg-brand-50"
                    onClick={() => openEdit(doc)}
                  >
                    {readOnly ? tr('ნახვა', 'View') : tr('რედაქტ.', 'Edit')}
                  </button>
                  {!readOnly && (
                    <button
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => remove(doc)}
                    >
                      {tr('წაშლა', 'Delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-slate-500">{tr('ჩანაწერები არ არის.', 'No documents.')}</p>
        )}
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {tr('სულ', 'Total')}: {data.total}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary px-3 py-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                className="btn-secondary px-3 py-1"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* JSON editor modal */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="card my-8 w-full max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editor.mode === 'create'
                  ? tr('ახალი ჩანაწერი', 'New document')
                  : readOnly
                    ? tr('ჩანაწერი', 'Document')
                    : tr('რედაქტირება', 'Edit document')}
              </h2>
              <button className="text-slate-400 hover:text-slate-700" onClick={() => setEditor(null)}>
                ✕
              </button>
            </div>
            <textarea
              className="input min-h-[360px] font-mono text-xs"
              value={editor.json}
              readOnly={readOnly}
              onChange={(e) => setEditor({ ...editor, json: e.target.value })}
              spellCheck={false}
            />
            {editorError && <p className="text-sm text-red-600">{editorError}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEditor(null)}>
                {tr('დახურვა', 'Close')}
              </button>
              {!readOnly && (
                <button className="btn-primary" onClick={saveEditor} disabled={saving}>
                  {saving ? tr('ინახება…', 'Saving…') : tr('შენახვა', 'Save')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
