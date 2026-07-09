import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'რეგისტრაცია',
  description:
    'შექმენით ანგარიში მოქალაქის შეტყობინების პლატფორმაზე, რომ თვალი ადევნოთ თქვენს განაცხადებს. Create an account to track your reports.',
  alternates: { canonical: '/register' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
