'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ConsentNotice, CONSENT_TEXT } from '@/components/ConsentNotice';
import { Confetti } from '@/components/Confetti';
import type { Category } from '@/lib/types';
import type { LatLng } from '@/components/MapPicker';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-slate-100" />,
});

const POLICY_VERSION = process.env.NEXT_PUBLIC_POLICY_VERSION || '1.0';

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, lang } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [incidentAt, setIncidentAt] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/reports/categories')
      .then((d) => {
        setCategories(d.categories);
        if (d.categories[0]) setCategorySlug(d.categories[0].slug);
      })
      .catch(() => setError(t.report.errorCategories));
  }, []);

  useEffect(() => {
    if (user) setAnonymous(false);
  }, [user]);

  const canSubmit = useMemo(
    () => categorySlug && description.trim().length >= 10 && files.length > 0 && consent && !submitting,
    [categorySlug, description, files, consent, submitting],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set('categorySlug', categorySlug);
      form.set('description', description);
      if (location) {
        form.set('latitude', String(location.lat));
        form.set('longitude', String(location.lng));
      }
      if (address) form.set('address', address);
      if (incidentAt) form.set('incidentAt', new Date(incidentAt).toISOString());
      form.set('anonymous', String(anonymous || !user));
      if (contact) form.set('contact', contact);
      form.set('consentGiven', 'true');
      form.set('consentText', CONSENT_TEXT);
      form.set('policyVersion', POLICY_VERSION);
      files.forEach((f) => form.append('media', f));

      const res = await apiFetch<{ message: string; report: { id: string } }>('/reports', {
        method: 'POST',
        body: form,
      });
      setDone(res.message);
      if (user) setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.report.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <Confetti />
        <div className="card text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h1 className="mb-2 text-xl font-bold">{t.report.successTitle}</h1>
          <p className="text-slate-600">{done}</p>
          <p className="mt-2 text-sm text-slate-500">{t.report.successMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">{t.report.title}</h1>
      <p className="mb-6 text-sm text-slate-600">{t.report.subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-3">
          <h2 className="font-semibold">{t.report.evidence}</h2>
          <PhotoUpload files={files} onChange={setFiles} onGps={(g) => setLocation(g)} />
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold">{t.report.details}</h2>
          <div>
            <label className="label" htmlFor="category">{t.report.category}</label>
            <select
              id="category"
              className="input"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {lang === 'en' && c.nameEn ? c.nameEn : c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="desc">{t.report.description}</label>
            <textarea
              id="desc"
              className="input min-h-28"
              placeholder={t.report.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="when">{t.report.when}</label>
            <input
              id="when"
              type="datetime-local"
              className="input"
              value={incidentAt}
              onChange={(e) => setIncidentAt(e.target.value)}
            />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">{t.report.location}</h2>
          <p className="text-xs text-slate-500">{t.report.locationHint}</p>
          <MapPicker value={location} onChange={setLocation} />
          {location && (
            <p className="text-xs text-slate-500">
              {t.report.selected}: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
          <input
            className="input"
            placeholder={t.report.addressPlaceholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">{t.report.yourReport}</h2>
          {user ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              {t.report.anonymousCheck}
            </label>
          ) : (
            <p className="text-sm text-slate-600">{t.report.anonymousHint}</p>
          )}
          {(anonymous || !user) && (
            <input
              className="input"
              placeholder={t.report.contactPlaceholder}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          )}
        </section>

        <ConsentNotice checked={consent} onChange={setConsent} />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={!canSubmit}>
          {submitting ? t.report.submitting : t.report.submitBtn}
        </button>
      </form>
    </div>
  );
}