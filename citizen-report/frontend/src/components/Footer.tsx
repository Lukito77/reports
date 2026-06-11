'use client';

import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
        {t.footer.disclaimer}
      </div>
    </footer>
  );
}