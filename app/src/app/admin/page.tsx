import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { lireCommission } from '@/lib/tarifs';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { BOOKING_STATUS_LABELS } from '@/types/db';
import styles from './page.module.css';

/**
 * Back-office administrateur.
 *
 * Aucune politique RLS ne donne une vue globale aux admins : les seules
 * références à `is_admin()` portent sur `platform_settings`. Les statistiques
 * transverses passent donc par le client service-role, exclusivement côté
 * serveur et uniquement après vérification du rôle de l'appelant.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/admin');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  // 404 plutôt que 403 : on ne révèle pas l'existence du back-office.
  if (profile?.role !== 'admin') notFound();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <div className="page">
        <div className="container">
          <h1 className={styles.title}>Administration</h1>
          <div className="card" style={{ padding: 20, marginTop: 24, borderLeft: '4px solid #F59E0B' }}>
            <p><strong>Configuration incomplète.</strong></p>
            <p style={{ marginTop: 8 }}>
              La variable <code>SUPABASE_SERVICE_ROLE_KEY</code> est absente de <code>.env.local</code>.
              Elle est nécessaire ici, car aucune politique RLS n&apos;accorde de vue globale aux
              administrateurs. Récupérez-la dans Supabase &gt; Settings &gt; API.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [profils, vehicules, reservations, paiements, commission] = await Promise.all([
    admin.from('profiles').select('id, full_name, type, verification_status, created_at')
      .order('created_at', { ascending: false }),
    admin.from('vehicles').select('id, status'),
    admin.from('bookings')
      .select('id, start_date, end_date, total_amount, service_fee, status, created_at')
      .order('created_at', { ascending: false }).limit(30),
    admin.from('payments').select('amount, status, kind'),
    lireCommission(supabase),
  ]);

  const tousProfils = profils.data ?? [];
  const tousVehicules = vehicules.data ?? [];
  const dernieresReservations = reservations.data ?? [];
  const tousPaiements = paiements.data ?? [];

  const aValider = tousProfils.filter(p => p.verification_status === 'en_attente');
  const enLigne = tousVehicules.filter(v => v.status === 'en_ligne');
  const encaisse = tousPaiements
    .filter(p => p.status === 'reussi' && p.kind === 'location')
    .reduce((s, p) => s + Number(p.amount), 0);
  const commissionPercue = dernieresReservations
    .filter(b => ['confirmee', 'en_cours', 'terminee'].includes(b.status))
    .reduce((s, b) => s + Number(b.service_fee), 0);

  const kpis = [
    { icon: '👥', label: 'Utilisateurs', value: String(tousProfils.length), color: '#3B82F6' },
    { icon: '🚗', label: 'Véhicules en ligne', value: `${enLigne.length}/${tousVehicules.length}`, color: 'var(--secondary)' },
    { icon: '📅', label: 'Réservations', value: String(dernieresReservations.length), color: '#8B5CF6' },
    { icon: '💰', label: 'Volume encaissé', value: formatCurrency(encaisse), color: '#10B981' },
    { icon: '🏦', label: `Commission (${commission.percent}%)`, value: formatCurrency(commissionPercue), color: 'var(--primary)' },
    { icon: '⏳', label: 'Vérifications en attente', value: String(aValider.length), color: '#F59E0B', urgent: aValider.length > 0 },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Administration</h1>
            <p className={styles.subtitle}>Vue plateforme — données réelles</p>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          {kpis.map((k, i) => (
            <div key={i} className={`${styles.kpiCard} card ${k.urgent ? styles.kpiUrgent : ''}`}>
              <span className={styles.kpiIcon}>{k.icon}</span>
              <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
              <p className={styles.kpiLabel}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Vérifications d'identité en attente */}
        <div className={styles.tabContent}>
          <h2 className={styles.title} style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            Vérifications en attente ({aValider.length})
          </h2>
          {aValider.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>Aucune vérification en attente</h3>
            </div>
          ) : (
            <div className={styles.loueursList}>
              {aValider.map(p => (
                <div key={p.id} className={`${styles.loueurCard} card`}>
                  <div className={styles.loueurTop}>
                    <div className={styles.loueurInfo}>
                      <div className="avatar avatar-md">{p.full_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className={styles.loueurName}>{p.full_name}</p>
                        <p className={styles.loueurDate}>
                          {p.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                          {' · inscrit le '}{formatDateShort(p.created_at)}
                        </p>
                      </div>
                    </div>
                    {/* TODO : valider/refuser (UPDATE profiles.verification_status)
                        via une route serveur dédiée. */}
                    <span className="badge badge-warning">En attente</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières réservations */}
        <div className={styles.tabContent} style={{ marginTop: 32 }}>
          <h2 className={styles.title} style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            Dernières réservations ({dernieresReservations.length})
          </h2>
          {dernieresReservations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>Aucune réservation</h3>
              <p>Les réservations de la plateforme apparaîtront ici.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Réf.</th><th>Dates</th><th>Montant</th><th>Commission</th><th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {dernieresReservations.map(b => (
                    <tr key={b.id}>
                      <td className={styles.resId}>{b.id.slice(0, 8)}</td>
                      <td>{formatDateShort(b.start_date)} → {formatDateShort(b.end_date)}</td>
                      <td>{formatCurrency(Number(b.total_amount))}</td>
                      <td>{formatCurrency(Number(b.service_fee))}</td>
                      <td>{BOOKING_STATUS_LABELS[b.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.tabContent} style={{ marginTop: 32 }}>
          <div className={`${styles.chartBox} card`}>
            <p>
              Commission configurée : <strong>{commission.percent} %</strong> du sous-total,
              minimum <strong>{formatCurrency(commission.minEur)}</strong> — modifiable dans
              la table <code>platform_settings</code>.
            </p>
            <p style={{ marginTop: 8 }}>
              <Link href="/catalogue">Voir le catalogue public →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
