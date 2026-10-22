'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  CATEGORY_ICONS,
  VEHICLE_STATUS_LABELS,
  type BookingStatus,
  type Profile,
} from '@/types/db';
import type { ReservationLigne, VehiculeLigne } from './page';
import styles from './page.module.css';

interface Props {
  profile: Profile | null;
  vehicles: VehiculeLigne[];
  bookings: ReservationLigne[];
  loadError: string | null;
  vientDePublier: boolean;
  vientDeModifier: boolean;
  photosEnEchec: boolean;
}

/** Le paiement de la location vit dans `payments`, pas sur `bookings`. */
function estPayee(b: ReservationLigne): boolean {
  return b.payments.some(p => p.kind === 'location' && p.status === 'reussi');
}

export default function LoueurDashboardClient({
  profile, vehicles, bookings, loadError, vientDePublier, vientDeModifier, photosEnEchec,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<'reservations' | 'vehicules' | 'stats'>(
    vientDePublier || vientDeModifier ? 'vehicules' : 'reservations'
  );
  const [enCours, setEnCours] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const enAttente = bookings.filter(b => b.status === 'en_attente');
  const enLigne = vehicles.filter(v => v.status === 'en_ligne');
  const revenus = bookings
    .filter(estPayee)
    .reduce((s, b) => s + Number(b.subtotal), 0);

  const traitees = bookings.filter(b => ['confirmee', 'refusee'].includes(b.status));
  const tauxAcceptation = traitees.length
    ? Math.round((traitees.filter(b => b.status === 'confirmee').length / traitees.length) * 100)
    : null;

  const changerStatut = async (bookingId: string, status: BookingStatus) => {
    setEnCours(bookingId);
    setActionError(null);

    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    setEnCours(null);
    if (error) setActionError(error.message);
    else router.refresh();
  };

  /**
   * Publie ou retire un véhicule de la vitrine.
   *
   * La mise en ligne est une décision du loueur : elle n'a jamais lieu
   * automatiquement à la création.
   */
  const basculerPublication = async (vehicleId: string, enLigneActuellement: boolean) => {
    setEnCours(vehicleId);
    setActionError(null);

    const { error } = await supabase
      .from('vehicles')
      .update({ status: enLigneActuellement ? 'brouillon' : 'en_ligne' })
      .eq('id', vehicleId);

    setEnCours(null);
    if (error) setActionError(error.message);
    else router.refresh();
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tableau de bord loueur</h1>
            <p className={styles.subtitle}>
              {profile?.full_name ?? 'Mon compte'}
              {profile?.type === 'professionnel' ? ' — Professionnel 🏢' : ' — Particulier'}
            </p>
          </div>
          <Link href="/loueur/vehicule/new" className="btn btn-primary">➕ Ajouter un véhicule</Link>
        </div>

        {(vientDePublier || vientDeModifier) && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #10B981' }}>
            {vientDePublier
              ? '✅ Véhicule enregistré. Son statut de publication est indiqué ci-dessous.'
              : '✅ Modifications enregistrées.'}
            {photosEnEchec && ' En revanche, l’envoi des photos a échoué — vous pouvez les ajouter en modifiant l’annonce.'}
          </div>
        )}
        {loadError && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #EF4444' }}>
            <span className="form-error">Chargement impossible : {loadError}</span>
          </div>
        )}
        {actionError && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #EF4444' }}>
            <span className="form-error">{actionError}</span>
          </div>
        )}

        {/* KPIs */}
        <div className={styles.kpiGrid}>
          {[
            { icon: '🚗', label: 'Véhicules en ligne', value: enLigne.length, color: 'var(--primary)' },
            { icon: '📅', label: 'Demandes en attente', value: enAttente.length, color: '#F59E0B', urgent: enAttente.length > 0 },
            { icon: '✅', label: 'Réservations totales', value: bookings.length, color: '#10B981' },
            { icon: '💰', label: 'Revenus encaissés', value: formatCurrency(revenus), color: 'var(--secondary)' },
          ].map((k, i) => (
            <div key={i} className={`${styles.kpiCard} card ${k.urgent ? styles.kpiUrgent : ''}`}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiIcon}>{k.icon}</span>
                {k.urgent && <span className="badge badge-warning">Urgent</span>}
              </div>
              <p className={styles.kpiValue} style={{color: k.color}}>{k.value}</p>
              <p className={styles.kpiLabel}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['reservations', 'vehicules', 'stats'] as const).map(t => (
            <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'reservations'
                ? `📅 Réservations${enAttente.length > 0 ? ` (${enAttente.length})` : ''}`
                : t === 'vehicules' ? `🚗 Mes véhicules (${vehicles.length})` : '📊 Statistiques'}
            </button>
          ))}
        </div>

        {/* RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className={styles.tabContent}>
            {bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h3>Aucune réservation</h3>
                <p>Vos demandes de réservation apparaîtront ici.</p>
              </div>
            ) : (
              <div className={styles.resList}>
                {bookings.map(b => (
                  <div key={b.id} className={`${styles.resCard} card`}>
                    <div className={styles.resTop}>
                      <div className={styles.clientInfo}>
                        <div className="avatar avatar-md">{(b.renter?.full_name ?? '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <p className={styles.clientName}>{b.renter?.full_name ?? 'Client'}</p>
                          {b.renter?.phone && <p className={styles.clientPhone}>📞 {b.renter.phone}</p>}
                          {/* Deux choses qui n'incombent qu'au loueur, la
                              plateforme n'en gérant aucune : le contrôle des
                              documents et la caution. Le rappel suit l'avancement
                              — percevoir avant, restituer au retour. */}
                          {['en_attente', 'confirmee'].includes(b.status) && (
                            <p className={styles.clientPhone} style={{ marginTop: 4 }}>
                              🪪 À la remise des clés : vérifier identité et permis
                              {Number(b.vehicle?.deposit_amount) > 0 && (
                                <> · percevoir la caution de{' '}
                                  <strong>{formatCurrency(Number(b.vehicle?.deposit_amount))}</strong>
                                </>
                              )}
                            </p>
                          )}
                          {b.status === 'en_cours' && Number(b.vehicle?.deposit_amount) > 0 && (
                            <p className={styles.clientPhone} style={{ marginTop: 4 }}>
                              🔑 Au retour du véhicule : restituer la caution de{' '}
                              <strong>{formatCurrency(Number(b.vehicle?.deposit_amount))}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="badge" style={{background:`${BOOKING_STATUS_COLORS[b.status]}20`, color: BOOKING_STATUS_COLORS[b.status], alignSelf:'flex-start'}}>
                        {BOOKING_STATUS_LABELS[b.status]}
                      </span>
                    </div>

                    <div className={styles.resDetails}>
                      <div className={styles.resDetailItem}>
                        <span>🚗 Véhicule</span>
                        <strong>{b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '—'}</strong>
                      </div>
                      <div className={styles.resDetailItem}>
                        <span>📅 Dates</span>
                        <strong>{formatDate(b.start_date)} → {formatDate(b.end_date)} ({b.total_days}j)</strong>
                      </div>
                      <div className={styles.resDetailItem}>
                        <span>💰 Montant</span>
                        <strong>{formatCurrency(Number(b.total_amount))} {estPayee(b) ? '· payé' : '· en attente'}</strong>
                      </div>
                    </div>

                    {b.status === 'en_attente' && (
                      <div className={styles.resActions}>
                        <button className="btn btn-danger btn-sm" disabled={enCours === b.id}
                          onClick={() => changerStatut(b.id, 'refusee')}>
                          ❌ Refuser
                        </button>
                        <button className="btn btn-primary btn-sm" disabled={enCours === b.id}
                          onClick={() => changerStatut(b.id, 'confirmee')}>
                          {enCours === b.id ? '…' : '✅ Accepter'}
                        </button>
                      </div>
                    )}
                    {/* La remise et le retour ne se déclarent plus d'un clic :
                        ils passent par le contrat et l'état des lieux signés,
                        seuls à faire foi. Le bouton ne s'active qu'une fois la
                        location payée. */}
                    {b.status === 'confirmee' && (
                      <div className={styles.resActions}>
                        {estPayee(b) ? (
                          <Link href={`/loueur/reservation/${b.id}/contrat`}
                            className="btn btn-primary btn-sm">
                            ✍️ Établir le contrat et remettre le véhicule
                          </Link>
                        ) : (
                          <button className="btn btn-outline btn-sm" disabled
                            title="Le client n’a pas encore payé">
                            ⏳ En attente du paiement
                          </button>
                        )}
                      </div>
                    )}
                    {b.status === 'en_cours' && (
                      <div className={styles.resActions}>
                        <Link href={`/loueur/reservation/${b.id}/contrat?type=retour`}
                          className="btn btn-primary btn-sm">
                          🏁 État des lieux de retour
                        </Link>
                        <Link href={`/reservation/${b.id}/contrat`} className="btn btn-outline btn-sm">
                          📄 Voir le contrat
                        </Link>
                      </div>
                    )}
                    {b.status === 'terminee' && (
                      <div className={styles.resActions}>
                        <Link href={`/reservation/${b.id}/contrat`} className="btn btn-outline btn-sm">
                          📄 Contrat et états des lieux
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VEHICULES */}
        {activeTab === 'vehicules' && (
          <div className={styles.tabContent}>
            {vehicles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <h3>Aucun véhicule</h3>
                <p>Publiez votre premier véhicule pour recevoir des réservations.</p>
                <Link href="/loueur/vehicule/new" className="btn btn-primary">Ajouter un véhicule</Link>
              </div>
            ) : (
              <>
                <div className={styles.vehiclesList}>
                  {vehicles.map(v => (
                    <div key={v.id} className={`${styles.vehicleRow} card`}>
                      <div className={styles.vehicleRowLeft}>
                        <div className={styles.vehicleRowIcon}>{CATEGORY_ICONS[v.category]}</div>
                        <div>
                          <p className={styles.vehicleRowName}>
                            {v.brand} {v.model} {v.year && <span className={styles.vehicleYear}>{v.year}</span>}
                          </p>
                          <p className={styles.vehicleRowMeta}>
                            📍 {v.city || <em>ville manquante</em>} · {formatCurrency(Number(v.daily_price))}/j
                            · {v.vehicle_photos.length} photo{v.vehicle_photos.length > 1 ? 's' : ''}
                          </p>
                          <p className={styles.vehicleRowMeta}>🔖 {v.license_plate}</p>
                        </div>
                      </div>
                      <div className={styles.vehicleRowRight}>
                        <span className={`badge ${v.status === 'en_ligne' ? 'badge-success' : 'badge-warning'}`}>
                          {v.status === 'en_ligne' ? '✓ En ligne' : VEHICLE_STATUS_LABELS[v.status]}
                        </span>
                        <button
                          className={`btn btn-sm ${v.status === 'en_ligne' ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => basculerPublication(v.id, v.status === 'en_ligne')}
                          disabled={enCours === v.id}
                        >
                          {enCours === v.id
                            ? '⏳'
                            : v.status === 'en_ligne' ? '🚫 Retirer' : '🚀 Publier'}
                        </button>
                        <Link href={`/loueur/vehicule/${v.id}/disponibilites`} className="btn btn-outline btn-sm">
                          📅 Disponibilités
                        </Link>
                        <Link href={`/loueur/vehicule/${v.id}/modifier`} className="btn btn-outline btn-sm">
                          ✏️ Modifier
                        </Link>
                        <Link href={`/vehicule/${v.id}`} className="btn btn-outline btn-sm">Voir</Link>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/loueur/vehicule/new" className="btn btn-primary" style={{marginTop: 16}}>
                  ➕ Ajouter un nouveau véhicule
                </Link>
              </>
            )}
          </div>
        )}

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className={styles.tabContent}>
            <div className={styles.statsGrid}>
              {[
                { label: 'Revenus encaissés', value: formatCurrency(revenus), sub: `${bookings.filter(estPayee).length} réservation(s) payée(s)` },
                { label: "Taux d'acceptation", value: tauxAcceptation === null ? '—' : `${tauxAcceptation}%`, sub: `${traitees.length} demande(s) traitée(s)` },
                { label: 'Note moyenne', value: profile?.average_rating ? `${Number(profile.average_rating).toFixed(1)} ⭐` : '—', sub: 'Sur vos locations' },
                { label: 'Véhicules', value: `${enLigne.length}/${vehicles.length}`, sub: 'En ligne / total' },
              ].map((s, i) => (
                <div key={i} className={`${styles.statCard} card`}>
                  <p className={styles.statValue}>{s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                  <p className={styles.statSub}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div className={`${styles.chartPlaceholder} card`}>
              <p>📊 Graphiques de revenus et réservations — à venir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
