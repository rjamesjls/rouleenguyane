/**
 * Configuration Stripe partagée (aucun secret ici — importable côté client).
 */

export const STRIPE_CURRENCY = 'eur';

/** Version d'API épinglée sur celle embarquée par le SDK installé (stripe@22). */
export const STRIPE_API_VERSION = '2026-06-24.dahlia';

/**
 * Stripe raisonne en plus petite unité monétaire (centimes pour l'EUR).
 * Le schéma stocke des DECIMAL(10,2) en euros : il faut convertir.
 */
export function toStripeAmount(euros: number): number {
  return Math.round(euros * 100);
}

/** Conversion inverse, pour réafficher un montant renvoyé par Stripe. */
export function fromStripeAmount(centimes: number): number {
  return centimes / 100;
}
