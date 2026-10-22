import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculerDevis, compterJours, lireCommission } from '@/lib/tarifs';

export const runtime = 'nodejs';

/**
 * Crée une demande de réservation.
 *
 * Les montants ne viennent JAMAIS du client : ils sont recalculés ici à partir
 * du prix du véhicule en base et de la commission de `platform_settings`.
 * Sinon n'importe qui pourrait poster des frais de service à zéro.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connectez-vous pour réserver.' }, { status: 401 });
  }

  let vehicleId: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;
  try {
    const body = await request.json();
    vehicleId = body?.vehicleId;
    startDate = body?.startDate;
    endDate = body?.endDate;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!vehicleId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Véhicule et dates de début et de fin sont requis.' },
      { status: 400 }
    );
  }

  const totalDays = compterJours(startDate, endDate);
  if (!Number.isFinite(totalDays) || totalDays < 1) {
    return NextResponse.json(
      { error: 'La date de retour doit être postérieure à la date de départ.' },
      { status: 400 }
    );
  }

  const aujourdhui = new Date().toISOString().split('T')[0];
  if (startDate < aujourdhui) {
    return NextResponse.json({ error: 'La date de départ est passée.' }, { status: 400 });
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, owner_id, daily_price, deposit_amount, min_rental_days, status, booking_mode')
    .eq('id', vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: 'Véhicule introuvable.' }, { status: 404 });
  }

  if (vehicle.status !== 'en_ligne') {
    return NextResponse.json({ error: "Ce véhicule n'est pas disponible." }, { status: 409 });
  }

  if (vehicle.owner_id === user.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas réserver votre propre véhicule.' },
      { status: 409 }
    );
  }

  if (totalDays < vehicle.min_rental_days) {
    return NextResponse.json(
      { error: `La durée minimum de location est de ${vehicle.min_rental_days} jour(s).` },
      { status: 400 }
    );
  }

  // Disponibilité : réservation concurrente OU date bloquée par le loueur.
  //
  // Le contrôle passe par une fonction SECURITY DEFINER, et non par une
  // requête directe : la RLS ne montre au locataire que SES réservations, si
  // bien qu'un comptage depuis sa session voyait toujours zéro chevauchement
  // et laissait passer une double réservation.
  const { data: motif } = await supabase.rpc('motif_indisponibilite', {
    p_vehicle: vehicleId,
    p_debut: startDate,
    p_fin: endDate,
  });

  if (motif) {
    return NextResponse.json(
      {
        error: motif === 'bloque'
          ? 'Le propriétaire a rendu le véhicule indisponible sur cette période.'
          : 'Ces dates sont déjà réservées sur ce véhicule.',
      },
      { status: 409 }
    );
  }

  const commission = await lireCommission(supabase);
  const devis = calculerDevis(Number(vehicle.daily_price), totalDays, commission);

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      vehicle_id: vehicle.id,
      renter_id: user.id,
      owner_id: vehicle.owner_id,
      start_date: startDate,
      end_date: endDate,
      total_days: devis.totalDays,
      daily_price: Number(vehicle.daily_price),
      subtotal: devis.subtotal,
      service_fee: devis.serviceFee,
      deposit_amount: Number(vehicle.deposit_amount ?? 0),
      total_amount: devis.totalAmount,
      // `status` n'est pas transmis : un trigger le déduit du mode de
      // réservation du véhicule — `confirmee` en instantané, `en_attente` en
      // manuel. Le client ne peut donc pas forger une réservation déjà validée.
    })
    .select('id, status')
    .single();

  if (insertError || !booking) {
    return NextResponse.json(
      { error: `Réservation impossible : ${insertError?.message ?? 'erreur inconnue'}` },
      { status: 500 }
    );
  }

  // L'écran d'après diffère : en instantané il faut envoyer payer tout de
  // suite, en manuel il faut attendre la réponse du loueur.
  return NextResponse.json({
    bookingId: booking.id,
    confirmee: booking.status === 'confirmee',
  });
}
