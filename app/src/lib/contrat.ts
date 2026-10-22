/**
 * Clauses du contrat de location, communes au formulaire de signature et à la
 * consultation. Un seul texte : ce qui est affiché est ce qui est signé.
 *
 * Le contrat est régi par le droit commun du louage (articles 1708 et suivants
 * du Code civil) : la location entre particuliers n'est pas soumise au régime
 * des loueurs professionnels.
 */

export interface ParametresContrat {
  kmInclusParJour: number | null;
  jours: number;
  caution: number;
  conditionsParticulieres?: string | null;
}

export interface Clause {
  titre: string;
  paragraphes: string[];
}

export function clausesContrat({
  kmInclusParJour,
  jours,
  caution,
  conditionsParticulieres,
}: ParametresContrat): Clause[] {
  const kmTotal = kmInclusParJour != null ? kmInclusParJour * jours : null;

  const clauses: Clause[] = [
    {
      titre: 'Objet et cadre juridique',
      paragraphes: [
        'Le loueur met à disposition du locataire le véhicule désigné au présent contrat, aux conditions ci-après. Le locataire en a la garde juridique pendant toute la durée de la location.',
        'Le présent contrat est régi par le droit commun du louage de choses, articles 1708 et suivants du Code civil.',
      ],
    },
    {
      titre: 'Conducteurs autorisés',
      paragraphes: [
        'Seul le locataire désigné au présent contrat est autorisé à conduire le véhicule. Il déclare être titulaire d’un permis de conduire en cours de validité correspondant à la catégorie du véhicule.',
        'Le locataire a présenté au loueur, avant la remise des clés, une pièce d’identité et son permis de conduire. Aucun de ces documents n’est conservé par la plateforme.',
        'Toute conduite par un tiers non désigné engage la responsabilité pleine et entière du locataire et peut entraîner la déchéance des garanties d’assurance.',
      ],
    },
    {
      titre: 'Usage du véhicule',
      paragraphes: [
        'Le locataire s’engage à utiliser le véhicule en bon père de famille et conformément à sa destination normale.',
        'Sont notamment interdits : la sous-location, le transport de personnes ou de marchandises à titre onéreux, la participation à une compétition, le remorquage, l’apprentissage de la conduite, ainsi que tout usage sur circuit ou hors des voies ouvertes à la circulation.',
        'Le véhicule ne peut être conduit sous l’empire d’un état alcoolique ou sous l’influence de substances stupéfiantes.',
      ],
    },
    {
      titre: 'Assurance',
      paragraphes: [
        'Le loueur déclare que le véhicule est assuré au minimum au titre de la responsabilité civile obligatoire, et que son contrat d’assurance couvre la mise à disposition du véhicule dans les conditions du présent contrat.',
        'L’attestation d’assurance et la carte grise se trouvent à bord du véhicule.',
        'En cas de sinistre, le locataire s’engage à prévenir le loueur sans délai, à ne reconnaître aucune responsabilité, et à établir un constat amiable.',
      ],
    },
    {
      titre: 'Carburant',
      paragraphes: [
        'Le véhicule est restitué avec le même niveau de carburant qu’au départ, tel que constaté dans l’état des lieux. À défaut, le complément est à la charge du locataire.',
      ],
    },
    {
      titre: 'Kilométrage',
      paragraphes: [
        kmTotal != null
          ? `Le forfait comprend ${kmInclusParJour} km par jour, soit ${kmTotal} km pour la durée de la location. Tout kilomètre supplémentaire est facturé au locataire selon le tarif convenu entre les parties.`
          : 'Le kilométrage n’est pas limité pour cette location.',
        'Le kilométrage est relevé contradictoirement au départ et au retour, et consigné dans les états des lieux.',
      ],
    },
    {
      titre: 'Restitution',
      paragraphes: [
        'Le véhicule est restitué à la date, à l’heure et au lieu convenus, dans l’état où il a été remis, propre et avec l’ensemble de ses accessoires et documents de bord.',
        'Tout retard non convenu avec le loueur peut donner lieu à une indemnité correspondant au prix journalier de la location par jour entamé.',
        'La non-restitution du véhicule est susceptible de constituer un abus de confiance au sens de l’article 314-1 du Code pénal.',
      ],
    },
    {
      titre: 'Dépôt de garantie',
      paragraphes: [
        caution > 0
          ? `Un dépôt de garantie de ${caution.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} est remis directement au loueur lors de la prise en charge. Il ne transite pas par la plateforme JELOUE et n’est pas inclus dans le montant payé en ligne.`
          : 'Aucun dépôt de garantie n’est demandé pour cette location.',
        caution > 0
          ? 'Il est restitué au locataire au retour du véhicule, déduction faite le cas échéant des sommes dues au titre du carburant, du kilométrage supplémentaire, du nettoyage ou des dommages constatés dans l’état des lieux de retour.'
          : 'Les sommes éventuellement dues au titre du carburant, du kilométrage ou des dommages restent exigibles.',
        'Tout litige portant sur le dépôt de garantie oppose exclusivement le loueur et le locataire. JELOUE ne détient jamais ces sommes et ne peut pas les arbitrer.',
      ],
    },
    {
      titre: 'Amendes et infractions',
      paragraphes: [
        'Le locataire est responsable de toutes les infractions au Code de la route commises pendant la durée de la location, ainsi que des amendes et retraits de points correspondants.',
        'Le loueur, titulaire du certificat d’immatriculation, procède à la désignation du locataire comme conducteur auprès de l’Agence nationale de traitement automatisé des infractions (ANTAI) dans le délai légal de 45 jours.',
        'Font exception les forfaits post-stationnement : la réglementation ne permet pas d’en transférer la charge au conducteur, ils restent dus par le titulaire du certificat d’immatriculation. Le loueur peut néanmoins en demander le remboursement au locataire.',
      ],
    },
    {
      titre: 'Panne et immobilisation',
      paragraphes: [
        'En cas de panne ou d’immobilisation, le locataire prévient immédiatement le loueur et n’engage aucune réparation sans son accord préalable.',
        'Les frais d’entretien courant et les pannes d’usure demeurent à la charge du loueur. Les dommages résultant d’un usage non conforme sont à la charge du locataire.',
      ],
    },
    {
      titre: 'Rôle de la plateforme',
      paragraphes: [
        'JELOUE est un service de mise en relation. Elle n’est ni propriétaire du véhicule, ni loueur, ni partie au présent contrat, qui est conclu directement entre le loueur et le locataire.',
        'Elle encaisse le prix de la location et perçoit ses frais de service. Elle n’intervient ni dans le dépôt de garantie, ni dans l’exécution du contrat, ni dans le règlement des litiges qui en découlent.',
      ],
    },
  ];

  if (conditionsParticulieres?.trim()) {
    clauses.push({
      titre: 'Conditions particulières',
      paragraphes: [conditionsParticulieres.trim()],
    });
  }

  return clauses;
}
