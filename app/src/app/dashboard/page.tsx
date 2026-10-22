import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { reconcilierPaiement } from '@/lib/stripe/reconcilier';
import type { Booking, Payment, Profile, Vehicle } from '@/types/db';
import DashboardClient from './DashboardClient';

/** Réservation telle que chargée ici, avec ses relations. */
export type BookingLigne = Booking & {
  vehicle: Vehicle | null;
  owner: Profile | null;
  payments: Payment[];
  reviews: { reviewer_id: string }[];
};

/**
 * Chargement des données côté serveur.
 *
 * Volontairement un Server Component : les réservations arrivent avec le HTML,
 * sans effet client, sans écran de chargement, et sans requête supplémentaire
 * depuis le navigateur.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string; tab?: string; session_id?: string }>;
}) {
  const { paiement, tab, session_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Le proxy protège déjà /dashboard ; cette garde couvre le cas d'une session
  // expirée entre la vérification du proxy et le rendu.
  if (!user) redirect('/auth/login?redirect=/dashboard');

  // Retour de Stripe Checkout : on relit l'état réel du paiement AVANT de
  // charger les réservations, sinon la page afficherait encore « Payer » le
  // temps que le webhook arrive — ou indéfiniment s'il est mal configuré.
  if (paiement === 'succes' && session_id) {
    await reconcilierPaiement(session_id);
  }

  const [bookingsResult, profileResult] = await Promise.all([
    supabase
      // `bookings` référence `profiles` deux fois (renter_id et owner_id) :
      // il faut nommer la contrainte pour lever l'ambiguïté de la jointure.
      // `payments` est joint car l'état du paiement n'est pas sur `bookings`.
      .from('bookings')
      .select('*, vehicle:vehicles(*), owner:profiles!bookings_owner_id_fkey(*), payments(*), reviews(reviewer_id)')
      .eq('renter_id', user.id)
      .order('start_date', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  return (
    <DashboardClient
      email={user.email ?? ''}
      profile={profileResult.data ?? null}
      bookings={(bookingsResult.data ?? []) as BookingLigne[]}
      loadError={bookingsResult.error?.message ?? null}
      paiement={paiement ?? null}
      ongletInitial={tab === 'profil' ? 'profil' : 'reservations'}
    />
  );
}
