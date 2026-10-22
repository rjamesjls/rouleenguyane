'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export interface PeriodeReservee {
  start_date: string;
  end_date: string;
  status: string;
}

interface Props {
  vehicleId: string;
  titre: string;
  immatriculation: string;
  modeReservation: string;
  datesBloquees: string[];
  reservations: PeriodeReservee[];
}

/** Nombre de mois affichés à partir du mois courant. */
const MOIS_AFFICHES = 3;
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Clé ISO locale — `toISOString()` décalerait d'un jour selon le fuseau. */
function cleDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Toutes les dates couvertes par une réservation, bornes incluses. */
function datesDeLaPeriode(debut: string, fin: string): string[] {
  const out: string[] = [];
  const d = new Date(`${debut}T12:00:00`);
  const f = new Date(`${fin}T12:00:00`);
  while (d <= f) {
    out.push(cleDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function CalendrierClient({
  vehicleId, titre, immatriculation, modeReservation, datesBloquees, reservations,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const initiales = useMemo(() => new Set(datesBloquees), [datesBloquees]);
  const [bloquees, setBloquees] = useState<Set<string>>(() => new Set(datesBloquees));
  const [enregistrement, setEnregistrement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Dates déjà prises par une réservation : non modifiables par le loueur.
  const reservees = useMemo(() => {
    const set = new Set<string>();
    for (const r of reservations) {
      for (const d of datesDeLaPeriode(r.start_date, r.end_date)) set.add(d);
    }
    return set;
  }, [reservations]);

  const aujourdhui = cleDate(new Date());

  const mois = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    return Array.from({ length: MOIS_AFFICHES }, (_, i) => {
      const m = new Date(base);
      m.setMonth(base.getMonth() + i);
      return m;
    });
  }, []);

  const basculer = (cle: string) => {
    if (reservees.has(cle) || cle < aujourdhui) return;
    setMessage(null);
    setBloquees(prev => {
      const suivant = new Set(prev);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  };

  const aDesChangements =
    bloquees.size !== initiales.size ||
    [...bloquees].some(d => !initiales.has(d));

  const enregistrer = async () => {
    setEnregistrement(true);
    setError(null);
    setMessage(null);

    const ajoutees = [...bloquees].filter(d => !initiales.has(d));
    const retirees = [...initiales].filter(d => !bloquees.has(d));

    if (ajoutees.length) {
      const { error: e } = await supabase
        .from('vehicle_availability')
        .upsert(
          ajoutees.map(date => ({ vehicle_id: vehicleId, date, is_available: false })),
          { onConflict: 'vehicle_id,date' }
        );
      if (e) {
        setError(`Blocage impossible : ${e.message}`);
        setEnregistrement(false);
        return;
      }
    }

    if (retirees.length) {
      // On supprime plutôt que de repasser à `true` : l'absence de ligne vaut
      // disponible, et la table ne se remplit pas de valeurs par défaut.
      const { error: e } = await supabase
        .from('vehicle_availability')
        .delete()
        .eq('vehicle_id', vehicleId)
        .in('date', retirees);
      if (e) {
        setError(`Déblocage impossible : ${e.message}`);
        setEnregistrement(false);
        return;
      }
    }

    setMessage('Disponibilités enregistrées.');
    setEnregistrement(false);
    router.refresh();
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.entete}>
          <div>
            <h1 className={styles.titre}>Disponibilités</h1>
            <p className={styles.sousTitre}>
              {titre} · {immatriculation}
              {modeReservation === 'instantane' && (
                <span className={styles.badgeInstantane}>⚡ Réservation instantanée</span>
              )}
            </p>
          </div>
          <Link href="/loueur/dashboard" className="btn btn-outline btn-sm">
            ← Tableau de bord
          </Link>
        </div>

        <p className={styles.consigne}>
          Toutes les dates sont disponibles par défaut. Cliquez sur un jour pour le
          <strong> bloquer</strong> — entretien, usage personnel, absence. Les jours déjà
          réservés ne sont pas modifiables.
        </p>

        <div className={styles.legende}>
          <span><i className={styles.pastilleLibre} /> Disponible</span>
          <span><i className={styles.pastilleBloquee} /> Bloqué par vous</span>
          <span><i className={styles.pastilleReservee} /> Réservé</span>
        </div>

        <div className={styles.mois}>
          {mois.map((m, i) => {
            const annee = m.getFullYear();
            const numMois = m.getMonth();
            const premierJour = new Date(annee, numMois, 1);
            // getDay() renvoie 0 pour dimanche : on décale pour une semaine
            // commençant le lundi.
            const decalage = (premierJour.getDay() + 6) % 7;
            const nbJours = new Date(annee, numMois + 1, 0).getDate();

            return (
              <section key={i} className={`${styles.moisCarte} card`}>
                <h2 className={styles.moisTitre}>
                  {m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
                <div className={styles.grille}>
                  {JOURS.map((j, k) => (
                    <span key={k} className={styles.enteteJour}>{j}</span>
                  ))}
                  {Array.from({ length: decalage }, (_, k) => (
                    <span key={`vide-${k}`} />
                  ))}
                  {Array.from({ length: nbJours }, (_, k) => {
                    const jour = k + 1;
                    const cle = cleDate(new Date(annee, numMois, jour));
                    const passe = cle < aujourdhui;
                    const estReserve = reservees.has(cle);
                    const estBloque = bloquees.has(cle);

                    return (
                      <button
                        key={cle}
                        type="button"
                        onClick={() => basculer(cle)}
                        disabled={passe || estReserve}
                        aria-pressed={estBloque}
                        title={
                          estReserve ? 'Réservé' : passe ? 'Date passée' :
                          estBloque ? 'Bloqué — cliquez pour libérer' : 'Disponible — cliquez pour bloquer'
                        }
                        className={[
                          styles.jour,
                          passe ? styles.jourPasse : '',
                          estReserve ? styles.jourReserve : '',
                          estBloque && !estReserve ? styles.jourBloque : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {jour}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className={styles.succes} role="status">{message}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={enregistrer}
            disabled={enregistrement || !aDesChangements}
          >
            {enregistrement ? 'Enregistrement…' : '💾 Enregistrer les disponibilités'}
          </button>
          {aDesChangements && (
            <button type="button" className="btn btn-ghost"
              onClick={() => { setBloquees(new Set(initiales)); setMessage(null); }}>
              Annuler les modifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
