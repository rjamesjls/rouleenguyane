import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>🚗 JE<span>LOUE</span></Link>
          <p className={styles.tagline}>Le véhicule qu'il te faut,<br/>quand tu en as besoin.</p>
          <p className={styles.copy}>Guyane française 🇫🇷</p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4>Découvrir</h4>
            <Link href="/catalogue">Tous les véhicules</Link>
            <Link href="/catalogue?type=citadine">Citadines</Link>
            <Link href="/catalogue?type=suv">4x4</Link>
            <Link href="/catalogue?type=moto">Motos & Scooters</Link>
            <Link href="/catalogue?type=utilitaire">Utilitaires</Link>
          </div>
          <div className={styles.col}>
            <h4>Loueurs</h4>
            <Link href="/auth/register?role=loueur_particulier">Devenir loueur</Link>
            <Link href="/loueur/dashboard">Tableau de bord</Link>
            <Link href="/loueur/vehicule/new">Ajouter un véhicule</Link>
          </div>
          <div className={styles.col}>
            <h4>Informations</h4>
            <Link href="/comment-ca-marche">Comment ça marche</Link>
            <Link href="/assurance">Assurance & garanties</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className={styles.col}>
            <h4>Légal</h4>
            <Link href="/cgv">CGV</Link>
            <Link href="/cgu">CGU</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} JELOUE — Tous droits réservés</p>
        <p>Fait avec ❤️ en Guyane française</p>
      </div>
    </footer>
  );
}
