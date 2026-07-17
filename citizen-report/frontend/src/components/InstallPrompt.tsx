'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

const SHOW_DELAY_MS = 1000;
// Keep in sync with the `install-progress` keyframe duration in globals.css.
const VISIBLE_DURATION_MS = 10000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Sitewide "add to home screen" banner. Appears automatically near the top of
 * the screen shortly after every page open/reload and disappears on its own
 * after at most 10 seconds — no permanent "don't show again" memory, so it
 * shows again each time the site is (re)opened. It never blocks the page:
 * no backdrop, everything underneath stays clickable. Android/Chrome gets a
 * real native install prompt via `beforeinstallprompt`; iOS Safari has no
 * such API, so it gets instructions for the manual Share > Add to Home
 * Screen flow instead.
 */
export function InstallPrompt() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* installability is best-effort; ignore registration failures */
      });
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    function reveal(nextPlatform: 'android' | 'ios') {
      setPlatform(nextPlatform);
      setVisible(true);
      hideTimerRef.current = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
    }

    let showTimer: ReturnType<typeof setTimeout>;

    if (isIOS) {
      showTimer = setTimeout(() => reveal('ios'), SHOW_DELAY_MS);
      return () => {
        clearTimeout(showTimer);
        clearHideTimer();
      };
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      showTimer = setTimeout(() => reveal('android'), SHOW_DELAY_MS);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      clearTimeout(showTimer);
      clearHideTimer();
    };
  }, []);

  function dismiss() {
    clearHideTimer();
    setVisible(false);
  }

  async function install() {
    if (!deferredEvent) return;
    clearHideTimer();
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setVisible(false);
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:hidden">
      <div className="install-banner mx-auto max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-3 p-4">
          <span className="text-3xl">{settings.branding.logoEmoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{t.installApp.title}</p>
            <p className="text-xs text-slate-500">
              {platform === 'ios' ? t.installApp.iosSubtitle : t.installApp.androidSubtitle}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label={t.installApp.dismiss}
            className="shrink-0 self-start rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            ✕
          </button>
        </div>
        {platform === 'android' && (
          <div className="px-4 pb-4">
            <button onClick={install} className="btn-primary w-full py-2.5 text-sm">
              {t.installApp.installBtn}
            </button>
          </div>
        )}
        <div className="h-1 w-full bg-slate-100">
          <div className="install-progress h-full bg-brand-600" />
        </div>
      </div>
    </div>
  );
}
