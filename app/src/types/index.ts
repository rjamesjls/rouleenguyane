export type UserRole = 'client' | 'loueur_particulier' | 'loueur_pro' | 'admin';
export type VehicleType = 'voiture' | 'moto' | 'scooter' | 'utilitaire' | '4x4' | 'minibus';
export type ReservationStatus = 'en_attente' | 'confirmee' | 'refusee' | 'annulee' | 'en_cours' | 'terminee' | 'litige';
export type PaymentMode = 'especes' | 'virement' | 'stripe';
export type ReviewType = 'client_to_loueur' | 'loueur_to_client';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  siret?: string;
  is_verified: boolean;
  is_identity_verified: boolean;
  identity_doc_url?: string;
  driving_license_url?: string;
  preferred_city?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  loueur_id: string;
  type: VehicleType;
  marque: string;
  modele: string;
  annee: number;
  couleur?: string;
  immatriculation?: string;
  nb_places: number;
  nb_portes: number;
  boite_vitesse: 'manuelle' | 'automatique';
  carburant: 'essence' | 'diesel' | 'electrique' | 'hybride';
  climatisation: boolean;
  gps: boolean;
  prix_jour: number;
  caution: number;
  km_inclus: number;
  km_supplementaire: number;
  ville: string;
  adresse_prise_en_charge?: string;
  description?: string;
  conditions?: string;
  is_active: boolean;
  is_available: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  loueur?: Profile;
  vehicle_photos?: VehiclePhoto[];
  reviews?: Review[];
  avg_rating?: number;
}

export interface VehiclePhoto {
  id: string;
  vehicle_id: string;
  url: string;
  is_primary: boolean;
  ordre: number;
  created_at: string;
}

export interface VehicleAvailability {
  id: string;
  vehicle_id: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  reservation_id?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  client_id: string;
  vehicle_id: string;
  loueur_id: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  prix_jour: number;
  prix_sous_total: number;
  frais_service: number;
  caution: number;
  prix_total: number;
  statut: ReservationStatus;
  lieu_prise_en_charge?: string;
  mode_paiement: PaymentMode;
  paiement_confirme: boolean;
  caution_libere: boolean;
  notes_client?: string;
  notes_loueur?: string;
  motif_refus?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Profile;
  loueur?: Profile;
  vehicle?: Vehicle;
}

export interface Review {
  id: string;
  reservation_id: string;
  auteur_id: string;
  cible_id?: string;
  vehicle_id?: string;
  note: number;
  commentaire?: string;
  type: ReviewType;
  created_at: string;
  auteur?: Profile;
}

export interface Message {
  id: string;
  reservation_id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  lien?: string;
  lu: boolean;
  created_at: string;
}

export interface SearchFilters {
  ville?: string;
  date_debut?: string;
  date_fin?: string;
  type?: VehicleType | '';
  prix_max?: number;
  nb_places_min?: number;
  boite_vitesse?: 'manuelle' | 'automatique' | '';
  carburant?: string;
}

export const VILLES_GUYANE = [
  'Cayenne',
  'Kourou',
  'Saint-Laurent-du-Maroni',
  'Matoury',
  'Rémire-Montjoly',
  'Macouria',
  'Sinnamary',
  'Saint-Georges',
  'Maripasoula',
  'Grand-Santi',
  'Apatou',
  'Papaïchton',
];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  voiture: 'Voiture',
  moto: 'Moto',
  scooter: 'Scooter',
  utilitaire: 'Utilitaire',
  '4x4': '4x4',
  minibus: 'Minibus',
};

export const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  voiture: '🚗',
  moto: '🏍️',
  scooter: '🛵',
  utilitaire: '🚐',
  '4x4': '🚙',
  minibus: '🚌',
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  refusee: 'Refusée',
  annulee: 'Annulée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  litige: 'Litige',
};

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  en_attente: 'var(--warning)',
  confirmee: 'var(--success)',
  refusee: 'var(--danger)',
  annulee: 'var(--muted)',
  en_cours: 'var(--primary)',
  terminee: 'var(--secondary)',
  litige: 'var(--danger)',
};

export const FRAIS_SERVICE_PERCENT = 0.10; // 10% de commission
