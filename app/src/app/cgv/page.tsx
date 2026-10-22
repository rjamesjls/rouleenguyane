import type { Metadata } from 'next';
import LegalPage, { AC } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Conditions générales de vente — JELOUE',
  description: 'Prix, commission, paiement, annulation et remboursement sur JELOUE.',
};

export default function CgvPage() {
  return (
    <LegalPage
      titre="Conditions générales de vente"
      miseAJour="22 octobre 2026"
      chemin="/cgv"
    >
      <h2>1. Champ d’application</h2>
      <p>
        Les présentes conditions régissent les prestations facturées par JELOUE, à savoir le
        service d’intermédiation permettant de réserver et de payer une location de véhicule.
      </p>
      <p>
        Le <strong>contrat de location lui-même est conclu directement entre le locataire et
        le loueur</strong>. JELOUE n’y est pas partie et n’en garantit pas l’exécution.
      </p>

      <h2>2. Prix</h2>
      <p>Le montant total affiché avant paiement se compose de :</p>
      <table>
        <thead>
          <tr>
            <th>Élément</th>
            <th>Détermination</th>
            <th>Bénéficiaire</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Prix de la location</td>
            <td>Prix journalier fixé par le loueur × nombre de jours</td>
            <td>Loueur</td>
          </tr>
          <tr>
            <td>Frais de service</td>
            <td>15 % du prix de la location, avec un minimum de 2 €</td>
            <td>JELOUE</td>
          </tr>
          <tr>
            <td>Dépôt de garantie</td>
            <td>Fixé par le loueur — <strong>hors paiement en ligne</strong></td>
            <td>Loueur, en direct</td>
          </tr>
        </tbody>
      </table>
      <p>
        Les prix sont exprimés en euros. Le détail complet est affiché avant toute
        confirmation ; aucun montant n’est prélevé sans validation explicite du locataire.
      </p>
      <p>
        Le taux des frais de service peut évoluer. Le taux applicable est celui affiché au
        moment de la réservation.
      </p>

      <h2>3. Dépôt de garantie</h2>
      <p>
        Le dépôt de garantie <strong>n’est pas inclus dans le montant payé en ligne</strong> et
        ne fait l’objet d’aucun prélèvement par JELOUE.
      </p>
      <p>
        Il est remis directement au loueur à la prise en charge du véhicule, et restitué par
        lui selon les modalités convenues entre les parties. JELOUE ne détient jamais ces
        sommes et ne peut donc ni les retenir, ni les restituer, ni arbitrer un litige les
        concernant.
      </p>

      <h2>4. Processus de commande</h2>
      <ul>
        <li>le locataire adresse une demande de réservation en sélectionnant ses dates ;</li>
        <li>le loueur accepte ou refuse la demande ;</li>
        <li>après acceptation, le locataire procède au paiement ;</li>
        <li>la réservation est ferme une fois le paiement encaissé.</li>
      </ul>
      <p>
        Aucun paiement n’est demandé tant que le loueur n’a pas accepté la demande.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s’effectue en ligne par carte bancaire via <strong>Stripe</strong>,
        prestataire de services de paiement. Les données de carte sont saisies directement
        sur une page sécurisée opérée par Stripe : elles ne transitent pas par les serveurs
        de JELOUE et n’y sont jamais enregistrées.
      </p>
      <p>
        La confirmation du paiement est établie par la notification de Stripe, seule faisant
        foi.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l’<strong>article L.221-28 12° du Code de la consommation</strong>, le
        droit de rétractation de quatorze jours ne s’applique pas aux prestations de location
        de voitures devant être fournies à une date ou à une période déterminée.
      </p>
      <p>
        En conséquence, la réservation d’un véhicule pour des dates précises n’ouvre pas
        droit à rétractation. Les conditions d’annulation prévues à l’article 7 restent
        applicables.
      </p>
      <p>
        <AC>faire confirmer par un juriste l’articulation de cette exception selon que le
        loueur est un particulier ou un professionnel</AC>
      </p>

      <h2>7. Annulation</h2>
      <p>
        <AC>définir le barème d’annulation : délai avant le départ, part remboursée, sort des
        frais de service — puis me demander de l’implémenter, le code ne gère aujourd’hui
        aucun remboursement automatique</AC>
      </p>
      <p>
        En cas d’annulation par le <strong>loueur</strong>, le locataire est remboursé de
        l’intégralité des sommes versées à JELOUE, frais de service compris.
      </p>
      <p>
        En cas d’indisponibilité du véhicule à la date convenue, le locataire peut refuser la
        location et prétendre au remboursement intégral.
      </p>

      <h2>8. Remboursements</h2>
      <p>
        Les remboursements sont effectués via Stripe, sur le moyen de paiement d’origine. Le
        délai de mise à disposition des fonds dépend de l’établissement bancaire du
        locataire.
      </p>

      <h2>9. Facturation</h2>
      <p>
        Un justificatif de paiement est disponible depuis l’espace personnel du locataire.{' '}
        <AC>préciser si une facture est émise pour les frais de service, et son format</AC>
      </p>

      <h2>10. Obligations du loueur</h2>
      <p>
        Le loueur s’engage à mettre le véhicule à disposition dans l’état et aux conditions
        annoncés, à la date et au lieu convenus, avec les documents de bord obligatoires
        (carte grise, attestation d’assurance).
      </p>
      <p>
        Le loueur perçoit le prix de la location déduction faite des frais de service.{' '}
        <AC>préciser le délai et les modalités de reversement au loueur</AC>
      </p>

      <h2>11. Obligations du locataire</h2>
      <p>
        Le locataire s’engage à présenter une pièce d’identité et un permis de conduire
        valides, à utiliser le véhicule en bon père de famille, à respecter le kilométrage
        inclus indiqué et à restituer le véhicule à la date convenue dans l’état où il l’a
        reçu.
      </p>

      <h2>12. Réclamations</h2>
      <p>
        Toute réclamation peut être adressée à <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a>. À défaut de
        solution amiable, le consommateur peut saisir le médiateur de la consommation
        mentionné dans les mentions légales.
      </p>

      <h2>13. Droit applicable</h2>
      <p>
        Les présentes sont soumises au droit français.
      </p>
    </LegalPage>
  );
}
