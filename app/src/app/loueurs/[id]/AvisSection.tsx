'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateShort } from '@/lib/utils';
import { postJson } from '@/lib/postJson';
import styles from './page.module.css';

export interface Avis {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string; avatar_url: string | null } | null;
}

export interface LocationANoter {
  id: string;
  start_date: string;
  end_date: string;
  vehicle: { brand: string; model: string } | null;
}

interface Props {
  avis: Avis[];
  noteMoyenne: number | null;
  aNoter: LocationANoter[];
  connecte: boolean;
  estSonPropreProfil: boolean;
  nomLoueur: string;
}

/** Étoiles en lecture seule. */
function Etoiles({ note }: { note: number }) {
  return (
    <span className={styles.stars} aria-label={`${note} sur 5`}>
      {'★'.repeat(note)}
      <span className={styles.starsVides}>{'★'.repeat(5 - note)}</span>
    </span>
  );
}

export default function AvisSection({
  avis, noteMoyenne, aNoter, connecte, estSonPropreProfil, nomLoueur,
}: Props) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState(aNoter[0]?.id ?? '');
  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const envoyer = async () => {
    if (note < 1) {
      setError('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    setEnvoi(true);
    setError(null);

    const res = await postJson('/api/reviews', {
      bookingId,
      rating: note,
      comment: commentaire,
    });

    if (!res.ok) {
      setError(res.error);
    } else {
      setSucces(true);
      setNote(0);
      setCommentaire('');
      router.refresh();
    }
    setEnvoi(false);
  };

  /** Répartition des notes, pour la barre 5★ → 1★. */
  const repartition = [5, 4, 3, 2, 1].map(n => ({
    n,
    nombre: avis.filter(a => a.rating === n).length,
  }));

  return (
    <section id="avis" className={styles.section}>
      <div className={styles.sectionEntete}>
        <h2 className={styles.sectionTitle}>Avis clients</h2>
        <span className={styles.sectionBadge}>{avis.length}</span>
      </div>

      {avis.length > 0 && (
        <div className={styles.resumeNotes}>
          <div className={styles.resumeGlobal}>
            <p className={styles.resumeNote}>{noteMoyenne!.toFixed(1)}</p>
            <Etoiles note={Math.round(noteMoyenne!)} />
            <p className={styles.resumeCount}>
              Sur {avis.length} avis vérifié{avis.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className={styles.resumeBarres}>
            {repartition.map(r => (
              <div key={r.n} className={styles.barreLigne}>
                <span className={styles.barreLabel}>{r.n} ★</span>
                <div className={styles.barreFond}>
                  <div
                    className={styles.barreRemplie}
                    style={{ width: avis.length ? `${(r.nombre / avis.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className={styles.barreCount}>{r.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire d'avis */}
      {succes ? (
        <div className={styles.formAvis} style={{ borderLeft: '4px solid #10B981' }}>
          ✅ Merci, votre avis a été publié.
        </div>
      ) : estSonPropreProfil ? null : aNoter.length > 0 ? (
        <div className={styles.formAvis}>
          <h3>Noter {nomLoueur}</h3>

          {aNoter.length > 1 && (
            <div className="form-group">
              <label className="form-label">Location concernée</label>
              <select className="form-select" value={bookingId} onChange={e => setBookingId(e.target.value)}>
                {aNoter.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.vehicle ? `${l.vehicle.brand} ${l.vehicle.model}` : 'Véhicule'}
                    {' — '}{formatDateShort(l.start_date)} au {formatDateShort(l.end_date)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Votre note</label>
            <div className={styles.etoilesSaisie} onMouseLeave={() => setSurvol(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.etoileBtn} ${(survol || note) >= n ? styles.etoileActive : ''}`}
                  onClick={() => setNote(n)}
                  onMouseEnter={() => setSurvol(n)}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  aria-pressed={note === n}
                >
                  ★
                </button>
              ))}
              {note > 0 && <span className={styles.noteChoisie}>{note}/5</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Votre commentaire (facultatif)</label>
            <textarea
              className="form-textarea"
              placeholder="État du véhicule, ponctualité, accueil…"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              maxLength={1000}
              style={{ minHeight: 90 }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary" onClick={envoyer} disabled={envoi}>
            {envoi ? 'Publication…' : 'Publier mon avis'}
          </button>
        </div>
      ) : (
        <div className={styles.formAvis}>
          <p className={styles.noteInfo}>
            {!connecte
              ? <>Seuls les clients ayant loué chez ce loueur peuvent laisser un avis.{' '}
                  <Link href="/auth/login">Se connecter</Link></>
              : 'Vous pourrez laisser un avis une fois une location terminée chez ce loueur.'}
          </p>
        </div>
      )}

      {/* Liste des avis */}
      {avis.length === 0 ? (
        <div className={styles.videCarte}>
          <div className={styles.videIcone}>💬</div>
          <h3>Aucun avis pour le moment</h3>
          <p>Les avis apparaîtront après les premières locations terminées.</p>
        </div>
      ) : (
        <div className={styles.avisListe}>
          {avis.map(a => (
            <div key={a.id} className={styles.avisItem}>
              <div className={styles.avisEntete}>
                <div className="avatar avatar-sm">
                  {a.reviewer?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.reviewer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (a.reviewer?.full_name ?? '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className={styles.avisAuteur}>{a.reviewer?.full_name ?? 'Client'}</p>
                  <div className={styles.avisMeta}>
                    <Etoiles note={a.rating} />
                    <span>{formatDateShort(a.created_at)}</span>
                  </div>
                </div>
              </div>
              {a.comment && <p className={styles.avisTexte}>{a.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
