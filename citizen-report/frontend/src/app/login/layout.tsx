import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'შესვლა',
  description:
    'შედით მოქალაქის შეტყობინების პლატფორმაზე, რომ თვალი ადევნოთ თქვენს განაცხადებს. Sign in to track your reports.',
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
