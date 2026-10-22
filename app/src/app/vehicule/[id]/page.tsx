import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { lireCommission } from '@/lib/tarifs';
import type { Profile, Vehicle, VehiclePhoto } from '@/types/db';
import VehicleDetailClient from './VehicleDetailClient';

export type VehiculeDetail = Vehicle & {
  vehicle_photos: Pick<VehiclePhoto, 'id' | 'url' | 'position'>[];
  // Pas de `phone` : le téléphone du loueur n'est plus affiché, donc plus
  // envoyé au navigateur. Les échanges passeront par la messagerie interne.
  owner: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'type'
    | 'verification_status' | 'average_rating'> | null;
};

/** Fiche véhicule. En Next 16, `params` est une Promise. */
export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: vehicle }, commission, { data: { user } }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, vehicle_photos(id, url, position), owner:profiles!vehicles_owner_id_fkey(id, full_name, avatar_url, type, verification_status, average_rating)')
      .eq('id', id)
      .maybeSingle(),
    lireCommission(supabase),
    supabase.auth.getUser(),
  ]);

  // La RLS masque les véhicules qui ne sont pas en ligne (sauf au propriétaire) :
  // un véhicule absent et un véhicule non publié donnent tous deux un 404.
  if (!vehicle) notFound();

  // Dates déjà réservées ou bloquées par le propriétaire, sur un an.
  // Passe par une fonction SECURITY DEFINER : la RLS masque au visiteur les
  // réservations des autres locataires, il ne verrait donc presque rien.
  // Les bornes sont calculées en base — appeler `new Date()` pendant le rendu
  // est une fonction impure que le compilateur React rejette.
  const { data: indispos } = await supabase.rpc('dates_indisponibles', {
    p_vehicle: id,
  });

  return (
    <VehicleDetailClient
      vehicle={vehicle as VehiculeDetail}
      commission={commission}
      connecte={Boolean(user)}
      estProprietaire={user?.id === vehicle.owner_id}
      datesIndisponibles={(indispos ?? []).map(l => l.jour)}
    />
  );
}
