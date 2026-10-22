import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Stripe.js côté navigateur. `loadStripe` ne doit être appelé qu'une seule fois
 * par chargement de page : on mémoïse la promesse.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est absente. Ajoute-la dans .env.local.'
      );
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}
