import type { Metadata } from 'next';
import LegalPage, { AC } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation — JELOUE',
  description: 'Règles d’utilisation de la plateforme JELOUE : comptes, annonces, réservations et avis.',
};

export default function CguPage() {
  return (
    <LegalPage
      titre="Conditions générales d’utilisation"
      miseAJour="28 juillet 2026"
      chemin="/cgu"
    >
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l’accès et l’utilisation de la plateforme JELOUE,
        accessible à l’adresse jeloue.fr. Toute inscription vaut acceptation sans réserve des
        présentes.
      </p>
      <p>
        JELOUE met en relation des <strong>locataires</strong> et des{' '}
        <strong>propriétaires de véhicules</strong> (ci-après « loueurs ») en Guyane
        française. JELOUE n’est ni propriétaire, ni loueur, ni partie au contrat de location.
      </p>

      <h2>2. Inscription et compte</h2>
      <p>
        L’inscription est gratuite et réservée aux personnes physiques majeures capables, ou
        aux personnes morales régulièrement immatriculées.
      </p>
      <p>
        L’utilisateur s’engage à fournir des informations exactes et à les maintenir à jour.
        Il est seul responsable de la confidentialité de ses identifiants et de toute action
        effectuée depuis son compte.
      </p>
      <p>
        Un même utilisateur peut être à la fois locataire et loueur. Un compte peut être de
        type <strong>particulier</strong> ou <strong>professionnel</strong> ; les
        professionnels doivent renseigner leur numéro SIRET.
      </p>

      <h2>3. Vérification des documents</h2>
      <p>
        <strong>JELOUE n’héberge ni ne vérifie aucun document d’identité ou permis de
        conduire.</strong> La vérification de la pièce d’identité et de la validité du permis
        de conduire du locataire relève de la <strong>responsabilité exclusive du loueur</strong>,
        au moment de la remise des clés.
      </p>
      <p>
        Le loueur doit s’assurer, avant toute remise du véhicule, que le locataire est
        titulaire d’un permis en cours de validité correspondant à la catégorie du véhicule,
        et qu’il satisfait aux éventuelles conditions d’âge ou d’ancienneté de permis fixées
        dans l’annonce.
      </p>

      <h2>4. Publication d’une annonce</h2>
      <p>Le loueur publie sous sa seule responsabilité. Il garantit :</p>
      <ul>
        <li>
          être propriétaire du véhicule ou disposer du droit de le mettre en location ;
        </li>
        <li>
          que le véhicule est en <strong>état de circuler</strong>, entretenu, et dispose
          d’un contrôle technique en cours de validité lorsqu’il est exigible ;
        </li>
        <li>
          que le véhicule est couvert par une <strong>assurance autorisant expressément la
          location à des tiers</strong> (voir article 5) ;
        </li>
        <li>
          que les informations de l’annonce — état, kilométrage inclus, conditions, prix —
          sont exactes et non trompeuses.
        </li>
      </ul>
      <p>
        Le loueur maîtrise la publication de son annonce : il peut la mettre en ligne, la
        retirer ou l’archiver à tout moment depuis son tableau de bord. JELOUE se réserve le
        droit de suspendre une annonce manifestement non conforme aux présentes.
      </p>

      <h2>5. Assurance</h2>
      <p>
        <strong>Point essentiel :</strong> un contrat d’assurance automobile classique ne
        couvre généralement pas la mise en location du véhicule à des tiers. Il appartient au
        loueur de vérifier auprès de son assureur que son contrat autorise cette activité, et
        le cas échéant de souscrire une garantie adaptée.
      </p>
      <p>
        <AC>préciser ici si JELOUE propose une couverture partenaire, ou indiquer clairement
        qu’aucune assurance n’est fournie par la plateforme</AC>
      </p>
      <p>
        En l’absence de couverture adaptée, le loueur assume seul les conséquences d’un
        sinistre survenu pendant la location.
      </p>

      <h2>6. Réservation</h2>
      <p>
        Le locataire adresse une demande de réservation en sélectionnant des dates. Cette
        demande <strong>ne vaut pas réservation ferme</strong> : elle doit être acceptée par
        le loueur. La réservation ne devient définitive qu’après acceptation{' '}
        <strong>et</strong> paiement.
      </p>
      <p>
        La plateforme vérifie automatiquement qu’aucune réservation active ne chevauche les
        dates demandées, ainsi que la durée minimale de location fixée par le loueur.
      </p>

      <h2>7. Dépôt de garantie</h2>
      <p>
        Le loueur fixe librement le montant du dépôt de garantie (caution), qui est indiqué
        sur l’annonce à titre informatif.
      </p>
      <p>
        <strong>JELOUE n’encaisse, ne détient et ne restitue aucun dépôt de garantie.</strong>{' '}
        Le dépôt est remis directement par le locataire au loueur, selon les modalités
        convenues entre eux (espèces, chèque, empreinte bancaire ou tout autre moyen), et
        restitué de la même manière.
      </p>
      <p>
        Les conditions de constitution, de retenue et de restitution du dépôt relèvent
        exclusivement du contrat de location conclu entre le locataire et le loueur. Tout
        litige portant sur le dépôt oppose ces deux seules parties ; JELOUE n’y est pas
        partie et ne dispose d’aucun moyen d’action sur les sommes concernées.
      </p>

      <h2>8. Avis</h2>
      <p>
        Seuls les utilisateurs ayant effectivement mené une location à son terme peuvent
        déposer un avis, à raison d’<strong>un seul avis par location</strong>. Cette
        restriction est appliquée techniquement.
      </p>
      <p>
        Les avis engagent leur auteur. Sont interdits les propos injurieux, diffamatoires,
        discriminatoires, ou sans rapport avec la location concernée. JELOUE peut supprimer
        un avis contrevenant aux présentes.
      </p>

      <h2>9. Comportements interdits</h2>
      <ul>
        <li>contourner la plateforme pour éviter la commission ;</li>
        <li>publier un véhicule non assuré, non entretenu ou non autorisé à la location ;</li>
        <li>usurper l’identité d’un tiers ou créer des comptes multiples trompeurs ;</li>
        <li>publier des contenus illicites, ou extraire massivement les données du site ;</li>
        <li>utiliser le véhicule loué à des fins illicites ou en dehors des conditions prévues.</li>
      </ul>

      <h2>10. Responsabilité</h2>
      <p>
        JELOUE fournit un service d’intermédiation. Elle n’est pas responsable de l’état des
        véhicules, de l’exécution du contrat de location, des dommages matériels ou corporels
        survenus pendant la location, ni des litiges entre locataire et loueur.
      </p>
      <p>
        JELOUE met en œuvre les moyens raisonnables pour assurer la disponibilité du service,
        sans garantie d’absence d’interruption.
      </p>

      <h2>11. Suspension et résiliation</h2>
      <p>
        L’utilisateur peut fermer son compte à tout moment. JELOUE peut suspendre ou
        supprimer un compte en cas de manquement aux présentes, après information préalable
        sauf urgence ou manquement grave.
      </p>

      <h2>12. Modification des conditions</h2>
      <p>
        JELOUE peut modifier les présentes. Les utilisateurs sont informés des modifications
        substantielles ; l’usage continu du service vaut acceptation.
      </p>

      <h2>13. Droit applicable</h2>
      <p>
        Les présentes sont soumises au droit français. À défaut de résolution amiable, et
        après recours éventuel au médiateur de la consommation, le litige sera porté devant
        les juridictions compétentes.
      </p>
    </LegalPage>
  );
}
