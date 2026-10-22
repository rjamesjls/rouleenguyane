import type { Metadata } from 'next';
import LegalPage, { AC } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Mentions légales — JELOUE',
  description: 'Éditeur, hébergeur et informations légales de la plateforme JELOUE.',
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage titre="Mentions légales" miseAJour="22 octobre 2026" chemin="/mentions-legales">
      <h2>1. Éditeur du site</h2>
      <p>
        La plateforme <strong>JELOUE</strong> est éditée par :
      </p>
      <ul>
        <li>Dénomination sociale : <strong>JAMES LEGEND STUDIO - JLS</strong></li>
        <li>Forme juridique : <AC>forme juridique — mention obligatoire, absente de vos autres mentions</AC></li>
        <li>Capital social : <AC>montant — obligatoire pour une société</AC></li>
        <li>Siège social : 4 avenue Ya et Siong, CD 10 PK4, 97360 Mana, Guyane française</li>
        <li>SIRET : 853 012 615 00011</li>
        <li>SIREN : 853 012 615</li>
        <li>RCS : Cayenne 853 012 615</li>
        <li>Numéro de TVA intracommunautaire : <AC>numéro, ou mention de non-assujettissement</AC></li>
        <li>Adresse électronique : <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a></li>
        <li>Téléphone : <AC>numéro</AC></li>
      </ul>

      <h2>2. Direction de la publication</h2>
      <p>
        Directeur de la publication : <strong>Romario JAMES</strong>
      </p>

      <h2>3. Hébergement</h2>
      <p>
        L’application est hébergée par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
        Walnut, CA 91789, États-Unis —{' '}
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
      </p>
      <p>
        Les données de la plateforme (comptes, annonces, réservations) sont stockées par{' '}
        <strong>Supabase</strong>, sur une infrastructure située dans l’Union européenne
        (région <em>eu-west-1</em>, Irlande).
      </p>
      <p>
        Les paiements sont traités par <strong>Stripe</strong>. Aucune donnée de carte
        bancaire ne transite par nos serveurs ni n’y est conservée.
      </p>

      <h2>4. Nature du service</h2>
      <p>
        JELOUE est une <strong>plateforme de mise en relation</strong> entre des personnes
        souhaitant louer un véhicule et des propriétaires — particuliers ou professionnels —
        proposant leur véhicule à la location en Guyane française.
      </p>
      <p>
        JELOUE <strong>n’est pas propriétaire des véhicules</strong> proposés, n’est pas
        loueur, et n’est pas partie au contrat de location conclu entre le locataire et le
        propriétaire. Son rôle se limite à l’hébergement des annonces, à la mise en relation
        et à l’encaissement du paiement.
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        La structure du site, sa charte graphique, ses textes et son code sont la propriété
        de l’éditeur. Toute reproduction ou représentation, totale ou partielle, sans
        autorisation écrite préalable est interdite.
      </p>
      <p>
        Les photographies de véhicules sont publiées par les propriétaires, qui garantissent
        détenir les droits nécessaires à leur diffusion.
      </p>

      <h2>6. Signalement de contenu</h2>
      <p>
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie
        numérique, tout contenu manifestement illicite peut être signalé à l’adresse{' '}
        <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a>. Le signalement doit identifier précisément le
        contenu concerné et le motif du signalement.
      </p>

      <h3>Contact pour les données personnelles</h3>
      <p>
        Pour toute question relative à vos données personnelles :{' '}
        <a href="mailto:contact@rouleenguyane.fr">contact@rouleenguyane.fr</a>
      </p>

      <h2>7. Médiation de la consommation</h2>
      <p>
        Conformément à l’article L.612-1 du Code de la consommation, tout consommateur peut
        recourir gratuitement à un médiateur de la consommation en vue de la résolution
        amiable d’un litige. Le médiateur désigné est : <AC>nom et coordonnées du médiateur
        agréé</AC>.
      </p>
      <p>
        La plateforme européenne de règlement en ligne des litiges est accessible à
        l’adresse{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>
    </LegalPage>
  );
}
