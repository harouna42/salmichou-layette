/**
 * Formate un prix en FCFA avec séparateurs de milliers
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('fr-FR').format(number);
};