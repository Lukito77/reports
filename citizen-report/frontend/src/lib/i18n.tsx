'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const translations = {
  en: {
    nav: {
      reportIssue: 'Report an issue',
      login: 'Log in',
      signup: 'Sign up',
    },
    home: {
      title: 'Help keep your city safe and orderly',
      subtitle: 'Spotted illegal parking, a blocked sidewalk, or littering? Submit photo evidence in minutes. Authorized officials review every report — fairly and transparently.',
      reportBtn: 'Report an issue',
      createAccount: 'Create an account',
      anonymous: 'You can report anonymously — no account required.',
      whatYouCanReport: 'What you can report',
      howItWorks: 'How it works',
      step1Title: 'Upload evidence',
      step1Desc: 'Upload photos (and optional video). Location is automatically detected from your photo when available.',
      step2Title: 'Add details',
      step2Desc: 'Pin the location on a map, choose a category, and describe what you saw.',
      step3Title: 'Official review',
      step3Desc: 'Authorized officials review the evidence and take appropriate action. You can track the status.',
      trustTitle: 'Fair, lawful, and private',
      trust1: '✅ No automatic fines — only authorized officials make decisions.',
      trust2: '✅ Faces are automatically blurred to protect bystander privacy.',
      trust3: '✅ Your data is encrypted and stored securely (GDPR compliant).',
      trust4: '✅ All administrative actions are recorded in an audit log.',
      categories: [
        { icon: '🅿️', label: 'Illegal parking' },
        { icon: '🚧', label: 'Blocked sidewalk' },
        { icon: '🚗', label: 'Abandoned vehicle' },
        { icon: '🗑️', label: 'Littering' },
        { icon: '🎨', label: 'Vandalism' },
        { icon: '♻️', label: 'Illegal dumping' },
      ],
    },
    report: {
      title: 'Report an issue',
      subtitle: 'Submit photo evidence of a potential public infraction. Authorized officials will review it — no automatic fines.',
      evidence: '1. Evidence',
      details: '2. Details',
      category: 'Category',
      description: 'Description',
      descPlaceholder: 'Describe what you observed (at least 10 characters)…',
      when: 'When did it happen? (optional)',
      location: '3. Location',
      locationHint: 'Click the map to set the location. If your photo contains GPS data, it will be placed automatically.',
      selected: 'Selected',
      addressPlaceholder: 'Address or landmark (optional)',
      yourReport: '4. Your submission',
      anonymousCheck: 'Submit anonymously (don\'t link this report to my account)',
      anonymousHint: 'You\'re submitting anonymously. Optionally leave a contact so officials can follow up.',
      contactPlaceholder: 'Contact email or phone (optional, encrypted)',
      submitBtn: 'Submit report',
      submitting: 'Submitting…',
      successTitle: 'Report submitted successfully',
      successMsg: 'Authorized officials will review your evidence. Thank you for helping your community.',
      errorCategories: 'Could not load categories. Is the API running?',
      errorSubmit: 'Submission failed. Please try again.',
    },
    register: {
      title: 'Create an account',
      subtitle: 'Track your reports and their status. You can also report anonymously without an account.',
      displayName: 'Display name (optional)',
      email: 'Email',
      password: 'Password',
      passwordHint: 'At least 10 characters, with upper & lower case letters and a number.',
      createAccount: 'Create account',
      alreadyHave: 'Already have an account?',
      signIn: 'Sign in',
      redirectingHome: 'Taking you back to the home page in a few seconds…',
      googleSignUp: 'Continue with Google',
    },
    login: {
      title: 'Sign in',
      subtitle: 'Sign in to track your reports.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      noAccount: "Don't have an account?",
      register: 'Sign up',
      signingIn: 'Signing in…',
      error: 'Login failed',
      or: 'or',
      googleSignIn: 'Sign in with Google',
      googleError: 'Google sign-in failed. Please try again.',
    },
    footer: {
      disclaimer: 'Citizen Report assists investigations — it does not issue fines or determine guilt. All enforcement decisions are made by authorized officials.',
    },
  },
  ka: {
    nav: {
      reportIssue: 'პრობლემის შეტყობინება',
      login: 'შესვლა',
      signup: 'რეგისტრაცია',
    },
    home: {
      title: 'დაეხმარე შენს ქალაქს გახდეს უსაფრთხო და კეთილმოწყობილი',
      subtitle: 'შენიშნე უკანონო პარკინგი, დაბლოკილი ტროტუარი ან ნაგვის გადაყრა? ატვირთე ფოტო მტკიცებულება რამდენიმე წუთში. უფლებამოსილი თანამდებობის პირები განიხილავენ თითოეულ განაცხადს — სამართლიანად და გამჭვირვალედ.',
      reportBtn: 'განაცხადის შეტანა',
      createAccount: 'ანგარიშის შექმნა',
      anonymous: 'შეგიძლია ანონიმურად შეიტანო განაცხადი — ანგარიში საჭირო არ არის.',
      whatYouCanReport: 'რისი შეტყობინება შეგიძლია',
      howItWorks: 'როგორ მუშაობს',
      step1Title: 'მტკიცებულების ატვირთვა',
      step1Desc: 'ატვირთე ფოტოები (და სურვილისამებრ ვიდეო). ადგილმდებარეობა ფოტოდან ავტომატურად განისაზღვრება, თუ ეს შესაძლებელია.',
      step2Title: 'დეტალების შევსება',
      step2Desc: 'მონიშნე ადგილი რუკაზე, აირჩიე კატეგორია და აღწერე რა დაინახე.',
      step3Title: 'ოფიციალური განხილვა',
      step3Desc: 'უფლებამოსილი თანამდებობის პირები განიხილავენ მტკიცებულებას და იღებენ შესაბამის გადაწყვეტილებას. შეგიძლია განაცხადის სტატუსი თვალყური ადევნო.',
      trustTitle: 'სამართლიანი, კანონიერი და კონფიდენციალური',
      trust1: '✅ ავტომატური ჯარიმა არ არის — მხოლოდ უფლებამოსილი პირები იღებენ გადაწყვეტილებას.',
      trust2: '✅ სახეები ავტომატურად იბუნდება გამვლელთა კონფიდენციალობის დასაცავად.',
      trust3: '✅ შენი მონაცემები დაშიფრულია და უსაფრთხოდ ინახება (GDPR სტანდარტის შესაბამისად).',
      trust4: '✅ ყველა ადმინისტრაციული მოქმედება აუდიტის ჟურნალში აღირიცხება.',
      categories: [
        { icon: '🅿️', label: 'უკანონო პარკინგი' },
        { icon: '🚧', label: 'დაბლოკილი ტროტუარი' },
        { icon: '🚗', label: 'მიტოვებული მანქანა' },
        { icon: '🗑️', label: 'ნაგვის გადაყრა' },
        { icon: '🎨', label: 'ვანდალიზმი' },
        { icon: '♻️', label: 'უკანონო ნარჩენების გადაყრა' },
      ],
    },
    report: {
      title: 'განაცხადის შეტანა',
      subtitle: 'ატვირთე ფოტო მტკიცებულება საჯარო სამართალდარღვევის შესახებ. განაცხადს უფლებამოსილი თანამდებობის პირები განიხილავენ — ჯარიმა ავტომატურად არ გაიცემა.',
      evidence: '1. მტკიცებულება',
      details: '2. დეტალები',
      category: 'კატეგორია',
      description: 'აღწერა',
      descPlaceholder: 'აღწერე რა დაინახე (მინიმუმ 10 სიმბოლო)…',
      when: 'როდის მოხდა? (სურვილისამებრ)',
      location: '3. ადგილმდებარეობა',
      locationHint: 'დააჭირე რუკაზე ადგილმდებარეობის მოსანიშნად. თუ ფოტოში GPS მონაცემებია, ადგილმდებარეობა ავტომატურად განისაზღვრება.',
      selected: 'არჩეული',
      addressPlaceholder: 'მისამართი ან ორიენტირი (სურვილისამებრ)',
      yourReport: '4. შენი განაცხადი',
      anonymousCheck: 'ანონიმურად გაგზავნა (განაცხადი არ დაუკავშირდება ჩემს ანგარიშს)',
      anonymousHint: 'განაცხადი ანონიმურად იგზავნება. სურვილისამებრ მიუთითე საკონტაქტო ინფორმაცია, რათა თანამდებობის პირებმა შეძლონ დაგიკავშირდნენ.',
      contactPlaceholder: 'საკონტაქტო ელ-ფოსტა ან ტელეფონი (სურვილისამებრ, დაშიფრული)',
      submitBtn: 'განაცხადის გაგზავნა',
      submitting: 'იგზავნება…',
      successTitle: 'განაცხადი წარმატებით გაიგზავნა',
      successMsg: 'უფლებამოსილი თანამდებობის პირები განიხილავენ შენს მტკიცებულებას. გმადლობთ, რომ ზრუნავ შენს თემზე.',
      errorCategories: 'კატეგორიების ჩატვირთვა ვერ მოხერხდა. API მუშაობს?',
      errorSubmit: 'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.',
    },
    register: {
      title: 'ანგარიშის შექმნა',
      subtitle: 'თვალყური ადევნე შენს შეტყობინებებს. ანონიმურადაც შეგიძლია შეტყობინება ანგარიშის გარეშე.',
      displayName: 'სახელი (არასავალდებულო)',
      email: 'ელ-ფოსტა',
      password: 'პაროლი',
      passwordHint: 'მინიმუმ 10 სიმბოლო, დიდი და პატარა ასოები და ციფრი.',
      createAccount: 'ანგარიშის შექმნა',
      alreadyHave: 'უკვე გაქვს ანგარიში?',
      signIn: 'შესვლა',
      redirectingHome: 'რამდენიმე წამში მთავარ გვერდზე დაბრუნდები…',
      googleSignUp: 'Google-ით გაგრძელება',
    },
    login: {
      title: 'შესვლა',
      subtitle: 'შენს შეტყობინებებს თვალყურის დევნებისთვის შედი.',
      email: 'ელ-ფოსტა',
      password: 'პაროლი',
      submit: 'შესვლა',
      noAccount: 'არ გაქვს ანგარიში?',
      register: 'რეგისტრაცია',
      signingIn: 'მიმდინარეობს...',
      error: 'შესვლა ვერ მოხერხდა',
      or: 'ან',
      googleSignIn: 'Google-ით შესვლა',
      googleError: 'Google-ით ავტორიზაცია ვერ მოხერხდა. სცადეთ თავიდან.',
    },
    footer: {
      disclaimer: 'Citizen Report ეხმარება გამოძიებას — ის არ გასცემს ჯარიმებს და არ განსაზღვრავს დანაშაულს. ყველა გადაწყვეტილებას იღებენ უფლებამოსილი პირები.',
    },
  },
};

type Language = 'en' | 'ka';
type Translations = typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

const LANG_STORAGE_KEY = 'crp_lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('ka');

  // შენახული ენის აღდგენა გვერდის ჩატვირთვისას.
  // useEffect-ში (და არა useState-ის საწყის მნიშვნელობაში) — hydration mismatch-ის თავიდან ასაცილებლად.
  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'ka') setLangState(saved);
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}