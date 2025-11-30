import { i18n } from '../i18n';


/**
 * Formate un prix en FCFA avec séparateurs de milliers
 */
export const formatPrice = (price: number): string => {
  const locale = i18n.global.locale.value === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'XOF'
  }).format(price);
};


/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatDate = (date: Date | string): string => {
  const locale = i18n.global.locale.value === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(date).toLocaleDateString(locale);
};

export const formatDateTime = (date: Date | string): string => {
  const locale = i18n.global.locale.value === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(date).toLocaleString(locale);
};
