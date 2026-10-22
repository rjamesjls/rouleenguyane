import { createClient } from '@/lib/supabase/server';
import type { VehiculeCarte } from '@/components/vehicles/VehicleCard';
import CatalogueClient from './CatalogueClient';

/**
 * Catalogue public.
 *
 * La RLS n'expose que les véhicules `en_ligne` (plus les siens), donc aucune
 * garde supplémentaire n'est nécessaire ici. Le volume attendu au lancement
 * reste faible : on charge la liste et on filtre côté client, ce qui garde
 * les filtres instantanés.
 */
export default async function CataloguePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_photos(url, position), owner:profiles!vehicles_owner_id_fkey(full_name, avatar_url, average_rating, verification_status)')
    .eq('status', 'en_ligne')
    .order('created_at', { ascending: false });

  return (
    <CatalogueClient
      vehicles={(data ?? []) as VehiculeCarte[]}
      loadError={error?.message ?? null}
    />
  );
}
