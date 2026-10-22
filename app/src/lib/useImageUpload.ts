'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

export const TYPES_IMAGE_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

interface Options {
  userId: string;
  /** Bucket de stockage — `avatars` ou `covers`. */
  bucket: string;
  /** Colonne de `profiles` qui porte l'URL publique. */
  colonne: 'avatar_url' | 'cover_url';
  /** Préfixe du nom de fichier, pour distinguer les images d'un même dossier. */
  prefixe: string;
  /** Taille maximale, alignée sur `file_size_limit` du bucket. */
  maxOctets: number;
  /** URL actuellement enregistrée, ou null. */
  urlActuelle: string | null;
}

/**
 * Chargement d'une image de profil (avatar ou couverture).
 *
 * Mutualise ce que les deux ont en commun : validation, aperçu local, envoi,
 * mise à jour du profil et nettoyage de l'ancien fichier. Seuls le bucket, la
 * colonne et les limites changent.
 */
export function useImageUpload({
  userId, bucket, colonne, prefixe, maxOctets, urlActuelle,
}: Options) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { refreshProfile } = useAuth();

  const [apercu, setApercu] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // L'URL blob de l'aperçu fuit si elle n'est pas révoquée au démontage.
  const apercuRef = useRef<string | null>(null);
  useEffect(() => { apercuRef.current = apercu; }, [apercu]);
  useEffect(() => {
    return () => { if (apercuRef.current) URL.revokeObjectURL(apercuRef.current); };
  }, []);

  /**
   * Construit la mise à jour du profil.
   *
   * Une clé calculée (`{ [colonne]: valeur }`) est rejetée par les types
   * générés de Supabase : on énumère explicitement plutôt que de forcer un
   * cast, ce qui garde la vérification de type sur les deux colonnes.
   */
  const majProfil = (valeur: string | null) =>
    colonne === 'avatar_url' ? { avatar_url: valeur } : { cover_url: valeur };

  /** Retrouve le chemin de stockage à partir d'une URL publique. */
  const cheminDepuisUrl = (url: string): string | null => {
    const marqueur = `/${bucket}/`;
    const i = url.indexOf(marqueur);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marqueur.length));
  };

  const charger = async (fichier: File) => {
    setError(null);
    setMessage(null);

    if (!TYPES_IMAGE_ACCEPTES.includes(fichier.type)) {
      setError('Format non accepté — utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (fichier.size > maxOctets) {
      const maxMo = Math.round(maxOctets / 1024 / 1024);
      setError(`Image trop lourde (${(fichier.size / 1024 / 1024).toFixed(1)} Mo) — ${maxMo} Mo maximum.`);
      return;
    }

    // Aperçu immédiat : l'envoi peut être long sur une connexion lente.
    if (apercu) URL.revokeObjectURL(apercu);
    setApercu(URL.createObjectURL(fichier));
    setEnCours(true);

    const extension = fichier.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Horodatage dans le nom : une URL publique est mise en cache par le
    // navigateur, un nom fixe afficherait encore l'ancienne image.
    const chemin = `${userId}/${prefixe}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(chemin, fichier, { contentType: fichier.type });

    if (uploadError) {
      setError(`Envoi impossible : ${uploadError.message}`);
      setEnCours(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(chemin);

    const { error: profilError } = await supabase
      .from('profiles')
      .update(majProfil(publicUrl))
      .eq('id', userId);

    if (profilError) {
      // Le fichier est en ligne mais le profil ne pointe pas dessus : on le
      // retire pour ne pas laisser d'orphelin invisible.
      await supabase.storage.from(bucket).remove([chemin]);
      setError(`Profil non mis à jour : ${profilError.message}`);
      setEnCours(false);
      return;
    }

    // Ancienne image devenue inutile — best effort, son échec est sans impact.
    if (urlActuelle) {
      const ancien = cheminDepuisUrl(urlActuelle);
      if (ancien) await supabase.storage.from(bucket).remove([ancien]);
    }

    setMessage('Image mise à jour.');
    setEnCours(false);
    await refreshProfile();
    router.refresh();
  };

  const retirer = async (confirmation: string) => {
    if (!urlActuelle) return;
    if (!window.confirm(confirmation)) return;

    setError(null);
    setMessage(null);
    setEnCours(true);

    const { error: profilError } = await supabase
      .from('profiles')
      .update(majProfil(null))
      .eq('id', userId);

    if (profilError) {
      setError(`Retrait impossible : ${profilError.message}`);
      setEnCours(false);
      return;
    }

    const ancien = cheminDepuisUrl(urlActuelle);
    if (ancien) await supabase.storage.from(bucket).remove([ancien]);

    if (apercu) {
      URL.revokeObjectURL(apercu);
      setApercu(null);
    }
    setMessage('Image retirée.');
    setEnCours(false);
    await refreshProfile();
    router.refresh();
  };

  return { charger, retirer, apercu, enCours, error, message };
}
