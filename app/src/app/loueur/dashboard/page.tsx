import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cloturerLocationsExpirees } from '@/lib/cloture';
import type { Booking, Payment, Profile, Vehicle, VehiclePhoto } from '@/types/db';
import LoueurDashboardClient from './LoueurDashboardClient';

export type VehiculeLigne = Vehicle & {
  vehicle_photos: Pick<VehiclePhoto, 'url' | 'position'>[];
};

export type ReservationLigne = Booking & {
  vehicle: Vehicle | null;
  renter: Profile | null;
  payments: Payment[];
};

/** Espace loueur : véhicules publiés et demandes de réservation reçues. */
export default async function LoueurDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; updated?: string; photos?: string }>;
}) {
  const { added, updated, photos } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/loueur/dashboard');

  // Faute d'ordonnanceur, la clôture d'office des locations expirées se
  // déclenche à l'ouverture du tableau de bord.
  await cloturerLocationsExpirees();

  const [vehiclesResult, bookingsResult, profileResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, vehicle_photos(url, position)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      // `bookings` référence `profiles` deux fois : la contrainte doit être
      // nommée pour lever l'ambiguïté.
      .from('bookings')
      .select('*, vehicle:vehicles(*), renter:profiles!bookings_renter_id_fkey(*), payments(*)')
      .eq('owner_id', user.id)
      .order('start_date', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  return (
    <LoueurDashboardClient
      profile={profileResult.data ?? null}
      vehicles={(vehiclesResult.data ?? []) as VehiculeLigne[]}
      bookings={(bookingsResult.data ?? []) as ReservationLigne[]}
      loadError={vehiclesResult.error?.message ?? bookingsResult.error?.message ?? null}
      vientDePublier={added === '1'}
      vientDeModifier={updated === '1'}
      photosEnEchec={photos === 'erreur'}
    />
  );
}
