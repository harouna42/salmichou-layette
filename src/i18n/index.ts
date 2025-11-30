import { createI18n } from 'vue-i18n';
import fr from '../locales/fr.json';
import en from '../locales/en.json';

// Types pour TypeScript
type MessageSchema = typeof fr;

export const i18n = createI18n<[MessageSchema], 'fr' | 'en'>({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: {
    fr,
    en
  }
});

// Helper pour utiliser i18n dans les composants
export const useI18n = () => {
  const { t, locale } = i18n.global;
  return { t, locale };
};

// Fonction pour changer la langue
export const setLanguage = (lang: 'fr' | 'en') => {
  i18n.global.locale = lang;
  localStorage.setItem('preferred-language', lang);
};

// Charger la langue préférée
export const loadPreferredLanguage = () => {
  const savedLang = localStorage.getItem('preferred-language') as 'fr' | 'en';
  if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
    i18n.global.locale = savedLang;
  }
  return i18n.global.locale;
};