import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VehicleForm, { type VehiculeAModifier } from '../../VehicleForm';

/** Modification d'un véhicule existant. En Next 16, `params` est une Promise. */
export default async function ModifierVehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/loueur/vehicule/${id}/modifier`);

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*, vehicle_photos(id, url, position)')
    .eq('id', id)
    .maybeSingle();

  if (!vehicle) notFound();

  // La RLS empêche déjà d'écrire sur le véhicule d'autrui, mais elle laisse
  // LIRE tout véhicule en ligne : sans ce contrôle, on afficherait à un tiers
  // un formulaire prérempli (dont l'immatriculation) qu'il ne peut pas soumettre.
  if (vehicle.owner_id !== user.id) notFound();

  return <VehicleForm vehicle={vehicle as VehiculeAModifier} />;
}
