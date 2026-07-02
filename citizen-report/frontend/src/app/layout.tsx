import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/settings';
import { SiteFrame } from '@/components/SiteFrame';

export const metadata: Metadata = {
  title: 'Citizen Report',
  description:
    'Report potential public infractions with photo evidence. Reviewed by authorized officials — no automatic fines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>
        <SettingsProvider>
          <I18nProvider>
            <AuthProvider>
              <SiteFrame>{children}</SiteFrame>
            </AuthProvider>
          </I18nProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
