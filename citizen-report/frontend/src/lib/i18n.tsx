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
      subtitle: 'Spotted illegal parking, a blocked sidewalk, or misplaced waste? Submit photo evidence in minutes. Authorized officials review every report — fairly and transparently.',
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
      step3Desc: 'Authorized officials review the report and take appropriate measures.',
      trustTitle: 'Fair, lawful, and private',
      trust1: '✅ No automatic fines — only authorized officials make decisions.',
      trust2: '✅ Faces are automatically blurred to protect bystander privacy.',
      trust3: '✅ Your data is encrypted and stored securely (GDPR compliant).',
      trust4: '✅ All administrative actions are recorded in an audit log.',
      categories: [
        { icon: '🅿️', label: 'Illegal parking' },
        { icon: '🚧', label: 'Blocked sidewalk' },
        { icon: '🚗', label: 'Abandoned vehicle' },
        { icon: '🗑️', label: 'Misplaced waste' },
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
      disclaimer: 'Citizen Report helps find solutions — it does not fine or assign blame. All enforcement decisions are made by authorized officials.',
    },
    status: {
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under review',
      INFO_REQUESTED: 'Info requested',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CLOSED: 'Closed',
    },
    dashboard: {
      title: 'My reports',
      signedInAs: 'Signed in as',
      emailNotVerified: 'Email not verified',
      exportData: 'Export my data',
      exporting: 'Exporting…',
      newReport: 'New report',
      empty: 'You haven’t submitted any reports yet.',
      submitOne: 'Submit one',
      media: 'media',
      approved: 'Approved',
      rejected: 'Rejected',
      reviewerRequested: 'Reviewer requested:',
      loadFailed: 'Failed to load reports',
      loading: 'Loading…',
    },
    reportDetail: {
      back: '← Back to my reports',
      submitted: 'Submitted',
      anonymous: 'anonymous',
      description: 'Description',
      location: 'Location',
      approvedTitle: 'Your report was approved',
      approvedRest: 'and forwarded for a human enforcement decision.',
      reviewerNote: 'Reviewer note:',
      rejectedTitle: 'Your report was rejected.',
      reason: 'Reason:',
      infoRequested: 'Reviewer requested more information:',
      deleteBtn: 'Delete this report',
      deleting: 'Deleting…',
      deleteHint: 'Permanently removes your report and its media.',
      deleteConfirm: 'Delete this report permanently? This cannot be undone.',
      deleteFailed: 'Delete failed',
      evidence: 'Evidence (faces blurred for privacy)',
      loadFailed: 'Failed to load report',
      loading: 'Loading…',
    },
    admin: {
      title: 'Admin dashboard',
      total: 'Total',
      status: 'Status',
      category: 'Category',
      searchDescription: 'Search description',
      apply: 'Apply',
      all: 'All',
      noMatch: 'No reports match these filters.',
      selectPrompt: 'Select a report to review its evidence.',
      anonymous: 'anonymous',
      aiAssistance: 'AI assistance (advisory only)',
      reviewerNoteLabel: 'Reviewer note (shown to the reporter — e.g. a reason for approval/rejection or an info request)',
      markReviewing: 'Mark reviewing',
      requestInfo: 'Request info',
      approve: 'Approve',
      reject: 'Reject',
      close: 'Close',
      deletePermanently: 'Delete permanently',
      deleteHint: 'Removes the report, its media, and AI analyses for good. The deletion is recorded in the audit log.',
      deleteConfirm: 'Permanently delete this report and its media? This cannot be undone.',
      approvalHint: 'Approval forwards this report for a human enforcement decision. It does not issue any penalty.',
      statusUpdateFailed: 'Status update failed',
      deleteFailed: 'Delete failed',
      loadFailed: 'Failed to load',
      loading: 'Loading…',
    },
  },
  ka: {
    nav: {
      reportIssue: 'პრობლემის შეტყობინება',
      login: 'შესვლა',
      signup: 'რეგისტრაცია',
    },
    home: {
      title: 'დაეხმარეთ თქვენს ქალაქს, გახდეს უფრო უსაფრთხო და მოწესრიგებული',
      subtitle: 'შენიშნეთ უკანონო პარკინგი, დაბლოკილი ტროტუარი ან უადგილოდ მოთავსებული ნაგავი? ატვირთეთ ფოტო მტკიცებულება რამდენიმე წუთში. უფლებამოსილი თანამდებობის პირები განიხილავენ თითოეულ განაცხადს — სამართლიანად და გამჭვირვალედ.',
      reportBtn: 'განაცხადის შეტანა',
      createAccount: 'ანგარიშის შექმნა',
      anonymous: 'შეგიძლიათ ანონიმურად შეიტანოთ განაცხადი — ანგარიში საჭირო არ არის.',
      whatYouCanReport: 'რისი შეტყობინება შეგიძლიათ',
      howItWorks: 'როგორ მუშაობს',
      step1Title: 'მტკიცებულების ატვირთვა',
      step1Desc: 'ატვირთეთ ფოტოები (და სურვილისამებრ ვიდეო). ადგილმდებარეობა ფოტოდან ავტომატურად განისაზღვრება, თუ ეს შესაძლებელია.',
      step2Title: 'დეტალების შევსება',
      step2Desc: 'მონიშნეთ ადგილი რუკაზე, აირჩიეთ კატეგორია და აღწერეთ, რა დაინახეთ.',
      step3Title: 'ოფიციალური განხილვა',
      step3Desc: 'უფლებამოსილი თანამდებობის პირები განიხილავენ განაცხადს და მიმართავენ შესაბამის ზომებს.',
      trustTitle: 'სამართლიანი, კანონიერი და კონფიდენციალური',
      trust1: '✅ ავტომატური ჯარიმა არ არის — მხოლოდ უფლებამოსილი პირები იღებენ გადაწყვეტილებას.',
      trust2: '✅ სახეები ავტომატურად იბურება გამვლელთა კონფიდენციალურობის დასაცავად.',
      trust3: '✅ თქვენი მონაცემები დაშიფრულია და უსაფრთხოდ ინახება (GDPR სტანდარტის შესაბამისად).',
      trust4: '✅ ყველა ადმინისტრაციული მოქმედება აუდიტის ჟურნალში აღირიცხება.',
      categories: [
        { icon: '🅿️', label: 'უკანონო პარკინგი' },
        { icon: '🚧', label: 'დაბლოკილი ტროტუარი' },
        { icon: '🚗', label: 'მიტოვებული მანქანა' },
        { icon: '🗑️', label: 'უადგილოდ მოთავსებული ნაგავი' },
        { icon: '🎨', label: 'ვანდალიზმი' },
        { icon: '♻️', label: 'უკანონო ნარჩენების გადაყრა' },
      ],
    },
    report: {
      title: 'განაცხადის შეტანა',
      subtitle: 'ატვირთეთ ფოტო მტკიცებულება საჯარო სამართალდარღვევის შესახებ. განაცხადს უფლებამოსილი თანამდებობის პირები განიხილავენ — ჯარიმა ავტომატურად არ გაიცემა.',
      evidence: '1. მტკიცებულება',
      details: '2. დეტალები',
      category: 'კატეგორია',
      description: 'აღწერა',
      descPlaceholder: 'აღწერეთ, რა დაინახეთ (მინიმუმ 10 სიმბოლო)…',
      when: 'როდის მოხდა? (სურვილისამებრ)',
      location: '3. ადგილმდებარეობა',
      locationHint: 'დააჭირეთ რუკას ადგილმდებარეობის მოსანიშნად. თუ ფოტოში GPS მონაცემებია, ადგილმდებარეობა ავტომატურად განისაზღვრება.',
      selected: 'არჩეული',
      addressPlaceholder: 'მისამართი ან ორიენტირი (სურვილისამებრ)',
      yourReport: '4. თქვენი განაცხადი',
      anonymousCheck: 'ანონიმურად გაგზავნა (განაცხადი არ დაუკავშირდება ჩემს ანგარიშს)',
      anonymousHint: 'განაცხადი ანონიმურად იგზავნება. სურვილისამებრ მიუთითეთ საკონტაქტო ინფორმაცია, რათა საჭიროების შემთხვევაში თანამდებობის პირებმა დაგიკავშირდნენ.',
      contactPlaceholder: 'საკონტაქტო ელ-ფოსტა ან ტელეფონი (სურვილისამებრ, დაშიფრული)',
      submitBtn: 'განაცხადის გაგზავნა',
      submitting: 'იგზავნება…',
      successTitle: 'განაცხადი წარმატებით გაიგზავნა',
      successMsg: 'უფლებამოსილი თანამდებობის პირები განიხილავენ თქვენს მტკიცებულებას. გმადლობთ, რომ ზრუნავთ თქვენს თემზე.',
      errorCategories: 'კატეგორიების ჩატვირთვა ვერ მოხერხდა. API მუშაობს?',
      errorSubmit: 'გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.',
    },
    register: {
      title: 'ანგარიშის შექმნა',
      subtitle: 'თვალყური ადევნეთ თქვენს განაცხადებსა და მათ სტატუსს. ანგარიშის გარეშეც შეგიძლიათ ანონიმურად შეიტანოთ განაცხადი.',
      displayName: 'სახელი (არასავალდებულო)',
      email: 'ელ-ფოსტა',
      password: 'პაროლი',
      passwordHint: 'მინიმუმ 10 სიმბოლო, დიდი და პატარა ასოები და ციფრი.',
      createAccount: 'ანგარიშის შექმნა',
      alreadyHave: 'უკვე გაქვთ ანგარიში?',
      signIn: 'შესვლა',
      redirectingHome: 'რამდენიმე წამში მთავარ გვერდზე დაბრუნდებით…',
      googleSignUp: 'Google-ით გაგრძელება',
    },
    login: {
      title: 'შესვლა',
      subtitle: 'შედით, რომ თვალყური ადევნოთ თქვენს განაცხადებს.',
      email: 'ელ-ფოსტა',
      password: 'პაროლი',
      submit: 'შესვლა',
      noAccount: 'არ გაქვთ ანგარიში?',
      register: 'რეგისტრაცია',
      signingIn: 'მიმდინარეობს…',
      error: 'შესვლა ვერ მოხერხდა',
      or: 'ან',
      googleSignIn: 'Google-ით შესვლა',
      googleError: 'Google-ით ავტორიზაცია ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.',
    },
    footer: {
      disclaimer: 'Citizen Report ხელს უწყობს პრობლემების მოგვარებას — ის არ აჯარიმებს და არ ადანაშაულებს. ყველა საბოლოო გადაწყვეტილებას იღებენ უფლებამოსილი თანამდებობის პირები.',
    },
    status: {
      SUBMITTED: 'გაგზავნილი',
      UNDER_REVIEW: 'განხილვის პროცესში',
      INFO_REQUESTED: 'მოთხოვნილია ინფორმაცია',
      APPROVED: 'დამტკიცებული',
      REJECTED: 'უარყოფილი',
      CLOSED: 'დახურული',
    },
    dashboard: {
      title: 'ჩემი განაცხადები',
      signedInAs: 'შესული ხართ როგორც',
      emailNotVerified: 'ელ-ფოსტა დაუდასტურებელია',
      exportData: 'ჩემი მონაცემების ექსპორტი',
      exporting: 'მიმდინარეობს ექსპორტი…',
      newReport: 'ახალი განაცხადი',
      empty: 'ჯერ არცერთი განაცხადი არ შეგიტანიათ.',
      submitOne: 'შეიტანეთ ერთი',
      media: 'მედია',
      approved: 'დამტკიცებული',
      rejected: 'უარყოფილი',
      reviewerRequested: 'განმხილველის მოთხოვნა:',
      loadFailed: 'განაცხადების ჩატვირთვა ვერ მოხერხდა',
      loading: 'იტვირთება…',
    },
    reportDetail: {
      back: '← უკან ჩემს განაცხადებზე',
      submitted: 'გაგზავნილია',
      anonymous: 'ანონიმური',
      description: 'აღწერა',
      location: 'ადგილმდებარეობა',
      approvedTitle: 'თქვენი განაცხადი დამტკიცდა',
      approvedRest: 'და გადაეგზავნა უფლებამოსილ პირს გადაწყვეტილების მისაღებად.',
      reviewerNote: 'განმხილველის შენიშვნა:',
      rejectedTitle: 'თქვენი განაცხადი უარყოფილია.',
      reason: 'მიზეზი:',
      infoRequested: 'განმხილველმა დამატებითი ინფორმაცია მოითხოვა:',
      deleteBtn: 'განაცხადის წაშლა',
      deleting: 'მიმდინარეობს წაშლა…',
      deleteHint: 'სამუდამოდ შლის თქვენს განაცხადსა და მის მედიას.',
      deleteConfirm: 'სამუდამოდ წავშალო ეს განაცხადი? ამის გაუქმება შეუძლებელია.',
      deleteFailed: 'წაშლა ვერ მოხერხდა',
      evidence: 'მტკიცებულება (სახეები დაბურულია კონფიდენციალურობისთვის)',
      loadFailed: 'განაცხადის ჩატვირთვა ვერ მოხერხდა',
      loading: 'იტვირთება…',
    },
    admin: {
      title: 'ადმინის პანელი',
      total: 'სულ',
      status: 'სტატუსი',
      category: 'კატეგორია',
      searchDescription: 'აღწერაში ძიება',
      apply: 'გაფილტვრა',
      all: 'ყველა',
      noMatch: 'ამ ფილტრებით განაცხადი ვერ მოიძებნა.',
      selectPrompt: 'აირჩიეთ განაცხადი მისი მტკიცებულების სანახავად.',
      anonymous: 'ანონიმური',
      aiAssistance: 'AI დახმარება (მხოლოდ სარეკომენდაციო)',
      reviewerNoteLabel: 'განმხილველის შენიშვნა (ჩანს განმცხადებლისთვის — მაგ. დამტკიცების/უარყოფის მიზეზი ან დამატებითი ინფორმაციის მოთხოვნა)',
      markReviewing: 'განხილვაში გადატანა',
      requestInfo: 'ინფორმაციის მოთხოვნა',
      approve: 'დამტკიცება',
      reject: 'უარყოფა',
      close: 'დახურვა',
      deletePermanently: 'სამუდამოდ წაშლა',
      deleteHint: 'სამუდამოდ შლის განაცხადს, მის მედიასა და AI ანალიზებს. წაშლა აღირიცხება აუდიტის ჟურნალში.',
      deleteConfirm: 'სამუდამოდ წავშალო ეს განაცხადი და მისი მედია? ამის გაუქმება შეუძლებელია.',
      approvalHint: 'დამტკიცება გადასცემს განაცხადს უფლებამოსილ პირს გადაწყვეტილების მისაღებად. ის ავტომატურად არანაირ სანქციას არ აწესებს.',
      statusUpdateFailed: 'სტატუსის განახლება ვერ მოხერხდა',
      deleteFailed: 'წაშლა ვერ მოხერხდა',
      loadFailed: 'ჩატვირთვა ვერ მოხერხდა',
      loading: 'იტვირთება…',
    },
  },
};

export type Language = 'en' | 'ka';
type Translations = typeof translations.en;

/**
 * კატეგორიის ლოკალიზებული სახელი — ბაზაში ორივე ენაზე ინახება
 * (name ქართულად, nameEn ინგლისურად), აქ ვირჩევთ აქტიური ენის მიხედვით.
 */
export function categoryLabel(
  c: { name: string; nameEn?: string | null } | null | undefined,
  lang: Language,
): string {
  if (!c) return lang === 'ka' ? 'განაცხადი' : 'Report';
  return lang === 'en' && c.nameEn ? c.nameEn : c.name;
}

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