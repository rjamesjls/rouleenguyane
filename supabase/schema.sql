-- ============================================================
-- ⛔ OBSOLÈTE — NE PAS EXÉCUTER, NE PAS S'Y FIER
--
-- Brouillon du 11 mai, JAMAIS appliqué à la base.
-- Le schéma réellement déployé est différent : tables en anglais,
-- `bookings` + `payments` au lieu de `reservations`, enums Postgres.
-- Il provient des migrations 20260726101509 → 20260726101638.
--
-- Référence faisant foi : app/src/types/database.ts
--   (régénérable via `npm run db:types`)
--
-- Conservé uniquement comme trace de la modélisation initiale.
-- ============================================================

-- ============================================================
-- JELOUE — Schéma PostgreSQL complet (brouillon initial)
-- Plateforme de location de véhicules en Guyane française
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Étend auth.users de Supabase
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'loueur_particulier', 'loueur_pro', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  siret TEXT, -- Pour loueurs professionnels
  is_verified BOOLEAN DEFAULT FALSE,
  is_identity_verified BOOLEAN DEFAULT FALSE,
  identity_doc_url TEXT,
  driving_license_url TEXT,
  preferred_city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: vehicles
-- Véhicules mis en location
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  loueur_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('voiture', 'moto', 'scooter', 'utilitaire', '4x4', 'minibus')),
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER NOT NULL CHECK (annee >= 1990 AND annee <= 2026),
  couleur TEXT,
  immatriculation TEXT,
  nb_places INTEGER DEFAULT 5,
  nb_portes INTEGER DEFAULT 4,
  boite_vitesse TEXT DEFAULT 'automatique' CHECK (boite_vitesse IN ('manuelle', 'automatique')),
  carburant TEXT DEFAULT 'essence' CHECK (carburant IN ('essence', 'diesel', 'electrique', 'hybride')),
  climatisation BOOLEAN DEFAULT TRUE,
  gps BOOLEAN DEFAULT FALSE,
  prix_jour DECIMAL(10,2) NOT NULL CHECK (prix_jour > 0),
  caution DECIMAL(10,2) DEFAULT 0 CHECK (caution >= 0),
  km_inclus INTEGER DEFAULT 300, -- km inclus par jour
  km_supplementaire DECIMAL(5,2) DEFAULT 0.30, -- €/km au-delà
  ville TEXT NOT NULL,
  adresse_prise_en_charge TEXT,
  description TEXT,
  conditions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: vehicle_photos
-- Photos des véhicules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: vehicle_availability
-- Périodes d'indisponibilité des véhicules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  motif TEXT DEFAULT 'maintenance', -- maintenance, reservation, personnel
  reservation_id UUID, -- Lié si c'est une réservation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (date_fin >= date_debut)
);

-- ============================================================
-- TABLE: reservations
-- Réservations de véhicules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  loueur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nb_jours INTEGER GENERATED ALWAYS AS (date_fin - date_debut) STORED,
  prix_jour DECIMAL(10,2) NOT NULL,
  prix_sous_total DECIMAL(10,2) NOT NULL, -- prix_jour * nb_jours
  frais_service DECIMAL(10,2) DEFAULT 0, -- Commission JELOUE
  caution DECIMAL(10,2) DEFAULT 0,
  prix_total DECIMAL(10,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente', 'confirmee', 'refusee', 'annulee',
    'en_cours', 'terminee', 'litige'
  )),
  lieu_prise_en_charge TEXT,
  mode_paiement TEXT DEFAULT 'especes' CHECK (mode_paiement IN ('especes', 'virement', 'stripe')),
  paiement_confirme BOOLEAN DEFAULT FALSE,
  caution_libere BOOLEAN DEFAULT FALSE,
  notes_client TEXT,
  notes_loueur TEXT,
  motif_refus TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (date_fin > date_debut)
);

-- Lier vehicle_availability à reservations
ALTER TABLE public.vehicle_availability
  ADD CONSTRAINT fk_reservation
  FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
  ON DELETE SET NULL;

-- ============================================================
-- TABLE: reviews
-- Avis et notations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  auteur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  note INTEGER NOT NULL CHECK (note >= 1 AND note <= 5),
  commentaire TEXT,
  type TEXT NOT NULL CHECK (type IN ('client_to_loueur', 'loueur_to_client')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: messages
-- Messagerie in-app
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  expediteur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  destinataire_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- Notifications in-app
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  lien TEXT,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicles
CREATE POLICY "vehicles_public_read" ON public.vehicles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "vehicles_loueur_all" ON public.vehicles FOR ALL USING (auth.uid() = loueur_id);
CREATE POLICY "vehicles_admin_all" ON public.vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Vehicle photos
CREATE POLICY "vehicle_photos_public_read" ON public.vehicle_photos FOR SELECT USING (TRUE);
CREATE POLICY "vehicle_photos_loueur_all" ON public.vehicle_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE id = vehicle_id AND loueur_id = auth.uid())
);

-- Vehicle availability
CREATE POLICY "vehicle_availability_public_read" ON public.vehicle_availability FOR SELECT USING (TRUE);
CREATE POLICY "vehicle_availability_loueur_all" ON public.vehicle_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE id = vehicle_id AND loueur_id = auth.uid())
);

-- Reservations
CREATE POLICY "reservations_client_read" ON public.reservations FOR SELECT USING (auth.uid() = client_id OR auth.uid() = loueur_id);
CREATE POLICY "reservations_client_insert" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "reservations_loueur_update" ON public.reservations FOR UPDATE USING (auth.uid() = loueur_id OR auth.uid() = client_id);
CREATE POLICY "reservations_admin_all" ON public.reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_author_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = auteur_id);

-- Messages
CREATE POLICY "messages_participants_read" ON public.messages FOR SELECT USING (auth.uid() = expediteur_id OR auth.uid() = destinataire_id);
CREATE POLICY "messages_sender_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = expediteur_id);

-- Notifications
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Créer automatiquement le profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mise à jour du timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DONNÉES DE TEST (Seed)
-- ============================================================
-- À exécuter séparément après avoir créé un compte admin
-- Les UUIDs seront à remplacer par de vrais IDs auth

-- Villes disponibles en Guyane
COMMENT ON COLUMN public.vehicles.ville IS 'Cayenne, Kourou, Saint-Laurent-du-Maroni, Matoury, Rémire-Montjoly, Macouria, Sinnamary, Saint-Georges, Maripasoula';
