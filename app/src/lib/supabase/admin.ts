import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Client Supabase à privilèges service-role : IL CONTOURNE LES RLS.
 *
 * Réservé aux contextes serveur sans session utilisateur — typiquement le
 * webhook Stripe, qui doit confirmer un paiement alors qu'aucun utilisateur
 * n'est authentifié sur la requête.
 *
 * Ne jamais l'importer depuis un composant client ni l'exposer à une route
 * dont l'appelant n'est pas vérifié.
 */
let adminInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (adminInstance) return adminInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises pour le client admin.'
    );
  }

  adminInstance = createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminInstance;
}
