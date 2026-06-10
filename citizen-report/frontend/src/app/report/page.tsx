'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ConsentNotice, CONSENT_TEXT } from '@/components/ConsentNotice';
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
      .catch(() => setError('კატეგორიების ჩატვირთვა ვერ მოხერხდა. API მუშაობს?'));
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
      setError(err instanceof ApiError ? err.message : 'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h1 className="mb-2 text-xl font-bold">განაცხადი წარმატებით გაიგზავნა</h1>
          <p className="text-slate-600">{done}</p>
          <p className="mt-2 text-sm text-slate-500">
            უფლებამოსილი თანამდებობის პირები განიხილავენ შენს მტკიცებულებას. გმადლობთ, რომ ზრუნავ შენს თემზე.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">განაცხადის შეტანა</h1>
      <p className="mb-6 text-sm text-slate-600">
        ატვირთე ფოტო მტკიცებულება საჯარო სამართალდარღვევის შესახებ. განაცხადს 
        უფლებამოსილი თანამდებობის პირები განიხილავენ — ჯარიმა ავტომატურად არ გაიცემა.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* მტკიცებულება */}
        <section className="card space-y-3">
          <h2 className="font-semibold">1. მტკიცებულება</h2>
          <PhotoUpload files={files} onChange={setFiles} onGps={(g) => setLocation(g)} />
        </section>

        {/* კატეგორია და აღწერა */}
        <section className="card space-y-4">
          <h2 className="font-semibold">2. დეტალები</h2>
          <div>
            <label className="label" htmlFor="category">კატეგორია</label>
            <select
              id="category"
              className="input"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="desc">აღწერა</label>
            <textarea
              id="desc"
              className="input min-h-28"
              placeholder="აღწერე რა დაინახე (მინიმუმ 10 სიმბოლო)…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="when">როდის მოხდა? (სურვილისამებრ)</label>
            <input
              id="when"
              type="datetime-local"
              className="input"
              value={incidentAt}
              onChange={(e) => setIncidentAt(e.target.value)}
            />
          </div>
        </section>

        {/* ადგილმდებარეობა */}
        <section className="card space-y-3">
          <h2 className="font-semibold">3. ადგილმდებარეობა</h2>
          <p className="text-xs text-slate-500">
            დააჭირე რუკაზე ადგილმდებარეობის მოსანიშნად. თუ ფოტოში GPS მონაცემებია, 
            ადგილმდებარეობა ავტომატურად განისაზღვრება.
          </p>
          <MapPicker value={location} onChange={setLocation} />
          {location && (
            <p className="text-xs text-slate-500">
              არჩეული: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
          <input
            className="input"
            placeholder="მისამართი ან ორიენტირი (სურვილისამებრ)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        {/* გამგზავნის ვინაობა */}
        <section className="card space-y-3">
          <h2 className="font-semibold">4. შენი განაცხადი</h2>
          {user ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              ანონიმურად გაგზავნა (განაცხადი არ დაუკავშირდება ჩემს ანგარიშს)
            </label>
          ) : (
            <p className="text-sm text-slate-600">
              განაცხადი ანონიმურად იგზავნება. სურვილისამებრ მიუთითე საკონტაქტო ინფორმაცია, 
              რათა თანამდებობის პირებმა შეძლონ დაგიკავშირდნენ.
            </p>
          )}
          {(anonymous || !user) && (
            <input
              className="input"
              placeholder="საკონტაქტო ელ-ფოსტა ან ტელეფონი (სურვილისამებრ, დაშიფრული)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          )}
        </section>

        {/* თანხმობა */}
        <ConsentNotice checked={consent} onChange={setConsent} />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={!canSubmit}>
          {submitting ? 'იგზავნება…' : 'განაცხადის გაგზავნა'}
        </button>
      </form>
    </div>
  );
}