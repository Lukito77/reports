import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'პაროლის აღდგენა',
  description:
    'დაგავიწყდათ პაროლი? მიუთითეთ თქვენი ელფოსტა და მიიღეთ პაროლის აღდგენის ბმული მოქალაქის შეტყობინების პლატფორმაზე. Reset your password.',
  alternates: { canonical: '/forgot-password' },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
