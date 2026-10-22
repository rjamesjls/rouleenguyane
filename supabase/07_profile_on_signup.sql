-- ============================================================
-- 07 — Création automatique du profil à l'inscription
--
-- Contexte : `vehicles.owner_id`, `bookings.renter_id`, etc. référencent
-- `public.profiles(id)`. Or rien ne créait de ligne dans `profiles` après un
-- signup : l'utilisateur existait dans `auth.users` mais pas dans `profiles`,
-- et toute écriture échouait sur
--   « violates foreign key constraint "vehicles_owner_id_fkey" ».
--
-- Idempotent : réexécutable sans erreur.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fonction déclenchée à chaque nouvel utilisateur
--
-- SECURITY DEFINER est nécessaire : le trigger s'exécute dans le contexte de
-- `auth.users` et doit écrire dans `public.profiles` malgré la RLS.
-- `search_path` est figé (cf. migration 06_harden_functions).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city, type, siret)
  VALUES (
    NEW.id,
    -- full_name est NOT NULL : on retombe sur la partie locale de l'e-mail.
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(COALESCE(NEW.email, 'utilisateur@'), '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    -- `city` est la clé actuelle ; `preferred_city` couvre les comptes créés
    -- par l'ancienne version du formulaire d'inscription.
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'city', ''),
      NULLIF(NEW.raw_user_meta_data->>'preferred_city', '')
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'profile_type' = 'professionnel'
        OR NEW.raw_user_meta_data->>'role' = 'loueur_pro'
      THEN 'professionnel'::profile_type
      ELSE 'particulier'::profile_type
    END,
    NULLIF(NEW.raw_user_meta_data->>'siret', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Rattrapage des comptes déjà créés sans profil
-- ------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, phone, city, type, siret)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(u.email, 'utilisateur@'), '@', 1)
  ),
  NULLIF(u.raw_user_meta_data->>'phone', ''),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'city', ''),
    NULLIF(u.raw_user_meta_data->>'preferred_city', '')
  ),
  CASE
    WHEN u.raw_user_meta_data->>'profile_type' = 'professionnel'
      OR u.raw_user_meta_data->>'role' = 'loueur_pro'
    THEN 'professionnel'::profile_type
    ELSE 'particulier'::profile_type
  END,
  NULLIF(u.raw_user_meta_data->>'siret', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
