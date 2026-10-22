import type { Tables, Enums } from './database';

/**
 * Types métier dérivés du schéma réel de la base.
 *
 * ⚠️ Ne pas confondre avec `./index.ts`, qui contient un modèle en français
 * (Reservation, Vehicle.marque…) hérité des maquettes et NON aligné sur la
 * base déployée. Tout code qui parle à Supabase doit utiliser CE fichier.
 */

export type Profile = Tables<'profiles'>;
export type Vehicle = Tables<'vehicles'>;
export type VehiclePhoto = Tables<'vehicle_photos'>;
export type Booking = Tables<'bookings'>;
export type Payment = Tables<'payments'>;
export type Review = Tables<'reviews'>;
export type Message = Tables<'messages'>;

export type BookingStatus = Enums<'booking_status'>;
export type PaymentStatus = Enums<'payment_status'>;
export type PaymentKind = Enums<'payment_kind'>;
export type PreauthStatus = Enums<'preauth_status'>;
export type VehicleCategory = Enums<'vehicle_category'>;
export type VehicleStatus = Enums<'vehicle_status'>;
export type DepositMode = Enums<'deposit_mode'>;
export type InspectionType = Enums<'inspection_type'>;
export type Inspection = Tables<'inspections'>;
export type InspectionPhoto = Tables<'inspection_photos'>;
export type BookingMode = Enums<'booking_mode'>;
export type ProfileType = Enums<'profile_type'>;
export type VerificationStatus = Enums<'verification_status'>;

/** Réservation avec ses relations, telle que chargée par le tableau de bord. */
export type BookingWithRelations = Booking & {
  vehicle: Vehicle | null;
  owner: Profile | null;
};

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  citadine: 'Citadine',
  berline: 'Berline',
  suv: 'SUV / 4x4',
  utilitaire: 'Utilitaire',
  moto: 'Moto',
  scooter: 'Scooter',
  autre: 'Autre',
};

export const CATEGORY_ICONS: Record<VehicleCategory, string> = {
  citadine: '🚗',
  berline: '🚘',
  suv: '🚙',
  utilitaire: '🚐',
  moto: '🏍️',
  scooter: '🛵',
  autre: '🚗',
};

/**
 * Couleurs proposées pour un véhicule.
 *
 * La colonne `vehicles.color` est un simple `text` : le vocabulaire vit ici,
 * pas en base, pour qu'ajouter une teinte ne demande pas de migration. `hex`
 * sert aux pastilles, `contour` marque les teintes claires qui disparaîtraient
 * sur fond blanc.
 */
export const VEHICLE_COLORS = {
  blanc:   { label: 'Blanc',   hex: '#FFFFFF', contour: true },
  gris:    { label: 'Gris',    hex: '#9CA3AF', contour: false },
  argent:  { label: 'Argent',  hex: '#D4D7DC', contour: true },
  noir:    { label: 'Noir',    hex: '#18181B', contour: false },
  rouge:   { label: 'Rouge',   hex: '#DC2626', contour: false },
  bleu:    { label: 'Bleu',    hex: '#2563EB', contour: false },
  vert:    { label: 'Vert',    hex: '#16A34A', contour: false },
  jaune:   { label: 'Jaune',   hex: '#FACC15', contour: true },
  orange:  { label: 'Orange',  hex: '#EA580C', contour: false },
  marron:  { label: 'Marron',  hex: '#78350F', contour: false },
  beige:   { label: 'Beige',   hex: '#E7D3B3', contour: true },
  autre:   { label: 'Autre',   hex: '#A78BFA', contour: false },
} as const;

export type VehicleColor = keyof typeof VEHICLE_COLORS;

export const VEHICLE_COLOR_KEYS = Object.keys(VEHICLE_COLORS) as VehicleColor[];

/**
 * Décrit une couleur stockée en base.
 *
 * `color` est du texte libre côté base : une valeur inconnue (ancienne donnée,
 * import) ne doit pas casser l'affichage. On retombe alors sur une pastille
 * neutre portant la valeur brute.
 */
export function decrireCouleur(color: string | null | undefined) {
  if (!color) return null;
  const connue = VEHICLE_COLORS[color as VehicleColor];
  return connue ?? { label: color, hex: '#A1A1AA', contour: false };
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  brouillon: 'Hors ligne',
  en_ligne: 'En ligne',
  suspendu: 'Suspendu',
  archive: 'Archivé',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  refusee: 'Refusée',
  annulee: 'Annulée',
  en_cours: 'En cours',
  terminee: 'Terminée',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  en_attente: '#F59E0B',
  confirmee: '#10B981',
  refusee: '#EF4444',
  annulee: '#9CA3AF',
  en_cours: '#3B82F6',
  terminee: '#6B7280',
};
