import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AvatarUpload from '@/components/profile/AvatarUpload';
import CoverUpload from '@/components/profile/CoverUpload';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Mon profil — ROULÉ' };

/** Espace personnel : photo de profil et informations du compte. */
export default async function ProfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/profil');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, cover_url, type, city, phone, company_name, verification_status, average_rating')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login?redirect=/profil');

  const infos = [
    { label: 'Nom', valeur: profile.full_name },
    { label: 'Adresse e-mail', valeur: user.email ?? '—' },
    { label: 'Téléphone', valeur: profile.phone || 'Non renseigné' },
    { label: 'Ville', valeur: profile.city || 'Non renseignée' },
    {
      label: 'Type de compte',
      valeur: profile.type === 'professionnel' ? 'Professionnel' : 'Particulier',
    },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className={styles.entete}>
          <h1 className={styles.titre}>Mon profil</h1>
          <p className={styles.sousTitre}>
            Votre photo apparaît sur vos annonces, vos avis et votre profil public.
          </p>
        </div>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.sectionTitre}>Photo de profil</h2>
          <AvatarUpload
            userId={profile.id}
            avatarUrl={profile.avatar_url}
            initiale={profile.full_name.charAt(0).toUpperCase()}
          />
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.sectionTitre}>Photo de couverture</h2>
          <p className={styles.texte}>
            Le bandeau en haut de votre profil public. Sans image, le dégradé
            aux couleurs de ROULÉ s&apos;affiche.
          </p>
          <CoverUpload userId={profile.id} coverUrl={profile.cover_url} />
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.sectionTitre}>Informations du compte</h2>
          <dl className={styles.infos}>
            {infos.map(i => (
              <div key={i.label} className={styles.infoLigne}>
                <dt>{i.label}</dt>
                <dd>{i.valeur}</dd>
              </div>
            ))}
          </dl>
          <p className="form-hint">
            La modification de ces informations n&apos;est pas encore disponible.
          </p>
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.sectionTitre}>Profil public</h2>
          <p className={styles.texte}>
            Voici la page que voient les clients lorsqu&apos;ils consultent vos annonces.
          </p>
          <Link href={`/loueurs/${profile.id}`} className="btn btn-outline">
            Voir mon profil public →
          </Link>
        </section>
      </div>
    </div>
  );
}
