import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';

// English only at launch. To add Hindi: create hi.json with the same keys
// and add it to `resources`; the phone's language picks it automatically.
const resources = {
  en: { translation: en },
} as const;

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

// i18next's documented setup; the named `use` export would read like a React hook.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage in resources ? deviceLanguage : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes text
});

export default i18n;
