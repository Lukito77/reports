import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'გარემოს დაბინძურება და ნაგვის დაყრა — შეტყობინება ონლაინ',
  description:
    'დააფიქსირეთ გარემოს დაბინძურება: უკანონოდ დაყრილი ნაგავი, დანაგვიანებული ბუნება, სტიქიური ნაგავსაყრელი, დაბინძურებული მდინარე ან სკვერი — ფოტო-მტკიცებულებით. Report environmental pollution and littering in Georgia.',
  keywords: [
    'გარემოს დაბინძურება',
    'ნაგვის დაყრა',
    'დანაგვიანებული ბუნება',
    'უკანონო ნაგავსაყრელი',
    'ეკოლოგიური პრობლემა',
    'environmental pollution',
    'littering',
    'illegal dumping',
  ],
  alternates: { canonical: '/garemos-dabinzureba' },
};

export default function Page() {
  return (
    <LandingPage
      path="/garemos-dabinzureba"
      breadcrumb="გარემოს დაბინძურება"
      h1="გარემოს დაბინძურებისა და ნაგვის დაყრის შეტყობინება"
      lead="უკანონოდ დაყრილი ნაგავი, სტიქიური ნაგავსაყრელი, დაბინძურებული მდინარე თუ დანაგვიანებული სკვერი? დააფიქსირეთ გარემოს დაბინძურება რამდენიმე წუთში, ფოტო-მტკიცებულებით."
      sections={[
        {
          heading: 'რა ითვლება გარემოს დაბინძურებად',
          body: 'გარემოს დაბინძურება მოიცავს უკანონოდ დაყრილ ნაგავს, სტიქიურ ნაგავსაყრელს, სამშენებლო ან საყოფაცხოვრებო ნარჩენების მიტოვებას, მდინარისა და წყალსატევის დაბინძურებას, ასევე მწვანე ზონისა და სკვერების დანაგვიანებას. ეს აზიანებს ბუნებას და საზოგადოებრივ ჯანმრთელობას.',
        },
        {
          heading: 'როგორ დავაფიქსირო',
          body: 'გადაუღეთ ფოტო ისე, რომ ჩანდეს დაბინძურების მასშტაბი და მიმდებარე გარემო. მიუთითეთ ზუსტი ადგილმდებარეობა და მოკლედ აღწერეთ პრობლემა. შემდეგ გააგზავნეთ განცხადება — შესაძლებელია ანონიმურადაც.',
        },
        {
          heading: 'რა ხდება შემდეგ',
          body: 'თქვენს შეტყობინებას განიხილავს უფლებამოსილი პირი და მიიღებს გადაწყვეტილებას დასუფთავებაზე ან რეაგირებაზე. პლატფორმა თავად არ გასცემს ჯარიმას — ის უზრუნველყოფს მტკიცებულების გამჭვირვალე მიწოდებას პასუხისმგებელ ორგანომდე.',
        },
      ]}
      faq={[
        {
          q: 'რამდენ ფოტოს ავტვირთო?',
          a: 'შეგიძლიათ ატვირთოთ რამდენიმე ფოტო სხვადასხვა კუთხიდან — ეს აადვილებს დაბინძურების მასშტაბის დადასტურებას.',
        },
        {
          q: 'შემიძლია ვიდეოს ატვირთვა?',
          a: 'დიახ, შეგიძლიათ ატვირთოთ როგორც ფოტო, ისე ვიდეო მტკიცებულება.',
        },
        {
          q: 'აუცილებელია რეგისტრაცია?',
          a: 'არა, გარემოს დაბინძურების დაფიქსირება შესაძლებელია ანონიმურადაც.',
        },
      ]}
      related={[
        { href: '/vandalizmi', label: 'ვანდალიზმის შეტყობინება' },
        { href: '/mokalakis-shetkobineba', label: 'მოქალაქის შეტყობინება' },
        { href: '/ukanono-parkingi', label: 'უკანონო პარკირების შეტყობინება' },
        { href: '/jarimebi', label: 'მანქანის ჯარიმები და დარღვევები' },
      ]}
      englishSummary="Report environmental pollution and littering in Georgia — illegally dumped waste, unauthorized dump sites, polluted rivers, and littered parks or green zones. Upload photo or video evidence in minutes, anonymously if you prefer. Every report is reviewed by an authorized official; the platform itself does not issue fines."
    />
  );
}
