import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getWebhookSecret } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fromStripeAmount } from '@/lib/stripe/config';

// Le SDK Stripe requiert le runtime Node (pas Edge).
export const runtime = 'nodejs';

/**
 * Webhook Stripe : source de vérité du paiement.
 *
 * On ne confirme JAMAIS un paiement depuis la success_url (le client peut
 * l'ouvrir sans avoir payé) — seul cet endpoint, dont la signature est
 * vérifiée, a le droit d'écrire dans `payments`.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  // Corps BRUT obligatoire : toute désérialisation invaliderait la signature.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getWebhookSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide.';
    return NextResponse.json({ error: `Webhook non vérifié : ${message}` }, { status: 400 });
  }

  // Le webhook écrit sans session utilisateur : il lui faut la clé service role.
  // Si elle manque, on répond 500 avec un message explicite — Stripe réessaie
  // pendant 3 jours, ce qui laisse le temps de corriger sans perdre l'évènement.
  // Un échec muet ferait encaisser un paiement jamais inscrit en base.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error('[stripe/webhook] configuration Supabase manquante', e);
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY absente : évènement non traité, Stripe réessaiera.' },
      { status: 500 }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id ?? session.client_reference_id;

      // `payment_status` distingue une session terminée d'un paiement encaissé.
      if (!bookingId || session.payment_status !== 'paid') break;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!paymentIntentId) {
        console.error('[stripe/webhook] session sans payment_intent', session.id);
        break;
      }

      // upsert sur la contrainte unique : Stripe rejoue les événements, et un
      // insert simple violerait payments_stripe_payment_intent_id_key.
      const { error } = await supabase
        .from('payments')
        .upsert(
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
        // 500 pour que Stripe rejoue l'événement plutôt que de le perdre.
        console.error('[stripe/webhook] échec enregistrement paiement', bookingId, error);
        return NextResponse.json({ error: 'Mise à jour en base échouée.' }, { status: 500 });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      const bookingId = intent.metadata?.booking_id;
      if (!bookingId) break;

      const { error } = await supabase
        .from('payments')
        .upsert(
          {
            booking_id: bookingId,
            kind: 'location',
            stripe_payment_intent_id: intent.id,
            amount: fromStripeAmount(intent.amount),
            currency: intent.currency,
            status: 'echoue',
          },
          { onConflict: 'stripe_payment_intent_id' }
        );

      if (error) {
        console.error('[stripe/webhook] échec enregistrement échec', bookingId, error);
        return NextResponse.json({ error: 'Mise à jour en base échouée.' }, { status: 500 });
      }
      // La réservation reste « confirmee » et impayée : le client peut réessayer.
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (!paymentIntentId) break;

      const rembourse = fromStripeAmount(charge.amount_refunded);
      const total = fromStripeAmount(charge.amount);

      const { error } = await supabase
        .from('payments')
        .update({
          status: rembourse >= total ? 'rembourse' : 'partiellement_rembourse',
          refunded_amount: rembourse,
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        console.error('[stripe/webhook] échec enregistrement remboursement', paymentIntentId, error);
        return NextResponse.json({ error: 'Mise à jour en base échouée.' }, { status: 500 });
      }
      break;
    }

    default:
      // Événement non traité : on acquitte pour éviter les rejeux inutiles.
      break;
  }

  return NextResponse.json({ received: true });
}
