import Link from 'next/link';
import styles from './legal.module.css';

/**
 * Champ que seule l'entreprise peut renseigner (SIRET, raison sociale…).
 *
 * Volontairement très visible : une mention légale incomplète mise en ligne
 * expose l'éditeur. Mieux vaut que le trou saute aux yeux qu'un texte
 * plausible mais faux.
 */
export function AC(_props: { children: React.ReactNode }) {
  return <span className={styles.aCompleter}>Information en cours de validation par l’éditeur.</span>;
}

const PAGES = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgu', label: 'Conditions d’utilisation' },
  { href: '/cgv', label: 'Conditions de vente' },
  { href: '/confidentialite', label: 'Confidentialité' },
];

interface Props {
  titre: string;
  miseAJour: string;
  chemin: string;
  children: React.ReactNode;
}

export default function LegalPage({ titre, miseAJour, chemin, children }: Props) {
  return (
    <div className="page">
      <div className="container">
        <div className={styles.entete}>
          <h1 className={styles.titre}>{titre}</h1>
          <p className={styles.maj}>Dernière mise à jour : {miseAJour}</p>
        </div>

        <nav className={styles.onglets}>
          {PAGES.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className={`${styles.onglet} ${p.href === chemin ? styles.ongletActif : ''}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <p className={styles.avis}>Document en cours de finalisation. Certains renseignements doivent encore être confirmés par l’éditeur.</p>
        <article className={styles.contenu}>{children}</article>
      </div>
    </div>
  );
}
