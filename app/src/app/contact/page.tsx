import Link from 'next/link';
import InformationPage from '@/components/layout/InformationPage';
export default function Page() {
  const email = process.env.SUPPORT_EMAIL || 'contact@rouleenguyane.fr';
  return <InformationPage title="Contact et assistance"><p>Pour préparer votre location, consultez les informations de l’annonce et les conditions de votre réservation.</p><section><h2>Une question sur votre compte ?</h2><p><Link href="/faq">Consultez les questions fréquentes</Link> ou <Link href="/auth/forgot-password">réinitialisez votre mot de passe</Link>.</p></section><section><h2>Contacter JELOUE</h2>{email ? <a href={`mailto:${email}`}>{email}</a> : <p>Le canal de contact JELOUE n’est pas encore disponible. Ses coordonnées seront publiées ici dès leur confirmation par l’éditeur.</p>}</section></InformationPage>;
}
