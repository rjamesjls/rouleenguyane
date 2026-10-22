import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Annule une demande encore en attente, uniquement pour son locataire. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Connectez-vous pour annuler cette demande.' }, { status: 401 });
  }

  let bookingId: string | undefined;
  let reason = '';
  try {
    const body = await request.json();
    bookingId = typeof body?.bookingId === 'string' ? body.bookingId : undefined;
    reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!bookingId) {
    return NextResponse.json({ error: 'Réservation manquante.' }, { status: 400 });
  }
  if (!reason || reason.length > 500) {
    return NextResponse.json({ error: 'Indiquez un motif d’annulation valide.' }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }
  if (booking.status !== 'en_attente') {
    return NextResponse.json(
      { error: 'Seule une demande encore en attente peut être annulée ici.' },
      { status: 409 }
    );
  }

  // Le filtre sur l'ancien statut protège aussi contre une validation du
  // loueur qui arriverait entre la lecture ci-dessus et cette mise à jour.
  const { data: cancelled, error } = await supabase
    .from('bookings')
    .update({
      status: 'annulee',
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .eq('status', 'en_attente')
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `Annulation impossible : ${error.message}` }, { status: 500 });
  }
  if (!cancelled) {
    return NextResponse.json(
      { error: 'Le statut de la réservation a changé. Actualisez la page.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
