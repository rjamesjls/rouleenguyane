'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { postJson } from '@/lib/postJson';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  CATEGORY_ICONS,
  type Profile,
} from '@/types/db';
import type { BookingLigne } from './page';
import styles from './page.module.css';

interface Props {
  email: string;
  profile: Profile | null;
  bookings: BookingLigne[];
  loadError: string | null;
  paiement: string | null;
  ongletInitial: 'reservations' | 'profil';
}

/** Le paiement de la location vit dans `payments`, pas sur `bookings`. */
function estPayee(booking: BookingLigne): boolean {
  return booking.payments.some(p => p.kind === 'location' && p.status === 'reussi');
}

export default function DashboardClient({ email, profile, bookings, loadError, paiement, ongletInitial }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reservations' | 'profil'>(ongletInitial);

  const displayName = profile?.full_name || email;
  const pending = bookings.filter(b => ['en_attente', 'confirmee', 'en_cours'].includes(b.status));
  const past = bookings.filter(b => ['terminee', 'annulee', 'refusee'].includes(b.status));
  const totalDepense = bookings
    .filter(estPayee)
    .reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Mon espace</h1>
            <p className={styles.subtitle}>Bienvenue, {displayName.split(' ')[0]} 👋</p>
          </div>
          <Link href="/catalogue" className="btn btn-primary">🔍 Chercher un véhicule</Link>
        </div>

        {/* Retour de Stripe Checkout. La confirmation réelle vient du webhook :
            elle peut arriver quelques secondes après la redirection. */}
        {paiement === 'succes' && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #10B981' }}>
            ✅ Paiement reçu. La confirmation peut prendre quelques secondes à s&apos;afficher.
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 12 }}
              onClick={() => router.refresh()}
            >
              Actualiser
            </button>
          </div>
        )}
        {paiement === 'annule' && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #F59E0B' }}>
            ⚠️ Paiement annulé. Votre réservation est conservée, vous pouvez réessayer.
          </div>
        )}
        {loadError && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #EF4444' }}>
            <span className="form-error">Impossible de charger vos réservations : {loadError}</span>
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: '📅', label: 'Réservations', value: bookings.length },
            { icon: '✅', label: 'Confirmées', value: bookings.filter(b => b.status === 'confirmee').length },
            { icon: '🏁', label: 'Terminées', value: bookings.filter(b => b.status === 'terminee').length },
            { icon: '💰', label: 'Total dépensé', value: formatCurrency(totalDepense) },
          ].map((s, i) => (
            <div key={i} className={`${styles.statCard} card`}>
              <span className={styles.statIcon}>{s.icon}</span>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['reservations', 'profil'] as const).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'reservations' ? '📅 Mes réservations' : '👤 Mon profil'}
            </button>
          ))}
        </div>

        {activeTab === 'reservations' && (
          <div className={styles.content}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>À venir &amp; En cours ({pending.length})</h2>
              {pending.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🚗</div>
                  <h3>Aucune réservation active</h3>
                  <p>Trouvez votre prochain véhicule en Guyane.</p>
                  <Link href="/catalogue" className="btn btn-primary">Chercher un véhicule</Link>
                </div>
              ) : (
                <div className={styles.reservationsList}>
                  {pending.map(b => <BookingItem key={b.id} b={b} />)}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Historique ({past.length})</h2>
                <div className={styles.reservationsList}>
                  {past.map(b => <BookingItem key={b.id} b={b} past />)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profil' && <ProfileTab email={email} profile={profile} />}
      </div>
    </div>
  );
}

function ProfileTab({ email, profile }: { email: string; profile: Profile | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Le profil vient du serveur : il est disponible dès le premier rendu,
  // aucun effet de synchronisation n'est nécessaire.
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    city: profile?.city ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        city: form.city || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Profil enregistré.' });
      router.refresh();
    }
  };

  return (
    <div className={styles.content}>
      <div className={`${styles.profileCard} card`}>
        <div className={styles.profileHeader}>
          <div className="avatar avatar-xl">{(form.full_name || email || '?').charAt(0).toUpperCase()}</div>
          <div>
            <h2>{form.full_name || 'Profil incomplet'}</h2>
            <p>{email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-muted">
                {profile?.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
              </span>
              {/* Aucun badge de permis : la vérification se fait en personne
                  avec le propriétaire, la plateforme n'en garde pas trace.
                  `profiles.driving_license_verified` n'est donc plus lu. */}
            </div>
          </div>
        </div>
        <div className={styles.profileForm}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                type="text" className="form-input" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel" className="form-input" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Ville principale</label>
            <input
              type="text" className="form-input" value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            />
          </div>
          {/* Choix produit : aucun document d'identité n'est téléversé sur la
              plateforme. La vérification se fait en personne, à la remise des
              clés — ce qui évite d'héberger des pièces d'identité et la charge
              réglementaire qui va avec. */}
          <div className={styles.docSection}>
            <h3>🪪 Documents</h3>
            <p>
              Votre document d&apos;identité et votre permis de conduire sont à vérifier
              directement avec le propriétaire du véhicule, lors de la remise des clés.
              Aucun document n&apos;est à envoyer sur JELOUE.
            </p>
          </div>
          {feedback && <p className={feedback.ok ? 'form-hint' : 'form-error'}>{feedback.msg}</p>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !profile}>
            {saving ? 'Enregistrement…' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingItem({ b, past }: { b: BookingLigne; past?: boolean }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [action, setAction] = useState<'avis' | 'annulation' | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [cancellationReason, setCancellationReason] = useState('Changement de programme');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewSent, setReviewSent] = useState(false);

  const payee = estPayee(b);
  const peutPayer = !past && b.status === 'confirmee' && !payee;
  const dejaNote = b.reviews.some(review => review.reviewer_id === b.renter_id) || reviewSent;

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);

    const res = await postJson<{ url: string }>('/api/stripe/checkout', { bookingId: b.id });
    if (!res.ok) {
      setPayError(res.error);
      setPaying(false);
      return;
    }

    // Redirection vers la page de paiement hébergée par Stripe.
    window.location.href = res.data.url;
  };

  const handleReview = async () => {
    if (rating < 1) {
      setActionError('Choisissez une note de 1 à 5 étoiles.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    const res = await postJson('/api/reviews', {
      bookingId: b.id,
      rating,
      comment,
    });

    if (!res.ok) {
      setActionError(res.error);
    } else {
      setReviewSent(true);
      setAction(null);
      router.refresh();
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setActionError(null);
    const res = await postJson('/api/bookings/cancel', {
      bookingId: b.id,
      reason: cancellationReason,
    });

    if (!res.ok) {
      setActionError(res.error);
      setSubmitting(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className={`${styles.resCard} card`}>
      <div className={styles.resCardHeader}>
        <div className={styles.resVehicle}>
          <div className={styles.resVehicleIcon}>
            {b.vehicle ? CATEGORY_ICONS[b.vehicle.category] : '🚗'}
          </div>
          <div>
            <p className={styles.resVehicleName}>
              {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Véhicule supprimé'}
            </p>
            <p className={styles.resLoueur}>Loueur : {b.owner?.full_name ?? '—'}</p>
          </div>
        </div>
        <div className={styles.resStatus}>
          <span className="badge" style={{ background: `${BOOKING_STATUS_COLORS[b.status]}20`, color: BOOKING_STATUS_COLORS[b.status] }}>
            {BOOKING_STATUS_LABELS[b.status]}
          </span>
        </div>
      </div>
      <div className={styles.resMeta}>
        <span>📅 {formatDate(b.start_date)} → {formatDate(b.end_date)}</span>
        <span>⏱️ {b.total_days} jour{b.total_days > 1 ? 's' : ''}</span>
        <span>💰 {formatCurrency(Number(b.total_amount))}</span>
        <span>{payee ? '✅ Payé' : '💵 Paiement en attente'}</span>
      </div>
      {/* Pendant du rappel affiché au loueur : la caution ne transite jamais
          par JELOUE, le client doit donc la prévoir au moment de la remise. */}
      {['confirmee', 'en_cours'].includes(b.status) && Number(b.vehicle?.deposit_amount) > 0 && (
        <p className={styles.resLoueur} style={{ marginTop: 8 }}>
          🔒 Caution de <strong>{formatCurrency(Number(b.vehicle?.deposit_amount))}</strong> à
          remettre directement au propriétaire{b.status === 'confirmee' ? ' lors de la prise en charge' : ''},
          restituée au retour du véhicule. Elle n&apos;est pas incluse dans le montant payé en ligne.
        </p>
      )}
      {payError && <p className="form-error">{payError}</p>}
      <div className={styles.resActions}>
        {/* Le contrat est consultable dès la confirmation : le locataire doit
            pouvoir le lire avant son rendez-vous, pas le découvrir sur le
            téléphone du loueur au moment de signer. */}
        {['confirmee', 'en_cours', 'terminee'].includes(b.status) && (
          <Link href={`/reservation/${b.id}/contrat`} className="btn btn-outline btn-sm">
            📄 {b.status === 'confirmee' ? 'Lire le contrat' : 'Voir le contrat'}
          </Link>
        )}
        <Link href={`/vehicule/${b.vehicle_id}`} className="btn btn-ghost btn-sm">Voir le véhicule</Link>
        {peutPayer && (
          <button className="btn btn-primary btn-sm" onClick={handlePay} disabled={paying}>
            {paying ? 'Redirection…' : `💳 Payer ${formatCurrency(Number(b.total_amount))}`}
          </button>
        )}
        {past && b.status === 'terminee' && !dejaNote && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setAction(action === 'avis' ? null : 'avis');
              setActionError(null);
            }}
          >
            ⭐ Laisser un avis
          </button>
        )}
        {past && b.status === 'terminee' && dejaNote && (
          <span className={styles.actionSuccess}>✓ Avis publié</span>
        )}
        {!past && b.status === 'en_attente' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              setAction(action === 'annulation' ? null : 'annulation');
              setActionError(null);
            }}
          >
            ❌ Annuler
          </button>
        )}
      </div>

      {action === 'avis' && (
        <div className={styles.inlineAction}>
          <div className={styles.inlineActionHeader}>
            <div>
              <h3>Comment s&apos;est passée votre location ?</h3>
              <p>Votre avis aide les autres locataires à choisir en confiance.</p>
            </div>
            <button className={styles.closeAction} onClick={() => setAction(null)} aria-label="Fermer">×</button>
          </div>
          <div className={styles.ratingInput} onMouseLeave={() => setHoveredRating(0)}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={(hoveredRating || rating) >= n ? styles.starActive : ''}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoveredRating(n)}
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                aria-pressed={rating === n}
              >
                ★
              </button>
            ))}
            {rating > 0 && <span>{rating}/5</span>}
          </div>
          <textarea
            className="form-textarea"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="État du véhicule, ponctualité, accueil… (facultatif)"
            maxLength={1000}
          />
          {actionError && <p className="form-error">{actionError}</p>}
          <div className={styles.inlineActionButtons}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Plus tard</button>
            <button className="btn btn-primary btn-sm" onClick={handleReview} disabled={submitting}>
              {submitting ? 'Publication…' : 'Publier mon avis'}
            </button>
          </div>
        </div>
      )}

      {action === 'annulation' && (
        <div className={`${styles.inlineAction} ${styles.cancelAction}`}>
          <div className={styles.inlineActionHeader}>
            <div>
              <h3>Annuler cette demande ?</h3>
              <p>Le loueur sera informé et ces dates seront libérées.</p>
            </div>
            <button className={styles.closeAction} onClick={() => setAction(null)} aria-label="Fermer">×</button>
          </div>
          <div className="form-group">
            <label className="form-label">Motif de l&apos;annulation</label>
            <select
              className="form-select"
              value={cancellationReason}
              onChange={e => setCancellationReason(e.target.value)}
            >
              <option>Changement de programme</option>
              <option>J&apos;ai trouvé un autre véhicule</option>
              <option>Erreur dans les dates</option>
              <option>Autre raison</option>
            </select>
          </div>
          {actionError && <p className="form-error">{actionError}</p>}
          <div className={styles.inlineActionButtons}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Garder ma demande</button>
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={submitting}>
              {submitting ? 'Annulation…' : 'Confirmer l’annulation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
