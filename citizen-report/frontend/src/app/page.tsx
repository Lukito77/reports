import Link from 'next/link';

const CATEGORIES = [
  { icon: '🅿️', label: 'Illegal parking' },
  { icon: '🚧', label: 'Blocked sidewalk' },
  { icon: '🚗', label: 'Abandoned vehicle' },
  { icon: '🗑️', label: 'Littering' },
  { icon: '🎨', label: 'Vandalism' },
  { icon: '♻️', label: 'Illegal dumping' },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Help keep your city safe and orderly
          </h1>
          <p className="text-lg text-slate-600">
            Spotted illegal parking, a blocked sidewalk, or littering? Submit photo evidence
            in minutes. Authorized officials review every report — fairly and transparently.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/report" className="btn-primary px-6 py-3 text-base">
              Report an issue
            </Link>
            <Link href="/register" className="btn-secondary px-6 py-3 text-base">
              Create an account
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            You can report anonymously — no account required.
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            What you can report
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-medium text-slate-700">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: '1', t: 'Capture evidence', d: 'Upload photos (and optional video). We read the location from your photo when available.' },
            { n: '2', t: 'Add details', d: 'Pick the location on a map, choose a category, and describe what you saw.' },
            { n: '3', t: 'Official review', d: 'Authorized officials review the evidence and decide on appropriate action. You can track the status.' },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mb-1 font-semibold">{s.t}</h3>
              <p className="text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / legal */}
      <section className="rounded-xl bg-brand-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-brand-700">Fair, lawful, and private by design</h2>
        <ul className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li>✅ No automatic fines — only authorized officials decide on enforcement.</li>
          <li>✅ Faces are automatically blurred to protect bystander privacy.</li>
          <li>✅ Your data is encrypted and stored securely (GDPR-style controls).</li>
          <li>✅ Every administrative action is recorded in an audit log.</li>
        </ul>
      </section>
    </div>
  );
}
