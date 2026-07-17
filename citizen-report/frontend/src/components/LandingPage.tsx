import Link from 'next/link';

/**
 * Server-rendered SEO landing page shell. Each keyword landing route passes
 * unique Georgian copy; the layout, CTAs, internal links and structured data
 * (BreadcrumbList + FAQPage) are shared so every page is crawlable, non-thin,
 * and consistent with the site design.
 */

export interface LandingSection {
  heading: string;
  body: string;
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface RelatedLink {
  href: string;
  label: string;
}

export interface LandingPageProps {
  /** Canonical path of this page, e.g. "/jarimebi". */
  path: string;
  /** Visible H1 (primary keyword). */
  h1: string;
  /** Lead paragraph under the H1. */
  lead: string;
  /** Body sections (each an H2 + paragraph). */
  sections: LandingSection[];
  /** FAQ pairs — rendered visibly and mirrored into FAQPage JSON-LD. */
  faq: LandingFaq[];
  /** Internal links to sibling landing pages. */
  related: RelatedLink[];
  /** Short English summary for English-language keywords. */
  englishSummary: string;
  /** Breadcrumb label for this page. */
  breadcrumb: string;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://reportebi.vercel.app';

export function LandingPage({
  path,
  h1,
  lead,
  sections,
  faq,
  related,
  englishSummary,
  breadcrumb,
}: LandingPageProps) {
  const url = `${SITE_URL}${path}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: breadcrumb, item: url },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="space-y-14">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">
          მთავარი
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{breadcrumb}</span>
      </nav>

      {/* Hero */}
      <section className="space-y-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {h1}
        </h1>
        <p className="max-w-3xl text-lg text-slate-600">{lead}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/report" className="btn-primary px-6 py-3 text-base">
            შეატყობინეთ ახლა
          </Link>
          <Link href="/register" className="btn-secondary px-6 py-3 text-base">
            ანგარიშის შექმნა
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          შეტყობინება შესაძლებელია ანონიმურადაც — რეგისტრაცია სავალდებულო არ არის.
        </p>
      </section>

      {/* Body sections */}
      <section className="space-y-8">
        {sections.map((s) => (
          <div key={s.heading} className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{s.heading}</h2>
            <p className="max-w-3xl leading-relaxed text-slate-600">{s.body}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">ხშირად დასმული კითხვები</h2>
        <div className="max-w-3xl space-y-3">
          {faq.map((item) => (
            <details key={item.q} className="card">
              <summary className="cursor-pointer list-none font-semibold text-slate-800">
                {item.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related internal links */}
      <section className="rounded-xl bg-brand-50 p-8">
        <h2 className="mb-4 text-lg font-bold text-brand-700">დაკავშირებული თემები</h2>
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          {related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="text-brand-600 hover:underline">
                → {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* English summary for English-language search terms */}
      <section className="border-t border-slate-200 pt-6">
        <p className="max-w-3xl text-sm leading-relaxed text-slate-500">{englishSummary}</p>
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </div>
  );
}
