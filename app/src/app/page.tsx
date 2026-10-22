import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import VehicleCard, { type VehiculeCarte } from '@/components/vehicles/VehicleCard';
import HeroSearch from './HeroSearch';
import { VILLES_GUYANE } from '@/types';
import styles from './page.module.css';

/** Catégories mises en avant — valeurs de l'enum `vehicle_category`. */
const CATEGORIES_VEDETTE = [
  { type: 'citadine', icon: '🚗', label: 'Citadines', desc: 'Pratiques en ville', color: '#3B82F6' },
  { type: 'berline', icon: '🚘', label: 'Berlines', desc: 'Confort et espace', color: '#0EA5E9' },
  { type: 'suv', icon: '🚙', label: 'SUV / 4x4', desc: "Pour l'intérieur", color: '#10B981' },
  { type: 'moto', icon: '🏍️', label: 'Motos', desc: 'Route & aventure', color: '#F59E0B' },
  { type: 'scooter', icon: '🛵', label: 'Scooters', desc: 'En ville facilement', color: '#8B5CF6' },
  { type: 'utilitaire', icon: '🚐', label: 'Utilitaires', desc: 'Déménagement & pro', color: '#EF4444' },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Véhicules mis en avant : les plus récemment publiés.
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*, vehicle_photos(url, position), owner:profiles!vehicles_owner_id_fkey(full_name, avatar_url, average_rating, verification_status)')
    .eq('status', 'en_ligne')
    .order('created_at', { ascending: false })
    .limit(4);

  const enVedette = (vehicles ?? []) as VehiculeCarte[];

  // Chiffres réels. Aucun compteur inventé : la barre de statistiques
  // disparaît tant qu'il n'y a rien à annoncer.
  const { data: tousEnLigne } = await supabase
    .from('vehicles')
    .select('city, owner_id')
    .eq('status', 'en_ligne');

  const nbVehicules = tousEnLigne?.length ?? 0;
  const nbVilles = new Set((tousEnLigne ?? []).map(v => v.city).filter(Boolean)).size;
  const nbLoueurs = new Set((tousEnLigne ?? []).map(v => v.owner_id)).size;

  return (
    <div className="page">
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgCircle1}/>
          <div className={styles.heroBgCircle2}/>
          <div className={styles.heroBgGrid}/>
        </div>

        {/* Visuel de marque en fond, couvrant toute la section.
            `.hero` est un conteneur flex : un enfant en flux normal se
            placerait À CÔTÉ du contenu. Le positionnement absolu est donc
            nécessaire pour couvrir toute la largeur.
            `priority` car l'image est au-dessus de la ligne de flottaison. */}
        <div className={styles.heroVisuel} aria-hidden="true">
          <Image
            src="/hero-vehicules.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroVisuelImage}
          />
          {/* Voile sombre : sans lui, le texte posé dessus serait illisible
              sur la moitié orange comme sur la moitié noire. */}
          <div className={styles.heroVoile} />
        </div>

        <div className={`container ${styles.heroContent}`}>
          <div className={`badge badge-primary ${styles.heroBadge}`}>
            🌴 La location de véhicules entre particuliers et pros en Guyane
          </div>
          <h1 className={styles.heroTitle}>
            Le véhicule qu&apos;il te faut,<br/>
            <span className="gradient-text">quand tu en as besoin.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Trouvez et réservez des voitures, 4x4, motos et utilitaires auprès de loueurs locaux
            vérifiés partout en Guyane.
          </p>

          <HeroSearch />

          {nbVehicules > 0 && (
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><strong>{nbVehicules}</strong><span>Véhicule{nbVehicules > 1 ? 's' : ''}</span></div>
              <div className={styles.heroStatDiv}/>
              <div className={styles.heroStat}><strong>{nbLoueurs}</strong><span>Loueur{nbLoueurs > 1 ? 's' : ''}</span></div>
              <div className={styles.heroStatDiv}/>
              <div className={styles.heroStat}><strong>{nbVilles}</strong><span>Ville{nbVilles > 1 ? 's' : ''} couverte{nbVilles > 1 ? 's' : ''}</span></div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className={`section-sm ${styles.categories}`}>
        <div className="container">
          <div className={styles.catGrid}>
            {CATEGORIES_VEDETTE.map(cat => (
              <Link key={cat.type} href={`/catalogue?type=${cat.type}`} className={styles.catCard}>
                <div className={styles.catIcon} style={{ background: `${cat.color}15`, color: cat.color }}>{cat.icon}</div>
                <div>
                  <p className={styles.catLabel}>{cat.label}</p>
                  <p className={styles.catDesc}>{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VEHICULES EN VEDETTE */}
      <section className="section">
        <div className="container">
          <div className={`flex-between ${styles.sectionHeader}`}>
            <div>
              <h2 className={styles.sectionTitle}>Véhicules disponibles</h2>
              <p className={styles.sectionSubtitle}>Les dernières annonces en Guyane</p>
            </div>
            <Link href="/catalogue" className="btn btn-outline">Voir tout →</Link>
          </div>
          {vehiclesError ? (
            <div className="empty-state" role="status"><h3>Les annonces sont momentanément indisponibles</h3><p>Nous ne pouvons pas vérifier les véhicules disponibles pour le moment.</p><Link href="/catalogue" className="btn btn-outline">Réessayer dans le catalogue</Link></div>
          ) : enVedette.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚗</div>
              <h3>Aucun véhicule publié pour le moment</h3>
              <p>Soyez le premier à proposer votre véhicule en Guyane.</p>
              <Link href="/loueur/vehicule/new" className="btn btn-primary">Publier un véhicule</Link>
            </div>
          ) : (
            <div className={styles.vehiclesGrid}>
              {enVedette.map(v => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`section ${styles.howSection}`}>
        <div className="container">
          <div className={styles.sectionCenter}>
            <h2 className={styles.sectionTitle}>Comment ça marche ?</h2>
            <p className={styles.sectionSubtitle}>En 3 étapes simples, trouvez et réservez votre véhicule</p>
          </div>
          <div className={styles.steps}>
            {[
              { step: '01', icon: '🔍', title: 'Cherchez', desc: 'Filtrez par ville, dates, catégorie et budget. Comparez les offres des loueurs locaux.' },
              { step: '02', icon: '📅', title: 'Réservez', desc: 'Choisissez votre véhicule, sélectionnez vos dates et envoyez votre demande. Le loueur confirme.' },
              { step: '03', icon: '🗝️', title: 'Roulez !', desc: 'Récupérez les clés au lieu convenu et profitez de votre véhicule en toute tranquillité.' },
            ].map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{s.step}</div>
                <div className={styles.stepIcon}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOUEUR CTA */}
      <section className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaBg}/>
            <div className={styles.ctaContent}>
              <h2>Vous avez un véhicule à louer ?</h2>
              <p>Rejoignez nos loueurs locaux et générez des revenus en mettant votre véhicule à disposition. Simple, sécurisé, rentable.</p>
              <div className={styles.ctaFeatures}>
                <span>✅ Inscription gratuite</span>
                <span>✅ Vous validez chaque demande</span>
                <span>✅ Paiement sécurisé</span>
              </div>
              <div className={styles.ctaBtns}>
                <Link href="/loueur/vehicule/new" className="btn btn-primary btn-lg">
                  Publier un véhicule
                </Link>
                <Link href="/catalogue" className="btn btn-outline btn-lg">
                  Parcourir les véhicules
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VILLES */}
      <section className="section-sm">
        <div className="container">
          <div className={styles.sectionCenter}>
            <h2 className={styles.sectionTitle}>Disponible partout en Guyane</h2>
          </div>
          <div className={styles.villesGrid}>
            {VILLES_GUYANE.map(ville => (
              <Link key={ville} href={`/catalogue?ville=${ville}`} className={styles.villeChip}>
                📍 {ville}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
