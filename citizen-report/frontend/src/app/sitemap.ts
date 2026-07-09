import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportebi.vercel.app';

// Public, indexable routes only (auth-gated /admin & /dashboard are excluded).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/report', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/register', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/forgot-password', priority: 0.3, changeFrequency: 'yearly' },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
