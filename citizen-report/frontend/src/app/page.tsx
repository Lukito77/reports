'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t.home.title}
          </h1>
          <p className="text-lg text-slate-600">{t.home.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/report" className="btn-primary px-6 py-3 text-base">
              {t.home.reportBtn}
            </Link>
            <Link href="/register" className="btn-secondary px-6 py-3 text-base">
              {t.home.createAccount}
            </Link>
          </div>
          <p className="text-sm text-slate-500">{t.home.anonymous}</p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t.home.whatYouCanReport}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {t.home.categories.map((c) => (
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
        <h2 className="mb-6 text-center text-2xl font-bold">{t.home.howItWorks}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: '1', title: t.home.step1Title, desc: t.home.step1Desc },
            { n: '2', title: t.home.step2Title, desc: t.home.step2Desc },
            { n: '3', title: t.home.step3Title, desc: t.home.step3Desc },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / legal */}
      <section className="rounded-xl bg-brand-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-brand-700">{t.home.trustTitle}</h2>
        <ul className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li>{t.home.trust1}</li>
          <li>{t.home.trust2}</li>
          <li>{t.home.trust3}</li>
          <li>{t.home.trust4}</li>
        </ul>
      </section>
    </div>
  );
}