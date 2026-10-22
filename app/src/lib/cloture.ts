import { createAdminClient } from '@/lib/supabase/admin';

/** Délai après la date de fin avant clôture d'office. */
const DELAI_HEURES = 48;

/**
 * Clôture les locations laissées en cours faute d'état des lieux de retour.
 *
 * Appelée à l'ouverture des tableaux de bord plutôt que par une tâche planifiée :
 * l'hébergement ne fournit pas d'ordonnanceur, et une location expirée n'a
 * d'importance qu'au moment où quelqu'un la regarde. L'opération est
 * idempotente — la fonction SQL ne retient que les locations réellement
 * expirées et dépourvues d'état des lieux de retour.
 *
 * Silencieuse en cas d'échec : ce n'est pas parce que la clôture échoue que le
 * tableau de bord doit refuser de s'afficher.
 */
export async function cloturerLocationsExpirees(): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc('cloturer_locations_expirees', { delai_heures: DELAI_HEURES });
  } catch (e) {
    console.error('[cloture] locations expirées non traitées', e);
  }
}
