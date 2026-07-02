'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { ContentRow, ContentType } from '@/lib/types';

const emptyDraft = {
  key: '',
  group: 'home',
  label: '',
  type: 'text' as ContentType,
  valueKa: '',
  valueEn: '',
};

export default function ContentPage() {
  const { lang, refreshContent } = useI18n();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);

  const [rows, setRows] = useState<ContentRow[]>([]);
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  async function load() {
    try {
      const { items } = await apiFetch<{ items: ContentRow[] }>('/admin/content');
      setRows(items);
      setOriginals(Object.fromEntries(items.map((i) => [i.id, JSON.stringify(i)])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ContentRow[]>();
    for (const r of rows) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    return [...map.entries()];
  }, [rows]);

  const isDirty = (row: ContentRow) => originals[row.id] !== JSON.stringify(row);

  const update = (id: string, patch: Partial<ContentRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function saveRow(row: ContentRow) {
    setSavingId(row.id);
    setError(null);
    try {
      await apiFetch(`/admin/content/${row.id}`, {
        method: 'PATCH',
        body: {
          label: row.label,
          group: row.group,
          type: row.type,
          valueKa: row.valueKa,
          valueEn: row.valueEn,
          order: row.order,
        },
      });
      setOriginals((o) => ({ ...o, [row.id]: JSON.stringify(row) }));
      await refreshContent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  }

  async function remove(row: ContentRow) {
    if (!window.confirm(tr('წავშალო ეს ჩანაწერი?', 'Delete this content entry?'))) return;
    try {
      await apiFetch(`/admin/content/${row.id}`, { method: 'DELETE' });
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      await refreshContent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  async function createRow() {
    setError(null);
    try {
      const { content } = await apiFetch<{ content: ContentRow }>('/admin/content', {
        method: 'POST',
        body: draft,
      });
      setRows((rs) => [...rs, content]);
      setOriginals((o) => ({ ...o, [content.id]: JSON.stringify(content) }));
      setDraft(emptyDraft);
      setShowNew(false);
      await refreshContent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr('კონტენტის მართვა', 'Content management')}</h1>
        <button className="btn-secondary" onClick={() => setShowNew((s) => !s)}>
          {showNew ? tr('დახურვა', 'Close') : tr('+ ახალი ჩანაწერი', '+ New entry')}
        </button>
      </div>
      <p className="text-sm text-slate-500">
        {tr(
          'შეცვალეთ საიტის ნებისმიერი ტექსტი — header, footer, მთავარი გვერდი და სხვა. ცვლილებები მაშინვე აისახება.',
          'Edit any text on the site — header, footer, home page, and more. Changes apply immediately.',
        )}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showNew && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{tr('ახალი ჩანაწერი', 'New entry')}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">{tr('გასაღები (key)', 'Key')}</label>
              <input
                className="input font-mono text-xs"
                placeholder="home.customLine"
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{tr('ჯგუფი', 'Group')}</label>
              <input
                className="input"
                value={draft.group}
                onChange={(e) => setDraft({ ...draft, group: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{tr('ტიპი', 'Type')}</label>
              <select
                className="input"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as ContentType })}
              >
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="html">html</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{tr('აღწერა', 'Label')}</label>
            <input
              className="input"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">🇬🇪 KA</label>
              <textarea
                className="input min-h-16"
                value={draft.valueKa}
                onChange={(e) => setDraft({ ...draft, valueKa: e.target.value })}
              />
            </div>
            <div>
              <label className="label">🇬🇧 EN</label>
              <textarea
                className="input min-h-16"
                value={draft.valueEn}
                onChange={(e) => setDraft({ ...draft, valueEn: e.target.value })}
              />
            </div>
          </div>
          <button className="btn-primary" onClick={createRow} disabled={!draft.key || !draft.group}>
            {tr('შექმნა', 'Create')}
          </button>
        </div>
      )}

      {groups.map(([group, items]) => (
        <div key={group} className="card space-y-4">
          <h2 className="text-lg font-semibold capitalize">{group}</h2>
          {items.map((row) => {
            const dirty = isDirty(row);
            const multiline = row.type !== 'text';
            return (
              <div key={row.id} className="space-y-2 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">{row.label || row.key}</span>
                    <code className="ml-2 text-[11px] text-slate-400">{row.key}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    {dirty && <span className="text-xs text-amber-600">●</span>}
                    <button
                      className="btn-primary px-3 py-1 text-xs"
                      onClick={() => saveRow(row)}
                      disabled={!dirty || savingId === row.id}
                    >
                      {savingId === row.id ? tr('ინახება…', 'Saving…') : tr('შენახვა', 'Save')}
                    </button>
                    <button
                      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => remove(row)}
                    >
                      {tr('წაშლა', 'Delete')}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label text-xs">🇬🇪 KA</label>
                    {multiline ? (
                      <textarea
                        className="input min-h-16 text-sm"
                        value={row.valueKa}
                        onChange={(e) => update(row.id, { valueKa: e.target.value })}
                      />
                    ) : (
                      <input
                        className="input text-sm"
                        value={row.valueKa}
                        onChange={(e) => update(row.id, { valueKa: e.target.value })}
                      />
                    )}
                  </div>
                  <div>
                    <label className="label text-xs">🇬🇧 EN</label>
                    {multiline ? (
                      <textarea
                        className="input min-h-16 text-sm"
                        value={row.valueEn}
                        onChange={(e) => update(row.id, { valueEn: e.target.value })}
                      />
                    ) : (
                      <input
                        className="input text-sm"
                        value={row.valueEn}
                        onChange={(e) => update(row.id, { valueEn: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {rows.length === 0 && !error && (
        <p className="text-center text-slate-500">{tr('ჩანაწერები არ მოიძებნა.', 'No content entries found.')}</p>
      )}
    </div>
  );
}
