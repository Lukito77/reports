'use client';

import { ReactNode } from 'react';
import { useSettings } from '@/lib/settings';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const CONTAINER_WIDTH: Record<string, string> = {
  narrow: 'max-w-3xl',
  normal: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * Public-site chrome: navbar + main container + footer, sized and toggled by the
 * configured layout settings.
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const widthClass = CONTAINER_WIDTH[settings.layout.containerWidth] ?? CONTAINER_WIDTH.normal;

  return (
    <>
      <Navbar />
      <main className={`mx-auto w-full px-4 py-8 ${widthClass}`}>{children}</main>
      {settings.layout.showFooter && <Footer />}
    </>
  );
}
