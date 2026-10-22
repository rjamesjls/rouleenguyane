'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { calculerDevis, compterJours, type Commission } from '@/lib/tarifs';
import { postJson } from '@/lib/postJson';
import { CATEGORY_ICONS, CATEGORY_LABELS, decrireCouleur } from '@/types/db';
import type { VehiculeDetail } from './page';
import styles from './page.module.css';

interface Props {
  vehicle: VehiculeDetail;
  commission: Commission;
  connecte: boolean;
  estProprietaire: boolean;
  /** Jours réservés ou rendus indisponibles par le propriétaire (yyyy-mm-dd). */
  datesIndisponibles: string[];
}

/**
 * La période choisie recouvre-t-elle un jour indisponible ?
 *
 * Bornes [début, fin[ : le véhicule est rendu le jour de fin, qui reste donc
 * réservable par quelqu'un d'autre — même convention qu'en base.
 *
 * Fonction pure définie hors du composant : le compilateur React refuse une
 * mémoïsation contenant une boucle qui mute une date.
 */
function periodeIndisponible(
  debut: string, fin: string, nbJours: number, indisponibles: string[]
): boolean {
  if (!debut || !fin || nbJours < 1) return false;
  const bloquees = new Set(indisponibles);
  const d = new Date(`${debut}T12:00:00`);
  const f = new Date(`${fin}T12:00:00`);
  while (d < f) {
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (bloquees.has(cle)) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

export default function VehicleDetailClient({
  vehicle, commission, connecte, estProprietaire, datesIndisponibles,
}: Props) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [form, setForm] = useState({ date_debut: '', date_fin: '' });
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Renseigné par la réponse du serveur : en mode instantané la réservation
  // est déjà confirmée, l'écran de fin doit envoyer payer plutôt qu'attendre.
  const [confirmeeDirect, setConfirmeeDirect] = useState(false);

  const photos = [...vehicle.vehicle_photos].sort((a, b) => a.position - b.position);
  const nbJours = form.date_debut && form.date_fin ? compterJours(form.date_debut, form.date_fin) : 0;
  const devis = nbJours > 0
    ? calculerDevis(Number(vehicle.daily_price), nbJours, commission)
    : null;
  const note = vehicle.owner?.average_rating;
  const disponible = vehicle.status === 'en_ligne';

  const conflit = periodeIndisponible(
    form.date_debut, form.date_fin, nbJours, datesIndisponibles
  );

  const envoyerDemande = async () => {
    setEnvoi(true);
    setError(null);

    const res = await postJson<{ bookingId: string; confirmee: boolean }>('/api/bookings', {
      vehicleId: vehicle.id,
      startDate: form.date_debut,
      endDate: form.date_fin,
    });

    if (!res.ok) {
      setError(res.error);
      setStep('form');
    } else {
      setConfirmeeDirect(res.data.confirmee);
      setStep('success');
      router.refresh();
    }
    setEnvoi(false);
  };

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 'form') setStep('confirm');
  };

  const couleur = decrireCouleur(vehicle.color);

  const specs = [
    vehicle.seats && { icon: '👥', label: 'Places', value: `${vehicle.seats} personnes` },
    vehicle.transmission && { icon: '⚙️', label: 'Boîte', value: vehicle.transmission },
    vehicle.fuel_type && { icon: '⛽', label: 'Carburant', value: vehicle.fuel_type },
    vehicle.year && { icon: '📅', label: 'Année', value: String(vehicle.year) },
    couleur && { icon: '🎨', label: 'Couleur', value: couleur.label },
    { icon: '🛡️', label: 'Assurance', value: vehicle.insurance_included ? 'Incluse' : 'Non incluse' },
    vehicle.mileage_limit_per_day && { icon: '📏', label: 'Km inclus/j', value: `${vehicle.mileage_limit_per_day} km` },
    { icon: '⏱️', label: 'Durée min.', value: `${vehicle.min_rental_days} jour(s)` },
    { icon: '🔑', label: 'Prise en charge', value: vehicle.address || vehicle.city },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div className="page">
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link href="/">Accueil</Link> <span>/</span>
          <Link href="/catalogue">Véhicules</Link> <span>/</span>
          <span>{vehicle.brand} {vehicle.model}</span>
        </div>

        <div className={styles.layout}>
          {/* LEFT */}
          <div className={styles.left}>
            <div className={styles.gallery}>
              <div className={styles.mainPhoto}>
                {photos[activePhoto] ? (
                  // Photos servies par Supabase Storage : next/image exigerait
                  // une configuration de domaine distante non mise en place.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[activePhoto].url} alt={`${vehicle.brand} ${vehicle.model}`} />
                ) : (
                  <div className={styles.photoPlaceholder}>{CATEGORY_ICONS[vehicle.category]}</div>
                )}
                {!disponible && <div className={styles.unavailableOverlay}>Indisponible en ce moment</div>}
              </div>
              {photos.length > 1 && (
                <div className={styles.thumbs}>
                  {photos.map((p, i) => (
                    <button key={p.id} className={`${styles.thumb} ${activePhoto === i ? styles.thumbActive : ''}`}
                      onClick={() => setActivePhoto(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <div>
                  <div className={styles.vehicleType}>
                    <span>{CATEGORY_ICONS[vehicle.category]}</span>
                    <span>{CATEGORY_LABELS[vehicle.category]}</span>
                  </div>
                  <h1 className={styles.vehicleName}>{vehicle.title}</h1>
                  <div className={styles.vehicleMeta}>
                    <span>📍 {vehicle.city || 'Ville non renseignée'}</span>
                    <span>•</span>
                    <span>{vehicle.brand} {vehicle.model}</span>
                    {/* Ternaire obligatoire : `note && …` afficherait « 0 »
                        littéralement quand la note vaut zéro. */}
                    {note ? (
                      <>
                        <span>•</span>
                        <span>⭐ {Number(note).toFixed(1)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className={styles.priceBlock}>
                  <span className={styles.priceMain}>{formatCurrency(Number(vehicle.daily_price))}</span>
                  <span className={styles.priceLabel}>par jour</span>
                  {Number(vehicle.deposit_amount) > 0 && (
                    <span className={styles.caution}>
                      Caution : {formatCurrency(Number(vehicle.deposit_amount))} — à remettre
                      au propriétaire
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.specsGrid}>
                {specs.map((s, i) => (
                  <div key={i} className={styles.specItem}>
                    <span className={styles.specIcon}>{s.icon}</span>
                    <div>
                      <p className={styles.specLabel}>{s.label}</p>
                      <p className={styles.specValue}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {vehicle.description && (
                <div className={styles.section}>
                  <h2>Description</h2>
                  <p>{vehicle.description}</p>
                </div>
              )}

              {vehicle.owner && (
                <Link href={`/loueurs/${vehicle.owner.id}`} className={styles.loueurCard}>
                  <div className={styles.loueurInfo}>
                    <div className="avatar avatar-lg">
                      {vehicle.owner.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={vehicle.owner.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : vehicle.owner.full_name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <p className={styles.loueurName}>{vehicle.owner.full_name}</p>
                      <div style={{display:'flex', gap: 8, flexWrap:'wrap', marginTop:4}}>
                        {vehicle.owner.verification_status === 'verifie' && (
                          <span className="badge badge-success">✓ Identité vérifiée</span>
                        )}
                        {vehicle.owner.type === 'professionnel' && <span className="badge badge-primary">Pro</span>}
                      </div>
                      <p className={styles.loueurBio}>
                        Voir le profil, ses autres véhicules et les avis →
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Les avis sont regroupés sur le profil public du loueur
                  (/loueurs/[id]), où ils peuvent aussi être déposés. */}
            </div>
          </div>

          {/* RIGHT — Réservation */}
          <div className={styles.right}>
            <div className={`${styles.reservationCard} card`}>
              {step === 'success' ? (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>{confirmeeDirect ? '✅' : '🎉'}</div>
                  {confirmeeDirect ? (
                    <>
                      <h3>Réservation confirmée !</h3>
                      <p>
                        Ce véhicule est en réservation instantanée : votre réservation est
                        acquise, sans attendre l&apos;accord du propriétaire. Il ne reste
                        qu&apos;à régler la location.
                      </p>
                      <Link href="/dashboard" className="btn btn-primary" style={{width:'100%', marginTop:8}}>
                        💳 Payer ma réservation
                      </Link>
                    </>
                  ) : (
                    <>
                      <h3>Demande envoyée !</h3>
                      <p>Le loueur a reçu votre demande. Suivez son état depuis vos réservations.</p>
                      <Link href="/dashboard" className="btn btn-primary" style={{width:'100%', marginTop:8}}>Mes réservations</Link>
                    </>
                  )}
                </div>
              ) : step === 'confirm' && devis ? (
                <div className={styles.confirmStep}>
                  <h3>Confirmer la demande</h3>
                  <div className={styles.confirmDetails}>
                    <div className={styles.confirmRow}>
                      <span>Véhicule</span><strong>{vehicle.brand} {vehicle.model}</strong>
                    </div>
                    <div className={styles.confirmRow}>
                      <span>Du</span>
                      <strong>{new Date(form.date_debut).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</strong>
                    </div>
                    <div className={styles.confirmRow}>
                      <span>Au</span>
                      <strong>{new Date(form.date_fin).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</strong>
                    </div>
                    <div className={styles.confirmRow}>
                      <span>Durée</span><strong>{nbJours} jour{nbJours > 1 ? 's' : ''}</strong>
                    </div>
                    <div className={styles.divider}/>
                    <div className={styles.confirmRow}>
                      <span>{formatCurrency(Number(vehicle.daily_price))} × {nbJours}j</span>
                      <span>{formatCurrency(devis.subtotal)}</span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span>Frais de service ({commission.percent}%)</span>
                      <span>{formatCurrency(devis.serviceFee)}</span>
                    </div>
                    <div className={`${styles.confirmRow} ${styles.confirmTotal}`}>
                      <strong>Total</strong><strong>{formatCurrency(devis.totalAmount)}</strong>
                    </div>
                    {/* La caution n'est jamais encaissée par JELOUE : elle ne fait
                        pas partie du total payé ici, et se règle directement avec
                        le propriétaire. Le dire explicitement évite que le client
                        croie l'avoir déjà versée. */}
                    {Number(vehicle.deposit_amount) > 0 && (
                      <p className={styles.cautionNote}>
                        🔒 Une caution de {formatCurrency(Number(vehicle.deposit_amount))} sera
                        demandée par le propriétaire à la remise des clés. Elle n&apos;est pas
                        incluse dans ce total et ne transite pas par JELOUE.
                      </p>
                    )}
                  </div>
                  {error && <p className="form-error">{error}</p>}
                  <div style={{display:'flex', gap:8, marginTop:16}}>
                    <button className="btn btn-outline" style={{flex:1}} onClick={() => setStep('form')} disabled={envoi}>
                      Modifier
                    </button>
                    <button className="btn btn-primary" style={{flex:2}} onClick={envoyerDemande} disabled={envoi}>
                      {envoi ? 'Envoi…' : 'Confirmer ✓'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardPrice}>
                      {formatCurrency(Number(vehicle.daily_price))}<small>/jour</small>
                    </span>
                    {note ? <span className={styles.cardRating}>⭐ {Number(note).toFixed(1)}</span> : null}
                  </div>

                  <form onSubmit={handleReservation} className={styles.resForm}>
                    <div className={styles.dateGrid}>
                      <div className="form-group">
                        <label className="form-label">📅 Départ <span style={{color:'var(--danger)'}}>*</span></label>
                        <input type="date" className="form-input"
                          min={new Date().toISOString().split('T')[0]}
                          value={form.date_debut}
                          onChange={e => setForm({...form, date_debut: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">📅 Retour <span style={{color:'var(--danger)'}}>*</span></label>
                        <input type="date" className="form-input"
                          min={form.date_debut || new Date().toISOString().split('T')[0]}
                          value={form.date_fin}
                          onChange={e => setForm({...form, date_fin: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    {devis && (
                      <div className={styles.prixBreakdown}>
                        <div className={styles.prixRow}>
                          <span>{formatCurrency(Number(vehicle.daily_price))} × {nbJours} jour{nbJours > 1 ? 's' : ''}</span>
                          <span>{formatCurrency(devis.subtotal)}</span>
                        </div>
                        <div className={styles.prixRow}>
                          <span>Frais de service ({commission.percent}%)</span>
                          <span>{formatCurrency(devis.serviceFee)}</span>
                        </div>
                        <div className={`${styles.prixRow} ${styles.prixTotal}`}>
                          <strong>Total</strong><strong>{formatCurrency(devis.totalAmount)}</strong>
                        </div>
                      </div>
                    )}

                    {conflit && (
                      <p className="form-error">
                        Ce véhicule n&apos;est pas disponible sur toute la période choisie.
                        Essayez d&apos;autres dates.
                      </p>
                    )}
                    {error && <p className="form-error">{error}</p>}

                    {estProprietaire ? (
                      <p className={styles.resNote}>C&apos;est votre véhicule — vous ne pouvez pas le réserver.</p>
                    ) : !connecte ? (
                      <Link href={`/auth/login?redirect=/vehicule/${vehicle.id}`}
                        className="btn btn-primary" style={{width:'100%', padding:'14px'}}>
                        Se connecter pour réserver
                      </Link>
                    ) : (
                      <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}}
                        disabled={!disponible || nbJours < 1 || conflit}>
                        {!disponible
                          ? '⛔ Indisponible'
                          : vehicle.booking_mode === 'instantane'
                            ? '⚡ Réserver instantanément'
                            : '📨 Envoyer la demande'}
                      </button>
                    )}
                    <p className={styles.resNote}>
                      Aucun paiement maintenant — vous payez après acceptation du loueur.
                    </p>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
