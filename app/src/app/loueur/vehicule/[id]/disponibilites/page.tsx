import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CalendrierClient, { type PeriodeReservee } from './CalendrierClient';

export const metadata: Metadata = { title: 'Disponibilités — JELOUE' };

/** Réservations qui bloquent réellement le véhicule. */
const STATUTS_BLOQUANTS = ['en_attente', 'confirmee', 'en_cours'] as const;

/** Calendrier de disponibilité d'un véhicule. En Next 16, `params` est une Promise. */
export default async function DisponibilitesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/loueur/vehicule/${id}/disponibilites`);

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, owner_id, title, brand, model, license_plate, booking_mode')
    .eq('id', id)
    .maybeSingle();

  if (!vehicle) notFound();
  // La RLS laisse lire tout véhicule en ligne : on restreint au propriétaire.
  if (vehicle.owner_id !== user.id) notFound();

  const [{ data: indispos }, { data: reservations }] = await Promise.all([
    // Seules les dates bloquées sont stockées : l'absence de ligne vaut
    // « disponible ». La table reste ainsi petite même sur plusieurs années.
    supabase
      .from('vehicle_availability')
      .select('date, reason')
      .eq('vehicle_id', id)
      .eq('is_available', false),
    supabase
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('vehicle_id', id)
      .in('status', STATUTS_BLOQUANTS),
  ]);

  return (
    <CalendrierClient
      vehicleId={vehicle.id}
      titre={`${vehicle.brand} ${vehicle.model}`}
      immatriculation={vehicle.license_plate}
      modeReservation={vehicle.booking_mode}
      datesBloquees={(indispos ?? []).map(l => l.date)}
      reservations={(reservations ?? []) as PeriodeReservee[]}
    />
  );
}
