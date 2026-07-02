'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getRememberedEmails, forgetEmail } from '@/lib/rememberedEmails';

/**
 * Renders a <datalist id="known-emails"> (for native typing autocomplete) plus
 * a row of clickable chips of previously-used emails. Click a chip to fill the
 * field; click its × to forget that email. Renders nothing until an email has
 * been remembered. Load happens on mount to avoid SSR hydration mismatch.
 */
export function RememberedEmails({ onPick }: { onPick: (email: string) => void }) {
  const [emails, setEmails] = useState<string[]>([]);

  useEffect(() => {
    setEmails(getRememberedEmails());
  }, []);

  return (
    <>
      <datalist id="known-emails">
        {emails.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      {emails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {emails.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-1 text-xs text-slate-600"
            >
              <button
                type="button"
                onClick={() => onPick(e)}
                className="max-w-[180px] truncate hover:text-brand-600"
                title={e}
              >
                {e}
              </button>
              <button
                type="button"
                aria-label={`Forget ${e}`}
                onClick={() => setEmails(forgetEmail(e))}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
