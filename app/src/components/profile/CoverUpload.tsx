'use client';
import { useRef } from 'react';
import { useImageUpload, TYPES_IMAGE_ACCEPTES } from '@/lib/useImageUpload';
import styles from './CoverUpload.module.css';

const MAX_OCTETS = 5 * 1024 * 1024; // aligné sur file_size_limit du bucket

interface Props {
  userId: string;
  /** URL actuelle, ou null : la page publique retombe alors sur le dégradé. */
  coverUrl: string | null;
}

/**
 * Chargement de la photo de couverture du profil public.
 *
 * L'aperçu reprend le format réel du bandeau — large et court — pour que le
 * cadrage vu ici corresponde à celui de la page publique.
 */
export default function CoverUpload({ userId, coverUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { charger, retirer, apercu, enCours, error, message } = useImageUpload({
    userId,
    bucket: 'covers',
    colonne: 'cover_url',
    prefixe: 'cover',
    maxOctets: MAX_OCTETS,
    urlActuelle: coverUrl,
  });

  const affichee = apercu ?? coverUrl;

  return (
    <div>
      <div className={`${styles.apercu} ${enCours ? styles.apercuEnCours : ''}`}>
        {affichee ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={affichee} alt="Votre photo de couverture" />
        ) : (
          <div className={styles.degrade}>
            <span className={styles.degradeTexte}>Dégradé par défaut</span>
          </div>
        )}
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
          {enCours ? 'Envoi…' : coverUrl ? '🔄 Changer la couverture' : '🖼️ Ajouter une couverture'}
        </button>
        {coverUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => retirer('Retirer votre photo de couverture ? Le dégradé par défaut reprendra sa place.')}
            disabled={enCours}
          >
            Retirer
          </button>
        )}
        <p className="form-hint">
          JPEG, PNG ou WebP — 5 Mo maximum. Une image large (1600 × 400 environ)
          donne le meilleur rendu ; le centre reste visible à toutes les tailles.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className={styles.succes} role="status">{message}</p>}
      </div>
    </div>
  );
}
