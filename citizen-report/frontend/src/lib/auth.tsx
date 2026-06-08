'use client';

/**
 * Auth context. On mount it attempts a silent refresh (using the httpOnly
 * cookie) to restore the session, then exposes login/logout/register helpers.
 */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiFetch, setAccessToken } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string, captchaToken?: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { user } = await apiFetch<{ user: User }>('/users/me');
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  // Restore session on first load via silent refresh.
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ accessToken: string; user: User }>('/auth/refresh', {
          method: 'POST',
          retry: false,
        });
        setAccessToken(res.accessToken);
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string, captchaToken?: string) => {
      return apiFetch<{ message: string }>('/auth/register', {
        method: 'POST',
        body: { email, password, displayName, captchaToken },
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', retry: false });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
