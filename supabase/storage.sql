-- ============================================================
-- STORAGE : photos de véhicules
-- À exécuter dans le SQL Editor Supabase, après schema.sql.
-- Idempotent : réexécutable sans erreur.
-- ============================================================

-- Bucket public : les annonces sont consultables sans compte.
-- Limite 5 Mo/fichier, images uniquement (défense côté serveur, en plus
-- de la validation faite dans le formulaire).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos',
  'vehicle-photos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public = EXCLUDED.public;

-- ============================================================
-- Politiques d'accès
--
-- Convention de chemin : {owner_id}/{vehicle_id}/{fichier}
-- Le premier segment est l'UUID du propriétaire : c'est lui qui sert de
-- contrôle d'accès en écriture via storage.foldername(name).
-- ============================================================

DROP POLICY IF EXISTS "storage_vehicle_photos_read" ON storage.objects;
CREATE POLICY "storage_vehicle_photos_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehicle-photos');

DROP POLICY IF EXISTS "storage_vehicle_photos_insert" ON storage.objects;
CREATE POLICY "storage_vehicle_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_vehicle_photos_update" ON storage.objects;
CREATE POLICY "storage_vehicle_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_vehicle_photos_delete" ON storage.objects;
CREATE POLICY "storage_vehicle_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
