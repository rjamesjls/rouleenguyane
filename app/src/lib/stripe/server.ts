import Stripe from 'stripe';
import { STRIPE_API_VERSION } from './config';

/**
 * Instance Stripe côté serveur — NE JAMAIS importer depuis un composant client.
 *
 * L'initialisation est paresseuse : le module peut être importé pendant le build
 * (analyse des routes) alors que STRIPE_SECRET_KEY n'est pas encore disponible.
 * On ne lève l'erreur qu'au premier appel réel.
 */
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY est absente. Ajoute-la dans .env.local (voir .env.example).'
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: { name: 'ROULE', url: 'https://roule.gf' },
  });

  return stripeInstance;
}

/** Secret de signature du webhook, vérifié à l'usage. */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET est absente. Récupère-la via `stripe listen` en local.'
    );
  }
  return secret;
}
