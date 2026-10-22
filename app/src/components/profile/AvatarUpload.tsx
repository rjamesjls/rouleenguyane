'use client';
import { useRef } from 'react';
import { useImageUpload, TYPES_IMAGE_ACCEPTES } from '@/lib/useImageUpload';
import styles from './AvatarUpload.module.css';

const MAX_OCTETS = 2 * 1024 * 1024; // aligné sur file_size_limit du bucket

interface Props {
  userId: string;
  /** URL actuelle, ou null si aucune photo n'a encore été chargée. */
  avatarUrl: string | null;
  /** Initiale affichée en l'absence de photo. */
  initiale: string;
}

/** Chargement de la photo de profil. */
export default function AvatarUpload({ userId, avatarUrl, initiale }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { charger, retirer, apercu, enCours, error, message } = useImageUpload({
    userId,
    bucket: 'avatars',
    colonne: 'avatar_url',
    prefixe: 'avatar',
    maxOctets: MAX_OCTETS,
    urlActuelle: avatarUrl,
  });

  const affichee = apercu ?? avatarUrl;

  return (
    <div className={styles.bloc}>
      <div className={styles.apercuZone}>
        <div className={`avatar avatar-lg ${styles.apercu} ${enCours ? styles.apercuEnCours : ''}`}>
          {affichee ? (
            // Fichier local ou Supabase Storage : next/image demanderait une
            // configuration de domaine distante, non mise en place ici.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={affichee} alt="Votre photo de profil" />
          ) : (
            initiale
          )}
        </div>
        {enCours && <span className={styles.spinner} aria-live="polite">⏳</span>}
      </div>

      <div className={styles.actions}>
        <input
          ref={inputRef}
          type="file"
          accept={TYPES_IMAGE_ACCEPTES.join(',')}
          hidden
          onChange={e => {
            const fichier = e.target.files?.[0];
            // Permet de resélectionner le même fichier après un retrait.
            e.target.value = '';
            if (fichier) charger(fichier);
          }}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={enCours}
        >
          {enCours ? 'Envoi…' : avatarUrl ? '🔄 Changer la photo' : '📷 Ajouter une photo'}
        </button>
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => retirer('Retirer votre photo de profil ?')}
            disabled={enCours}
          >
            Retirer
          </button>
        )}
        <p className="form-hint">JPEG, PNG ou WebP — 2 Mo maximum.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className={styles.succes} role="status">{message}</p>}
      </div>
    </div>
  );
}
