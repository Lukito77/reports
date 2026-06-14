'use client';

import { useI18n } from '@/lib/i18n';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export const CONSENT_TEXT =
  'I confirm that the evidence I am submitting is genuine and obtained lawfully. ' +
  'I consent to Citizen Report processing this report — including photos, optional video, ' +
  'location data, and any metadata — for review by authorized officials. I understand that ' +
  'this platform does not issue fines or determine guilt, that faces may be blurred to protect ' +
  'privacy, and that I may request export or deletion of my personal data at any time.';

export const CONSENT_TEXT_KA =
  'ვადასტურებ, რომ ჩემ მიერ წარდგენილი მტკიცებულება ნამდვილია და მოპოვებულია კანონიერად. ' +
  'თანახმა ვარ, რომ Citizen Report-მა დაამუშაოს ეს განაცხადი — ფოტოების, სურვილისამებრ ატვირთული ვიდეოს, ' +
  'მდებარეობისა და ნებისმიერი მეტამონაცემების ჩათვლით — უფლებამოსილი პირებისთვის განსახილველად ' +
  'გადაგზავნის მიზნით. მესმის, რომ ეს პლატფორმა არ აკისრებს ჯარიმებს და არ ადგენს დანაშაულს, ' +
  'რომ სახეები შეიძლება დაიბუროს კონფიდენციალურობის დასაცავად და რომ ნებისმიერ დროს შემიძლია ' +
  'მოვითხოვო ჩემი პერსონალური მონაცემების ექსპორტი ან წაშლა.';

export function ConsentNotice({ checked, onChange }: Props) {
  const { lang } = useI18n();
  const isKa = lang === 'ka';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-amber-800">
        {isKa ? 'თანხმობა და კონფიდენციალურობის პირობები' : 'Consent and Privacy Terms'}
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-amber-900">
        {isKa ? CONSENT_TEXT_KA : CONSENT_TEXT}
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-900">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {isKa
            ? 'გავეცანი და ვეთანხმები ზემოთ მოცემულ თანხმობისა და კონფიდენციალურობის პირობებს.'
            : 'I have read and agree to the consent and privacy terms above.'}
        </span>
      </label>
    </div>
  );
}