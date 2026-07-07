import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'განაცხადის შეტანა — შეატყობინეთ ქალაქის პრობლემა',
  description:
    'გააკეთეთ განცხადება ქალაქის პრობლემაზე: უკანონო პარკირება, მანქანის ჯარიმები, ვანდალიზმი, დანაგვიანებული ბუნება და სხვა აკრძალული საქმე. ატვირთეთ ფოტო-მტკიცებულება — განიხილავს უფლებამოსილი პირი. Report a public issue with photo evidence.',
  alternates: { canonical: '/report' },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
