'use client';

/**
 * Téléchargement du contrat en PDF.
 *
 * On passe par la boîte d'impression du navigateur plutôt que par une
 * bibliothèque de génération : « Enregistrer au format PDF » y est disponible
 * partout, y compris sur iOS et Android, et le document imprimé est exactement
 * celui affiché — pas une seconde mise en page à maintenir en parallèle.
 * La feuille de style `@media print` retire navigation, boutons et pied de page.
 */
export default function BoutonImprimer() {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      ⬇️ Télécharger en PDF
    </button>
  );
}
