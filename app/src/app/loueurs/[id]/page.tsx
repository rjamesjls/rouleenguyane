import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import VehicleCard, { type VehiculeCarte } from '@/components/vehicles/VehicleCard';
import AvisSection, { type Avis, type LocationANoter } from './AvisSection';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('full_name').eq('id', id).maybeSingle();
  return {
    title: data ? `${data.full_name} — Loueur sur ROULÉ` : 'Loueur',
  };
}

/** Profil public d'un loueur : ses annonces, ses chiffres, ses avis. */
export default async function LoueurPublicPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase
      // Pas de téléphone ni de SIRET : page publique.
      .from('profiles')
      .select('id, full_name, avatar_url, cover_url, type, company_name, city, verification_status, average_rating, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  const [{ data: vehicles }, { data: stats }, { data: reviews }] = await Promise.all([
    // La RLS ne renvoie que les véhicules en ligne à un visiteur.
    supabase
      .from('vehicles')
      .select('*, vehicle_photos(url, position), owner:profiles!vehicles_owner_id_fkey(full_name, avatar_url, average_rating, verification_status)')
      .eq('owner_id', id)
      .eq('status', 'en_ligne')
      .order('created_at', { ascending: false }),
    // `bookings` est masquée aux visiteurs : les compteurs passent par une
    // fonction SECURITY DEFINER qui ne renvoie que des agrégats.
    supabase.rpc('loueur_stats', { loueur: id }).single(),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const avis = (reviews ?? []) as unknown as Avis[];

  // Locations terminées entre le visiteur et ce loueur, pas encore notées.
  // La RLS limite déjà cette requête aux réservations du visiteur.
  let aNoter: LocationANoter[] = [];
  if (user && user.id !== id) {
    const { data: locations } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, vehicle:vehicles(brand, model)')
      .eq('owner_id', id)
      .eq('renter_id', user.id)
      .eq('status', 'terminee')
      .order('end_date', { ascending: false });

    const dejaNotees = new Set(
      (await supabase
        .from('reviews')
        .select('booking_id')
        .eq('reviewer_id', user.id)).data?.map(r => r.booking_id) ?? []
    );

    aNoter = ((locations ?? []) as unknown as LocationANoter[])
      .filter(l => !dejaNotees.has(l.id));
  }

  const noteMoyenne = avis.length
    ? avis.reduce((s, a) => s + a.rating, 0) / avis.length
    : null;

  const membreDepuis = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const chiffres = [
    {
      icon: '🚗', teinte: 'var(--info)',
      valeur: stats?.vehicules_en_ligne ?? 0,
      label: 'Véhicules à louer', sub: 'Annonces en ligne',
    },
    {
      icon: '🔑', teinte: 'var(--primary)',
      valeur: stats?.vehicules_loues ?? 0,
      label: 'Actuellement loués', sub: 'Location en cours',
    },
    {
      icon: '✅', teinte: 'var(--success)',
      valeur: stats?.vehicules_disponibles ?? 0,
      label: 'Disponibles', sub: 'Réservables aujourd’hui',
    },
    {
      icon: '⭐', teinte: 'var(--accent)',
      valeur: noteMoyenne ? noteMoyenne.toFixed(1) : '—',
      label: 'Note moyenne', sub: `${avis.length} avis client${avis.length > 1 ? 's' : ''}`,
    },
  ];

  const prixMini = vehicles?.length
    ? Math.min(...vehicles.map(v => Number(v.daily_price)))
    : null;

  return (
    <div className={styles.page}>
      {/* Bandeau : photo de couverture si elle existe, dégradé de marque sinon */}
      <div className={styles.cover} aria-hidden="true">
        {profile.cover_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.cover_url} alt="" className={styles.coverImg} />
            {/* Voile bas : garantit le contraste de l'avatar et du nom quelle
                que soit la photo choisie. */}
            <div className={styles.coverVoile} />
          </>
        ) : (
          <div className={styles.coverMotif} />
        )}
      </div>

      <div className="container">
        <header className={styles.entete}>
          <div className={styles.avatarAnneau}>
            <div className={styles.avatarImg}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={`Photo de ${profile.full_name}`} />
              ) : (
                <span>{profile.full_name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {profile.verification_status === 'verifie' && (
              <span className={styles.pastilleVerif} title="Identité vérifiée">✓</span>
            )}
          </div>

          <div className={styles.identite}>
            <div className={styles.identiteHaut}>
              <h1 className={styles.nom}>{profile.company_name || profile.full_name}</h1>
              {profile.type === 'professionnel' && (
                <span className={styles.chipPro}>Professionnel</span>
              )}
            </div>
            {profile.company_name && <p className={styles.sousNom}>{profile.full_name}</p>}

            <div className={styles.reperes}>
              {profile.city && <span className={styles.repere}>📍 {profile.city}</span>}
              <span className={styles.repere}>🗓️ Membre depuis {membreDepuis}</span>
              {prixMini !== null && (
                <span className={styles.repere}>💰 À partir de {prixMini} €/jour</span>
              )}
            </div>
          </div>

          {/* Bloc confiance — la note d'un coup d'œil */}
          <div className={styles.blocNote}>
            {noteMoyenne ? (
              <>
                <p className={styles.blocNoteValeur}>{noteMoyenne.toFixed(1)}</p>
                <p className={styles.blocNoteEtoiles}>
                  {'★'.repeat(Math.round(noteMoyenne))}
                  <span className={styles.etoilesVides}>{'★'.repeat(5 - Math.round(noteMoyenne))}</span>
                </p>
                <p className={styles.blocNoteLabel}>
                  {avis.length} avis client{avis.length > 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <>
                <p className={styles.blocNoteVide}>Nouveau</p>
                <p className={styles.blocNoteLabel}>Pas encore d&apos;avis</p>
              </>
            )}
          </div>
        </header>

        {/* Chiffres */}
        <div className={styles.statsGrid}>
          {chiffres.map((c, i) => (
            <div key={i} className={styles.statCard} style={{ ['--teinte' as string]: c.teinte }}>
              <span className={styles.statIcon}>{c.icon}</span>
              <div className={styles.statTexte}>
                <p className={styles.statValue}>{c.valeur}</p>
                <p className={styles.statLabel}>{c.label}</p>
                <p className={styles.statSub}>{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation interne */}
        <nav className={styles.ancres}>
          <a href="#annonces" className={styles.ancre}>
            Annonces <span className={styles.ancreCount}>{vehicles?.length ?? 0}</span>
          </a>
          <a href="#avis" className={styles.ancre}>
            Avis <span className={styles.ancreCount}>{avis.length}</span>
          </a>
        </nav>

        {/* Annonces */}
        <section id="annonces" className={styles.section}>
          <div className={styles.sectionEntete}>
            <h2 className={styles.sectionTitle}>Annonces publiées</h2>
            <span className={styles.sectionBadge}>{vehicles?.length ?? 0}</span>
          </div>
          {!vehicles?.length ? (
            <div className={styles.videCarte}>
              <div className={styles.videIcone}>🚗</div>
              <h3>Aucune annonce en ligne</h3>
              <p>Ce loueur n&apos;a pas de véhicule publié pour le moment.</p>
            </div>
          ) : (
            <div className={styles.vehiclesGrid}>
              {(vehicles as VehiculeCarte[]).map(v => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        {/* Avis */}
        <AvisSection
          avis={avis}
          noteMoyenne={noteMoyenne}
          aNoter={aNoter}
          connecte={Boolean(user)}
          estSonPropreProfil={user?.id === profile.id}
          nomLoueur={profile.full_name}
        />
      </div>
    </div>
  );
}
