// Serveur uniquement : ce module lit STRIPE_SECRET_KEY et la clé service role.
// NE JAMAIS l'importer depuis un composant client.
import { getStripe } from './server';
import { fromStripeAmount } from './config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Réconcilie un paiement au retour de Stripe Checkout.
 *
 * Le webhook reste la source de vérité, mais il peut arriver en retard, être
 * mal configuré, ou ne pas être écouté du tout en développement. Sans ce
 * rattrapage, le client voyait une bannière « paiement réussi » alors que sa
 * réservation restait affichée comme impayée — bouton « Payer » compris.
 *
 * On ne fait JAMAIS confiance aux paramètres d'URL : l'état payé est relu
 * auprès de Stripe à partir de l'identifiant de session, et l'écriture se fait
 * en upsert sur la contrainte unique `stripe_payment_intent_id`, exactement
 * comme le webhook. Les deux peuvent donc s'exécuter sans créer de doublon.
 *
 * Renvoie true si un paiement a été confirmé (déjà présent ou écrit ici).
 */
export async function reconcilierPaiement(sessionId: string): Promise<boolean> {
  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error('[reconcilier] session illisible', sessionId, e);
    return false;
  }

  if (session.payment_status !== 'paid') return false;

  const bookingId = session.metadata?.booking_id ?? session.client_reference_id;
  if (!bookingId) return false;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) return false;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error('[reconcilier] SUPABASE_SERVICE_ROLE_KEY absente', e);
    return false;
  }

  const { error } = await supabase.from('payments').upsert(
    {
      booking_id: bookingId,
      kind: 'location',
      stripe_payment_intent_id: paymentIntentId,
      amount: fromStripeAmount(session.amount_total ?? 0),
      currency: session.currency ?? 'eur',
      status: 'reussi',
      paid_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_payment_intent_id' }
  );

  if (error) {
    console.error('[reconcilier] écriture impossible', bookingId, error);
    return false;
  }

  return true;
}
