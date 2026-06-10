import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Citizen Report',
  description:
    'Report potential public infractions with photo evidence. Reviewed by authorized officials — no automatic fines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>
        <I18nProvider>
          <AuthProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
            <footer className="border-t border-slate-200 bg-white">
              <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
                Citizen Report ეხმარება გამოძიებას — ის არ გასცემს ჯარიმებს და არ განსაზღვრავს დანაშაულს. ყველა გადაწყვეტილებას იღებენ უფლებამოსილი პირები.
              </div>
            </footer>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}