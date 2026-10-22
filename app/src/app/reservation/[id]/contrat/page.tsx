import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { clausesContrat } from '@/lib/contrat';
import BoutonImprimer from './BoutonImprimer';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Contrat de location — JELOUE' };

const BUCKET = 'inspections';
/** Les URL signées expirent : ces documents ne doivent pas devenir publics. */
const VALIDITE_URL = 60 * 10;

const CARBURANT = ['Vide', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Plein'];

interface Snapshot {
  etabli_le?: string;
  conditions_particulieres?: string | null;
  acceptations?: {
    loueur?: { nom: string | null; accepte_le: string };
    locataire?: { nom: string | null; accepte_le: string };
  };
}

/**
 * Contrat de location, consultable par les DEUX parties.
 *
 * Avant la remise, il affiche les conditions telles qu'elles seront signées :
 * le locataire doit pouvoir les lire avant de se déplacer, pas les découvrir
 * sur le téléphone du loueur au moment de prendre les clés.
 * Après signature, il affiche le document figé, les constats et les photos.
 */
export default async function ContratConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/reservation/${id}/contrat`);

  // La RLS ne renvoie la réservation qu'aux deux parties : pas de garde
  // supplémentaire nécessaire ici, contrairement à la page d'établissement.
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, owner_id, renter_id, status, start_date, end_date, total_days,
      daily_price, subtotal, service_fee, deposit_amount, total_amount,
      vehicle:vehicles(brand, model, year, license_plate, city, address,
                       mileage_limit_per_day, description),
      renter:profiles!bookings_renter_id_fkey(full_name, phone),
      owner:profiles!bookings_owner_id_fkey(full_name, phone, company_name),
      inspections(id, type, mileage, fuel_level, is_clean, damages, comments,
                  contract_snapshot, owner_signature_path, renter_signature_path,
                  owner_signed_at, created_at)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  const estLoueur = booking.owner_id === user.id;
  const v = booking.vehicle;
  const inspections = [...booking.inspections].sort((a, b) =>
    a.type === 'depart' ? -1 : b.type === 'depart' ? 1 : 0
  );
  const depart = inspections.find(i => i.type === 'depart');

  // Photos et signatures vivent dans un bucket privé : on ne peut pas les
  // afficher par URL directe, il faut des liens signés à durée limitée.
  const photosParInspection = new Map<string, string[]>();
  const signatures = new Map<string, { loueur?: string; client?: string }>();

  for (const insp of inspections) {
    const { data: lignes } = await supabase
      .from('inspection_photos')
      .select('path')
      .eq('inspection_id', insp.id)
      .order('position');

    if (lignes?.length) {
      const { data: urls } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(lignes.map(l => l.path), VALIDITE_URL);
      photosParInspection.set(
        insp.id,
        (urls ?? []).map(u => u.signedUrl).filter(Boolean) as string[]
      );
    }

    const chemins = [insp.owner_signature_path, insp.renter_signature_path]
      .filter((c): c is string => Boolean(c));
    if (chemins.length) {
      const { data: urls } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(chemins, VALIDITE_URL);
      signatures.set(insp.id, {
        loueur: urls?.[0]?.signedUrl ?? undefined,
        client: urls?.[1]?.signedUrl ?? undefined,
      });
    }
  }

  const snapshot = (depart?.contract_snapshot ?? null) as Snapshot | null;

  // Les clauses affichées viennent du contrat figé quand il existe. Avant
  // signature, elles sont projetées depuis la réservation : le locataire lit
  // alors exactement ce qu'il signera.
  const clauses = clausesContrat({
    kmInclusParJour: v?.mileage_limit_per_day ?? null,
    jours: booking.total_days,
    caution: Number(booking.deposit_amount ?? 0),
    conditionsParticulieres: snapshot?.conditions_particulieres ?? null,
  });

  const acceptations = snapshot?.acceptations ?? null;

  return (
    <div className="page">
      <div className="container">
        <div className={styles.entete}>
          <h1 className={styles.titre}>Contrat de location</h1>
          {depart ? (
            <p className={styles.signe}>
              ✓ Signé par les deux parties le {formatDate(depart.created_at)}
            </p>
          ) : (
            <p className={styles.attente}>
              Ce contrat sera signé par les deux parties à la remise des clés.
            </p>
          )}
        </div>

        {!depart && (
          <div className={styles.avis}>
            📄 Prenez connaissance de ces conditions avant votre rendez-vous. Le loueur
            complétera l&apos;état du véhicule sur place, puis vous signerez tous les deux.
          </div>
        )}

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>Les parties</h2>
          <div className={styles.grille}>
            <div>
              <p className={styles.cle}>Loueur</p>
              <p className={styles.valeur}>
                {booking.owner?.company_name || booking.owner?.full_name}
              </p>
              {booking.owner?.phone && <p className={styles.detail}>{booking.owner.phone}</p>}
            </div>
            <div>
              <p className={styles.cle}>Locataire</p>
              <p className={styles.valeur}>{booking.renter?.full_name}</p>
              {booking.renter?.phone && <p className={styles.detail}>{booking.renter.phone}</p>}
            </div>
          </div>
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>Le véhicule</h2>
          <div className={styles.grille}>
            <div><p className={styles.cle}>Véhicule</p><p className={styles.valeur}>{v?.brand} {v?.model} {v?.year}</p></div>
            <div><p className={styles.cle}>Immatriculation</p><p className={styles.valeur}>{v?.license_plate}</p></div>
            <div><p className={styles.cle}>Prise en charge</p><p className={styles.valeur}>{v?.address || v?.city}</p></div>
            <div><p className={styles.cle}>Km inclus / jour</p><p className={styles.valeur}>{v?.mileage_limit_per_day ?? 'Illimité'}</p></div>
          </div>
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>Conditions financières</h2>
          <table className={styles.table}>
            <tbody>
              <tr><td>Période</td><td>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</td></tr>
              <tr><td>Durée</td><td>{booking.total_days} jour{booking.total_days > 1 ? 's' : ''}</td></tr>
              <tr><td>Prix journalier</td><td>{formatCurrency(Number(booking.daily_price))}</td></tr>
              <tr><td>Sous-total</td><td>{formatCurrency(Number(booking.subtotal))}</td></tr>
              <tr><td>Frais de service</td><td>{formatCurrency(Number(booking.service_fee))}</td></tr>
              <tr className={styles.total}>
                <td><strong>Total payé en ligne</strong></td>
                <td><strong>{formatCurrency(Number(booking.total_amount))}</strong></td>
              </tr>
            </tbody>
          </table>
          {Number(booking.deposit_amount) > 0 && (
            <p className={styles.avisCaution}>
              🔒 Caution de <strong>{formatCurrency(Number(booking.deposit_amount))}</strong> à
              remettre directement au loueur, restituée au retour du véhicule. Elle ne transite
              pas par JELOUE et n&apos;est pas incluse dans le total ci-dessus.
            </p>
          )}
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>Conditions du contrat</h2>
          {clauses.map((c, i) => (
            <article key={i} className={styles.clause}>
              <h3 className={styles.clauseTitre}>{i + 1}. {c.titre}</h3>
              {c.paragraphes.map((p, j) => (
                <p key={j} className={styles.clauseTexte}>{p}</p>
              ))}
            </article>
          ))}
        </section>

        {acceptations && (
          <section className={`${styles.carte} card`}>
            <h2 className={styles.section}>Acceptation des conditions</h2>
            <p className={styles.clauseTexte}>
              ✓ <strong>{acceptations.loueur?.nom}</strong> (loueur) a déclaré avoir lu et
              accepté le contrat le {formatDate(acceptations.loueur?.accepte_le ?? '')}.
            </p>
            <p className={styles.clauseTexte}>
              ✓ <strong>{acceptations.locataire?.nom}</strong> (locataire) a déclaré avoir lu
              et accepté le contrat, et avoir présenté une pièce d&apos;identité et un permis
              de conduire en cours de validité, le{' '}
              {formatDate(acceptations.locataire?.accepte_le ?? '')}.
            </p>
          </section>
        )}

        {/* ── États des lieux signés ── */}
        {inspections.map(insp => {
          const sign = signatures.get(insp.id);
          const photos = photosParInspection.get(insp.id) ?? [];
          return (
            <section key={insp.id} className={`${styles.carte} card`}>
              <h2 className={styles.section}>
                État des lieux de {insp.type === 'depart' ? 'départ' : 'retour'}
                <span className={styles.dateSection}> — {formatDate(insp.created_at)}</span>
              </h2>
              <div className={styles.grille}>
                <div><p className={styles.cle}>Kilométrage</p><p className={styles.valeur}>{insp.mileage ?? '—'} km</p></div>
                <div><p className={styles.cle}>Carburant</p><p className={styles.valeur}>{insp.fuel_level != null ? CARBURANT[insp.fuel_level] : '—'}</p></div>
                <div><p className={styles.cle}>Propreté</p><p className={styles.valeur}>{insp.is_clean ? 'Propre' : 'À nettoyer'}</p></div>
              </div>
              {insp.damages && (
                <>
                  <p className={styles.cle} style={{ marginTop: 14 }}>Dommages constatés</p>
                  <p className={styles.texteLibre}>{insp.damages}</p>
                </>
              )}
              {insp.comments && (
                <>
                  <p className={styles.cle} style={{ marginTop: 14 }}>Observations</p>
                  <p className={styles.texteLibre}>{insp.comments}</p>
                </>
              )}

              {photos.length > 0 && (
                <>
                  <p className={styles.cle} style={{ marginTop: 16 }}>Photos ({photos.length})</p>
                  <div className={styles.photos}>
                    {photos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt={`Photo ${i + 1}`} className={styles.photo} />
                    ))}
                  </div>
                </>
              )}

              {(sign?.loueur || sign?.client) && (
                <div className={styles.signatures}>
                  {sign.loueur && (
                    <div className={styles.signature}>
                      <p className={styles.cle}>Loueur</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sign.loueur} alt="Signature du loueur" />
                    </div>
                  )}
                  {sign.client && (
                    <div className={styles.signature}>
                      <p className={styles.cle}>Locataire</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sign.client} alt="Signature du locataire" />
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

        <div className={styles.pied}>
          <BoutonImprimer />
          <Link href={estLoueur ? '/loueur/dashboard' : '/dashboard'} className="btn btn-outline">
            ← Retour {estLoueur ? 'à l’espace loueur' : 'à mes réservations'}
          </Link>
          <Link href="/cgv" className="btn btn-ghost">Conditions générales</Link>
        </div>
      </div>
    </div>
  );
}
