'use client';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export const CONSENT_TEXT =
  'I confirm that the evidence I am submitting is genuine and was lawfully obtained. ' +
  'I consent to Citizen Report processing this submission — including the photos, ' +
  'optional video, location, and any metadata — for the purpose of forwarding it to ' +
  'authorized officials for review. I understand that this platform does not issue ' +
  'fines or determine guilt, that faces may be blurred for privacy, and that I can ' +
  'request export or deletion of my personal data at any time.';

export function ConsentNotice({ checked, onChange }: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-amber-800">Consent & privacy notice</h3>
      <p className="mb-3 text-xs leading-relaxed text-amber-900">{CONSENT_TEXT}</p>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-900">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>I have read and agree to the consent &amp; privacy notice above.</span>
      </label>
    </div>
  );
}
