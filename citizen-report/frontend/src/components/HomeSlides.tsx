'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const SLIDE_COUNT = 6;
const THEME_STORAGE_KEY = 'home_deck_theme';
type DeckTheme = 'light' | 'dark';

/**
 * Homepage as a "PowerPoint in scroll" deck: six full-viewport, scroll-snapped
 * slides inside an internal scroll container (so the shared Navbar/Footer stay
 * in normal page flow above/below it). A fixed dot-nav + counter overlay and an
 * IntersectionObserver-driven `.is-active` class (which triggers the `.reveal`
 * animations in globals.css) recreate a slide-advance feel without hijacking
 * native scroll/accessibility behavior.
 */
export function HomeSlides() {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  // Light is the default on first visit; a returning visitor's choice (if any)
  // is restored from localStorage after mount.
  const [theme, setTheme] = useState<DeckTheme>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: DeckTheme = prev === 'light' ? 'dark' : 'light';
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = slideRefs.current.findIndex((el) => el === entry.target);
          if (index === -1) return;
          entry.target.classList.toggle('is-active', entry.isIntersecting);
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) setActive(index);
        });
      },
      { root, threshold: [0, 0.5] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const root = scrollRef.current;
      if (!root) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(Math.min(active + 1, SLIDE_COUNT - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(Math.max(active - 1, 0));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function goTo(index: number) {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.home.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="home-deck" data-theme={theme}>
      <button
        type="button"
        className="home-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        title={theme === 'light' ? 'Dark mode' : 'Light mode'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div ref={scrollRef} className="deck-scroll">
        {/* 1. Hero */}
        <section
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="bulletin-seal" />
          <div className="slide-inner">
            <h1 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.title}
            </h1>
            <p className="slide-lead reveal" style={{ transitionDelay: '220ms' }}>
              {t.home.subtitle}
            </p>
            <div className="cta-row reveal" style={{ transitionDelay: '320ms' }}>
              <Link href="/report" className="btn-ink btn-ink-primary">
                {t.home.reportBtn}
              </Link>
              <Link href="/register" className="btn-ink btn-ink-secondary">
                {t.home.createAccount}
              </Link>
            </div>
            <p className="slide-note reveal" style={{ transitionDelay: '400ms' }}>
              {t.home.anonymous}
            </p>
          </div>
        </section>

        {/* 2. What you can report */}
        <section
          ref={(el) => {
            slideRefs.current[1] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="slide-inner">
            <h2 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.whatYouCanReport}
            </h2>
            <div className="ledger-grid reveal" style={{ transitionDelay: '220ms' }}>
              {t.home.categories.map((c, i) => (
                <div key={c.label} className="ledger-item">
                  <span className="icon">{c.icon}</span>
                  <div>
                    <div className="label">{c.label}</div>
                    <div className="num">№ {String(i + 1).padStart(3, '0')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How it works */}
        <section
          ref={(el) => {
            slideRefs.current[2] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="slide-inner">
            <h2 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.howItWorks}
            </h2>
            <div className="case-steps reveal" style={{ transitionDelay: '220ms' }}>
              {[
                { n: '01', title: t.home.step1Title, desc: t.home.step1Desc },
                { n: '02', title: t.home.step2Title, desc: t.home.step2Desc },
                { n: '03', title: t.home.step3Title, desc: t.home.step3Desc },
              ].map((s) => (
                <div key={s.n} className="case-step">
                  <span className="n">{s.n}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Trust */}
        <section
          ref={(el) => {
            slideRefs.current[3] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="slide-inner">
            <h2 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.trustTitle}
            </h2>
            <div className="certificate reveal" style={{ transitionDelay: '220ms' }}>
              <p className="point">{t.home.trust1}</p>
              <p className="point">{t.home.trust2}</p>
              <p className="point">{t.home.trust3}</p>
              <p className="point">{t.home.trust4}</p>
            </div>
          </div>
        </section>

        {/* 5. FAQ */}
        <section
          ref={(el) => {
            slideRefs.current[4] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="slide-inner">
            <h2 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.faqTitle}
            </h2>
            <div className="dossier reveal" style={{ transitionDelay: '220ms' }}>
              {t.home.faq.map((item, i) => (
                <details key={item.q} className="dossier-item">
                  <summary>
                    <span className="qnum">Q{String(i + 1).padStart(2, '0')}</span>
                    {item.q}
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Closing CTA */}
        <section
          ref={(el) => {
            slideRefs.current[5] = el;
          }}
          className="slide"
        >
          <div className="bulletin-grid" />
          <div className="bulletin-seal" />
          <div className="slide-inner">
            <h2 className="slide-heading reveal" style={{ transitionDelay: '120ms' }}>
              {t.home.closingTitle}
            </h2>
            <p className="slide-lead reveal" style={{ transitionDelay: '220ms' }}>
              {t.home.closingSubtitle}
            </p>
            <div className="cta-row reveal" style={{ transitionDelay: '320ms' }}>
              <Link href="/report" className="btn-ink btn-ink-primary">
                {t.home.reportBtn}
              </Link>
              <Link href="/register" className="btn-ink btn-ink-secondary">
                {t.home.createAccount}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="home-deck-nav" role="tablist" aria-label="Slides">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === active ? 'is-active' : ''}
            aria-label={`Slide ${i + 1}`}
            aria-selected={i === active}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
      <div className="home-deck-counter">
        {String(active + 1).padStart(2, '0')} <b>/</b> {String(SLIDE_COUNT).padStart(2, '0')}
      </div>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500&family=Noto+Serif+Georgian:wght@500;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </div>
  );
}
