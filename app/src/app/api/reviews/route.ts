import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Dépose un avis sur une réservation terminée.
 *
 * Le destinataire (`reviewee_id`) est TOUJOURS déduit de la réservation, jamais
 * pris dans la requête. La politique RLS vérifie le rédacteur et l'état de la
 * réservation, mais pas le destinataire : sans ce garde-fou, on pourrait noter
 * sa propre location en désignant n'importe quel profil comme destinataire.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connectez-vous pour laisser un avis.' }, { status: 401 });
  }

  let bookingId: string | undefined;
  let rating: number | undefined;
  let comment: string | undefined;
  try {
    const body = await request.json();
    bookingId = body?.bookingId;
    rating = Number(body?.rating);
    comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!bookingId) {
    return NextResponse.json({ error: 'Réservation manquante.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating! < 1 || rating! > 5) {
    return NextResponse.json({ error: 'La note doit être comprise entre 1 et 5.' }, { status: 400 });
  }
  if (comment && comment.length > 1000) {
    return NextResponse.json({ error: 'Le commentaire ne peut pas dépasser 1 000 caractères.' }, { status: 400 });
  }

  // La RLS ne laisse lire que ses propres réservations : une réservation
  // introuvable ici signifie « pas la vôtre » autant que « inexistante ».
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, owner_id, renter_id, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  if (booking.status !== 'terminee') {
    return NextResponse.json(
      { error: 'Vous pourrez laisser un avis une fois la location terminée.' },
      { status: 409 }
    );
  }

  const estClient = booking.renter_id === user.id;
  const estLoueur = booking.owner_id === user.id;
  if (!estClient && !estLoueur) {
    return NextResponse.json({ error: 'Cette réservation ne vous concerne pas.' }, { status: 403 });
  }

  // Le destinataire est l'autre partie de la réservation.
  const revieweeId = estClient ? booking.owner_id : booking.renter_id;

  const { error: insertError } = await supabase.from('reviews').insert({
    booking_id: booking.id,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating: rating!,
    comment: comment || null,
  });

  if (insertError) {
    // UNIQUE (booking_id, reviewer_id) : un seul avis par location.
    const dejaNote = insertError.code === '23505';
    return NextResponse.json(
      { error: dejaNote ? 'Vous avez déjà laissé un avis pour cette location.' : insertError.message },
      { status: dejaNote ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
