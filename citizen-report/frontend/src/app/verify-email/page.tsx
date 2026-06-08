'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token.');
      return;
    }
    apiFetch<{ message: string }>('/auth/verify-email', { method: 'POST', body: { token } })
      .then((r) => {
        setState('ok');
        setMessage(r.message);
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <div className="mb-3 text-4xl">{state === 'ok' ? '✅' : state === 'error' ? '⚠️' : '⏳'}</div>
        <h1 className="mb-2 text-xl font-bold">
          {state === 'pending' ? 'Verifying…' : state === 'ok' ? 'Email verified' : 'Verification problem'}
        </h1>
        <p className="text-sm text-slate-600">{message}</p>
        {state === 'ok' && <Link href="/login" className="btn-primary mt-4">Sign in</Link>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-500">Loading…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
