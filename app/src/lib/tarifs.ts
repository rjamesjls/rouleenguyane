import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface Commission {
  percent: number;
  minEur: number;
}

/** Valeurs de repli si `platform_settings` est injoignable. */
const COMMISSION_DEFAUT: Commission = { percent: 15, minEur: 2 };

/**
 * Lit la commission depuis `platform_settings` (clés `commission_percent` et
 * `commission_min_eur`). Elle est configurable en base : ne jamais la coder en dur.
 */
export async function lireCommission(
  supabase: SupabaseClient<Database>
): Promise<Commission> {
  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['commission_percent', 'commission_min_eur']);

  if (!data) return COMMISSION_DEFAUT;

  const trouver = (cle: string, defaut: number) => {
    const brut = data.find(l => l.key === cle)?.value;
    const nombre = typeof brut === 'number' ? brut : Number(brut);
    return Number.isFinite(nombre) ? nombre : defaut;
  };

  return {
    percent: trouver('commission_percent', COMMISSION_DEFAUT.percent),
    minEur: trouver('commission_min_eur', COMMISSION_DEFAUT.minEur),
  };
}

export interface Devis {
  totalDays: number;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
}

/** Arrondi au centime, pour rester cohérent avec les DECIMAL(10,2) en base. */
const auCentime = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcule le devis d'une réservation.
 *
 * Utilisé côté serveur pour ce qui est écrit en base, et côté client pour
 * l'aperçu : la même fonction des deux côtés évite tout écart d'affichage.
 */
export function calculerDevis(
  dailyPrice: number,
  totalDays: number,
  commission: Commission
): Devis {
  const subtotal = auCentime(dailyPrice * totalDays);
  const serviceFee = auCentime(
    Math.max(subtotal * (commission.percent / 100), commission.minEur)
  );
  return {
    totalDays,
    subtotal,
    serviceFee,
    totalAmount: auCentime(subtotal + serviceFee),
  };
}

/** Nombre de jours entre deux dates ISO (yyyy-mm-dd). */
export function compterJours(debut: string, fin: string): number {
  const d1 = new Date(`${debut}T00:00:00Z`).getTime();
  const d2 = new Date(`${fin}T00:00:00Z`).getTime();
  return Math.round((d2 - d1) / 86_400_000);
}
