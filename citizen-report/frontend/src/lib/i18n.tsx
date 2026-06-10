'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const translations = {
  en: {
    nav: {
      reportIssue: 'Report an issue',
      login: 'Log in',
      signup: 'Sign up',
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
    },
    login: {
      title: 'Sign in',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      noAccount: "Don't have an account?",
      register: 'Sign up',
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
    },
    login: {
      title: 'შესვლა',
      email: 'ელ-ფოსტა',
      password: 'პაროლი',
      submit: 'შესვლა',
      noAccount: 'არ გაქვს ანგარიში?',
      register: 'რეგისტრაცია',
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('ka');

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