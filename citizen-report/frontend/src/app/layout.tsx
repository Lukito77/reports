import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/settings';
import { SiteFrame } from '@/components/SiteFrame';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://citizen-report-frontend.vercel.app';

// Bilingual (Georgian-first) description + keyword set for search engines.
const DESCRIPTION_KA =
  'მოქალაქის შეტყობინების ონლაინ პლატფორმა — გააკეთეთ განცხადება საქალაქო პრობლემებზე: მანქანის ჯარიმები, უკანონო პარკირება, ვანდალიზმი, დანაგვიანებული ბუნება და სხვა აკრძალული ქმედებები. ფოტო-მტკიცებულებას განიხილავენ უფლებამოსილი პირები — ავტომატური ჯარიმების გარეშე.';
const DESCRIPTION_EN =
  'Citizen reporting platform for public infractions — illegal parking, car fines, vandalism, littering and other prohibited acts. Submit photo evidence reviewed by authorized officials.';

const KEYWORDS = [
  // Georgian — primary keywords
  'მოქალაქის შეტყობინება',
  'ხალხის წუხილი',
  'განცხადების გაკეთება',
  'მერიის განცხადება',
  'ჯარიმები',
  'მანქანის ჯარიმები',
  'აკრძალული საქმე',
  'ვანდალიზმი',
  'დანაგვიანებული ბუნება',
  // Georgian — related
  'ქალაქის პრობლემები',
  'უკანონო პარკირება',
  'პარკირების ჯარიმა',
  'ნაგვის დაყრა',
  'გარემოს დაბინძურება',
  'საჩივრის შეტანა',
  'ონლაინ განაცხადი',
  'მოქალაქეთა ჩართულობა',
  'მუნიციპალიტეტი',
  'მერია',
  'ფოტო მტკიცებულება',
  'ინფრასტრუქტურის პრობლემა',
  'თბილისი',
  'საქართველო',
  // English — related
  'citizen report',
  'report a problem',
  'report an issue',
  'municipal complaint',
  'city hall report',
  'fines',
  'car fines',
  'parking fines',
  'illegal parking',
  'vandalism',
  'littering',
  'environmental pollution',
  'public infractions',
  'prohibited acts',
  'community reporting',
  'municipality',
  'Tbilisi',
  'Georgia',
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'მოქალაქის შეტყობინება — საქალაქო პრობლემების ონლაინ განაცხადი | Citizen Report',
    template: '%s | მოქალაქის შეტყობინება',
  },
  description: `${DESCRIPTION_KA} ${DESCRIPTION_EN}`,
  keywords: KEYWORDS,
  applicationName: 'მოქალაქის შეტყობინება · Citizen Report',
  alternates: {
    canonical: '/',
    languages: { ka: '/', en: '/', 'x-default': '/' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'მოქალაქის შეტყობინება · Citizen Report',
    title: 'მოქალაქის შეტყობინება — საქალაქო პრობლემების ონლაინ განაცხადი',
    description: DESCRIPTION_KA,
    locale: 'ka_GE',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'მოქალაქის შეტყობინება · Citizen Report',
    description: DESCRIPTION_KA,
  },
};

// Structured data (JSON-LD) so search engines understand the service.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'მოქალაქის შეტყობინება · Citizen Report',
      description: DESCRIPTION_KA,
      inLanguage: ['ka', 'en'],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'მოქალაქის შეტყობინება · Citizen Report',
      url: SITE_URL,
      description: DESCRIPTION_EN,
      areaServed: 'GE',
    },
    {
      '@type': 'Service',
      name: 'მოქალაქის შეტყობინება',
      serviceType: 'საქალაქო პრობლემების შეტყობინება (ჯარიმები, ვანდალიზმი, დანაგვიანება)',
      areaServed: { '@type': 'Country', name: 'Georgia' },
      provider: { '@id': `${SITE_URL}/#organization` },
      description: DESCRIPTION_KA,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
