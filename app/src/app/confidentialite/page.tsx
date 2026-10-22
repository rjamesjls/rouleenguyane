import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — JELOUE',
  description: 'Données collectées par JELOUE, finalités, durées de conservation et vos droits.',
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      titre="Politique de confidentialité"
      miseAJour="22 octobre 2026"
      chemin="/confidentialite"
    >
      <h2>1. Responsable de traitement</h2>
      <p>
        Le responsable du traitement est <strong>JAMES LEGEND STUDIO - JLS</strong>, dont le
        siège social est situé 4 avenue Ya et Siong, CD 10 PK4, 97360 Mana, Guyane française.
      </p>
      <p>
        Contact pour toute question relative aux données personnelles :{' '}
        <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a>
      </p>

      <h2>2. Données collectées</h2>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Données</th>
            <th>Origine</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compte</td>
            <td>Adresse électronique, mot de passe (chiffré), nom, téléphone, ville, type de compte, SIRET pour les professionnels</td>
            <td>Vous</td>
          </tr>
          <tr>
            <td>Profil public</td>
            <td>Photo de profil, photo de couverture, note moyenne</td>
            <td>Vous</td>
          </tr>
          <tr>
            <td>Annonces</td>
            <td>Caractéristiques du véhicule, <strong>plaque d’immatriculation</strong>, adresse de prise en charge, photographies</td>
            <td>Loueur</td>
          </tr>
          <tr>
            <td>Réservations</td>
            <td>Dates, durée, montants, statut</td>
            <td>Généré par le service</td>
          </tr>
          <tr>
            <td>Paiements</td>
            <td>Montant, devise, statut, identifiant de transaction Stripe</td>
            <td>Stripe</td>
          </tr>
          <tr>
            <td>Avis</td>
            <td>Note, commentaire, date</td>
            <td>Vous</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Nous ne collectons aucune donnée de carte bancaire.</strong> Elles sont
        saisies directement chez Stripe et ne transitent jamais par nos serveurs.
      </p>
      <p>
        <strong>Nous n’hébergeons aucune pièce d’identité ni permis de conduire.</strong> Ces
        documents sont vérifiés en personne entre le locataire et le loueur.
      </p>

      <h2>3. Finalités et bases légales</h2>
      <table>
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Base légale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Créer et gérer votre compte</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Publier les annonces et permettre les réservations</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Traiter les paiements et la commission</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Afficher les avis et la réputation des loueurs</td>
            <td>Intérêt légitime : confiance entre utilisateurs</td>
          </tr>
          <tr>
            <td>Prévenir la fraude et les abus</td>
            <td>Intérêt légitime : sécurité du service</td>
          </tr>
          <tr>
            <td>Conserver les pièces comptables</td>
            <td>Obligation légale</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Destinataires</h2>
      <p>Vos données sont accessibles :</p>
      <ul>
        <li>
          aux <strong>autres utilisateurs</strong>, dans la limite nécessaire à la location :
          le loueur voit le nom et le téléphone du locataire ayant réservé ; le locataire voit
          le profil public du loueur ;
        </li>
        <li>
          au personnel habilité de JELOUE, pour l’administration du service ;
        </li>
        <li>à nos sous-traitants, listés ci-dessous.</li>
      </ul>
      <p>
        Sont <strong>publics</strong> : votre nom, votre photo de profil et de couverture,
        votre ville, votre statut de vérification, votre note et les avis vous concernant.
        Ne sont jamais publics : votre adresse électronique, votre téléphone et vos
        coordonnées bancaires.
      </p>

      <h2>5. Sous-traitants</h2>
      <table>
        <thead>
          <tr>
            <th>Prestataire</th>
            <th>Rôle</th>
            <th>Localisation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Base de données, authentification, stockage des images</td>
            <td>Union européenne (Irlande)</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Traitement des paiements</td>
            <td>Union européenne (Irlande) et États-Unis</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Hébergement de l’application</td>
            <td>États-Unis</td>
          </tr>
        </tbody>
      </table>
      <p>
        La <strong>base de données</strong> — comptes, annonces, réservations, avis — est
        hébergée dans l’Union européenne (Irlande) et n’en sort pas.
      </p>
      <p>
        L’<strong>application</strong> est servie depuis l’infrastructure de Vercel Inc.,
        société établie aux États-Unis. Les transferts hors Union européenne réalisés par
        Vercel et par Stripe sont encadrés par les clauses contractuelles types de la
        Commission européenne, complétées le cas échéant par le cadre de protection des
        données UE–États-Unis (<em>Data Privacy Framework</em>).
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Compte</strong> : jusqu’à sa suppression par vos soins, puis suppression ou
          anonymisation.
        </li>
        <li>
          <strong>Réservations et paiements</strong> : dix ans à compter de la clôture de
          l’exercice, conformément aux obligations comptables.
        </li>
        <li>
          <strong>Avis</strong> : conservés tant qu’ils sont affichés ; en cas de suppression
          de compte, ils peuvent être conservés sous forme anonymisée.
        </li>
        <li>
          <strong>Annonces</strong> : jusqu’à leur suppression par le loueur.
        </li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        JELOUE n’utilise <strong>aucun cookie publicitaire ni traceur d’audience tiers</strong>.
        Seuls sont déposés les cookies strictement nécessaires au fonctionnement du service :
        maintien de votre session authentifiée et mémorisation du thème clair ou sombre.
      </p>
      <p>
        Ces cookies étant indispensables au service, ils ne requièrent pas votre consentement
        préalable. Aucun bandeau de consentement n’est donc affiché.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, de
        portabilité et d’opposition. Vous pouvez les exercer en écrivant à{' '}
        <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a>, en justifiant de votre identité.
      </p>
      <p>
        Certaines données ne peuvent être effacées immédiatement lorsqu’une obligation légale
        impose leur conservation, notamment les pièces comptables liées à une location payée.
      </p>
      <p>
        Vous pouvez introduire une réclamation auprès de la Commission nationale de
        l’informatique et des libertés (CNIL),{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
        .
      </p>

      <h2>9. Sécurité</h2>
      <p>
        Les accès aux données sont cloisonnés au niveau de la base par des règles de sécurité
        appliquées à chaque requête : un utilisateur ne peut lire ou modifier que les données
        qui le concernent. Les mots de passe sont stockés sous forme chiffrée et ne sont
        jamais accessibles en clair.
      </p>

      <h2>10. Modification</h2>
      <p>
        La présente politique peut être modifiée. Toute modification substantielle vous sera
        signalée.
      </p>
    </LegalPage>
  );
}
