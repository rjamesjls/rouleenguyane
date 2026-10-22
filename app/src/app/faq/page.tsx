import Link from 'next/link';
import InformationPage from '@/components/layout/InformationPage';
export default function Page() { return <InformationPage title="Questions fréquentes">{[
  ['Puis-je louer et proposer mon véhicule avec le même compte ?', 'Oui. Votre compte donne accès à vos réservations et à l’espace loueur.'],
  ['Quels documents préparer ?', 'Présentez votre pièce d’identité et votre permis au propriétaire lors de la remise des clés. Aucun document d’identité n’est à téléverser sur JELOUE.'],
  ['La caution est-elle comprise dans le paiement ?', 'Non. La caution est remise directement au propriétaire selon les modalités convenues avec lui.'],
  ['Puis-je annuler une demande ?', 'Vous pouvez annuler une demande encore en attente depuis Mes réservations. Pour une location déjà confirmée, consultez les conditions applicables et convenez de la suite avec le loueur.'],
  ['Quand puis-je laisser un avis ?', 'Lorsque la location est terminée, depuis votre espace personnel.'],
].map(([question, answer]) => <details key={question} className="card" style={{ padding: 20 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>{question}</summary><p style={{ marginTop: 12 }}>{answer}</p></details>)}<Link href="/auth/forgot-password">J’ai oublié mon mot de passe</Link></InformationPage>; }
