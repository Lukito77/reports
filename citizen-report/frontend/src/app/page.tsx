import Link from 'next/link';

const CATEGORIES = [
  { icon: '🅿️', label: 'უკანონო პარკინგი' },
  { icon: '🚧', label: 'დაბლოკილი ტროტუარი' },
  { icon: '🚗', label: 'მიტოვებული მანქანა' },
  { icon: '🗑️', label: 'ნაგვის გადაყრა' },
  { icon: '🎨', label: 'ვანდალიზმი' },
  { icon: '♻️', label: 'უკანონო ნარჩენების გადაყრა' },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            დაეხმარე შენს ქალაქს გახდეს უსაფრთხო და კეთილმოწყობილი
          </h1>
          <p className="text-lg text-slate-600">
            შენიშნე უკანონო პარკინგი, დაბლოკილი ტროტუარი ან ნაგვის გადაყრა? 
            ატვირთე ფოტო მტკიცებულება რამდენიმე წუთში. უფლებამოსილი 
            თანამდებობის პირები განიხილავენ თითოეულ განაცხადს — 
            სამართლიანად და გამჭვირვალედ.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/report" className="btn-primary px-6 py-3 text-base">
              განაცხადის შეტანა
            </Link>
            <Link href="/register" className="btn-secondary px-6 py-3 text-base">
              ანგარიშის შექმნა
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            შეგიძლია ანონიმურად შეიტანო განაცხადი — ანგარიში საჭირო არ არის.
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            რისი შეტყობინება შეგიძლია
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-medium text-slate-700">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold">როგორ მუშაობს</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: '1', t: 'მტკიცებულების ატვირთვა', d: 'ატვირთე ფოტოები (და სურვილისამებრ ვიდეო). ადგილმდებარეობა ფოტოდან ავტომატურად განისაზღვრება, თუ ეს შესაძლებელია.' },
            { n: '2', t: 'დეტალების შევსება', d: 'მონიშნე ადგილი რუკაზე, აირჩიე კატეგორია და აღწერე რა დაინახე.' },
            { n: '3', t: 'ოფიციალური განხილვა', d: 'უფლებამოსილი თანამდებობის პირები განიხილავენ მტკიცებულებას და იღებენ შესაბამის გადაწყვეტილებას. შეგიძლია განაცხადის სტატუსი თვალყური ადევნო.' },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mb-1 font-semibold">{s.t}</h3>
              <p className="text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / legal */}
      <section className="rounded-xl bg-brand-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-brand-700">სამართლიანი, კანონიერი და კონფიდენციალური</h2>
        <ul className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li>✅ ავტომატური ჯარიმა არ არის — მხოლოდ უფლებამოსილი პირები იღებენ გადაწყვეტილებას.</li>
          <li>✅ სახეები ავტომატურად იბუნდება გამვლელთა კონფიდენციალობის დასაცავად.</li>
          <li>✅ შენი მონაცემები დაშიფრულია და უსაფრთხოდ ინახება (GDPR სტანდარტის შესაბამისად).</li>
          <li>✅ ყველა ადმინისტრაციული მოქმედება აუდიტის ჟურნალში აღირიცხება.</li>
        </ul>
      </section>
    </div>
  );
}