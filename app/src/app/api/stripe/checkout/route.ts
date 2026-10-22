import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { STRIPE_CURRENCY, toStripeAmount } from '@/lib/stripe/config';

// Le SDK Stripe requiert le runtime Node (pas Edge).
export const runtime = 'nodejs';

/**
 * Crée une session Stripe Checkout pour une réservation existante.
 *
 * Le montant n'est JAMAIS lu depuis le corps de la requête : il est recalculé
 * à partir de la ligne en base, sinon un client pourrait payer le prix qu'il veut.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  let bookingId: string | undefined;
  try {
    const body = await request.json();
    bookingId = body?.bookingId;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId est requis.' }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, renter_id, status, total_amount, vehicle:vehicles(brand, model), payments(kind, status)')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  // La RLS laisse aussi passer le loueur : on restreint explicitement au locataire.
  if (booking.renter_id !== user.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  // L'état du paiement vit dans `payments`, pas sur `bookings`.
  const dejaPayee = booking.payments.some(p => p.kind === 'location' && p.status === 'reussi');
  if (dejaPayee) {
    return NextResponse.json({ error: 'Réservation déjà payée.' }, { status: 409 });
  }

  if (booking.status !== 'confirmee') {
    return NextResponse.json(
      { error: 'La réservation doit être confirmée par le loueur avant paiement.' },
      { status: 409 }
    );
  }

  const vehicle = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle;
  const libelle = vehicle ? `Location ${vehicle.brand} ${vehicle.model}` : 'Location de véhicule';

  const origin = request.nextUrl.origin;

  // `getStripe()` lève si STRIPE_SECRET_KEY est absente, et l'API Stripe peut
  // échouer. Sans ce filet, l'exception remontait à Next qui renvoyait un 500
  // au corps vide : côté client `res.json()` échouait et l'utilisateur voyait
  // « Vérifiez votre réseau » pour une clé manquante.
  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error('[stripe/checkout] configuration', e);
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas encore configuré sur ce site." },
      { status: 503 }
    );
  }

  try {

  // La caution n'est jamais encaissée par la plateforme : c'est un choix
  // produit, le loueur la gère en direct avec son client. Le paiement se limite
  // donc au prix de la location plus les frais de service.
  // Les valeurs `preauth_stripe` (deposit_mode), `caution_preauth`
  // (payments.kind) et l'enum `preauth_status` restent en base mais ne sont
  // plus utilisées — ne pas les rebrancher sans décision produit contraire.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: toStripeAmount(Number(booking.total_amount)),
            product_data: { name: libelle },
          },
        },
      ],
      // Rattache la session à la réservation : le webhook s'en sert pour écrire en base.
      client_reference_id: booking.id,
      metadata: { booking_id: booking.id },
      payment_intent_data: { metadata: { booking_id: booking.id } },
      // `{CHECKOUT_SESSION_ID}` est remplacé par Stripe à la redirection. Il
      // permet de relire l'état réel du paiement au retour, sans faire
      // confiance aux paramètres d'URL (cf. lib/stripe/reconcilier.ts).
      success_url: `${origin}/dashboard?paiement=succes&reservation=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?paiement=annule&reservation=${booking.id}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe n’a pas renvoyé de page de paiement.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    console.error('[stripe/checkout] création de session', e);
    const detail = e instanceof Error ? e.message : 'erreur inconnue';
    return NextResponse.json(
      { error: `Le paiement n’a pas pu être initié : ${detail}` },
      { status: 502 }
    );
  }
}
