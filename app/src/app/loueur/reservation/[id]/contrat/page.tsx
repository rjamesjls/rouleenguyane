import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ContratClient, { type DonneesContrat } from './ContratClient';

export const metadata: Metadata = { title: 'Contrat de location — JELOUE' };

/**
 * Établissement du contrat et de l'état des lieux.
 *
 * Le formulaire rempli ici EST le contrat : tout ce que la base connaît déjà
 * (locataire, véhicule, dates, prix) est prérempli, le loueur ne saisit que le
 * constat du jour. En Next 16, `params` est une Promise.
 */
export default async function ContratPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const etape = type === 'retour' ? 'retour' : 'depart';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/loueur/reservation/${id}/contrat`);

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, owner_id, renter_id, status, start_date, end_date, total_days,
      daily_price, subtotal, service_fee, deposit_amount, total_amount,
      vehicle:vehicles(id, title, brand, model, year, license_plate, category,
                       city, address, mileage_limit_per_day, transmission, fuel_type, seats),
      renter:profiles!bookings_renter_id_fkey(id, full_name, phone, city),
      owner:profiles!bookings_owner_id_fkey(id, full_name, phone, city, company_name),
      payments(kind, status),
      inspections(id, type, created_at, mileage)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  // La RLS laisse le locataire lire la réservation : on restreint ici, sinon
  // le client verrait le formulaire du loueur (qu'il ne pourrait pas soumettre).
  if (booking.owner_id !== user.id) notFound();

  return (
    <ContratClient
      donnees={booking as unknown as DonneesContrat}
      etape={etape}
    />
  );
}
