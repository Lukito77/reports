import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Citizen Report',
  description:
    'Report potential public infractions with photo evidence. Reviewed by authorized officials — no automatic fines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
              Citizen Report assists investigations — it does not issue fines or determine guilt.
              All enforcement decisions are made by authorized officials.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
