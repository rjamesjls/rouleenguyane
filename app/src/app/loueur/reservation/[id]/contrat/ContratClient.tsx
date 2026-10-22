'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { postJson } from '@/lib/postJson';
import { clausesContrat } from '@/lib/contrat';
import SignaturePad from '@/components/contrat/SignaturePad';
import styles from './page.module.css';

const BUCKET = 'inspections';
const MAX_PHOTOS = 12;
const MAX_OCTETS = 5 * 1024 * 1024;
const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

/** Niveaux de jauge, comme sur un tableau de bord. */
const CARBURANT = ['Vide', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Plein'];

export interface DonneesContrat {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  total_days: number;
  daily_price: number | string;
  subtotal: number | string;
  service_fee: number | string;
  deposit_amount: number | string | null;
  total_amount: number | string;
  vehicle: {
    id: string; title: string; brand: string; model: string; year: number | null;
    license_plate: string; city: string; address: string | null;
    mileage_limit_per_day: number | null; transmission: string | null;
    fuel_type: string | null; seats: number | null;
  } | null;
  renter: { id: string; full_name: string; phone: string | null; city: string | null } | null;
  owner: {
    id: string; full_name: string; phone: string | null; city: string | null;
    company_name: string | null;
  } | null;
  payments: { kind: string; status: string }[];
  inspections: { id: string; type: string; created_at: string; mileage: number | null }[];
}

interface PhotoLocale {
  file: File;
  previewUrl: string;
  path?: string;
}

export default function ContratClient({
  donnees,
  etape,
}: {
  donnees: DonneesContrat;
  etape: 'depart' | 'retour';
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    mileage: '',
    fuelLevel: 8,
    isClean: true,
    damages: '',
    comments: '',
    conditions: '',
  });
  const [photos, setPhotos] = useState<PhotoLocale[]>([]);
  const [signLoueur, setSignLoueur] = useState<string | null>(null);
  const [signClient, setSignClient] = useState<string | null>(null);
  // Deux acceptations distinctes : chacun coche la sienne. Une case unique
  // laisserait le loueur accepter au nom du client, ce qui viderait la
  // déclaration de sa valeur.
  const [luLoueur, setLuLoueur] = useState(false);
  const [luClient, setLuClient] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dejaFait = donnees.inspections.some(i => i.type === etape);
  const depart = donnees.inspections.find(i => i.type === 'depart');

  const ajouterPhotos = (fichiers: FileList | null) => {
    if (!fichiers) return;
    setError(null);
    const retenus: PhotoLocale[] = [];
    for (const file of Array.from(fichiers)) {
      if (photos.length + retenus.length >= MAX_PHOTOS) break;
      if (!TYPES_ACCEPTES.includes(file.type)) {
        setError(`« ${file.name} » : format non accepté.`);
        continue;
      }
      if (file.size > MAX_OCTETS) {
        setError(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      retenus.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (retenus.length) setPhotos(p => [...p, ...retenus]);
  };

  const retirerPhoto = (i: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, index) => index !== i);
    });
  };

  const valider = async () => {
    if (!form.mileage.trim()) {
      setError('Le kilométrage relevé est obligatoire.');
      return;
    }
    if (!luLoueur || !luClient) {
      setError(
        !luClient
          ? 'Le locataire doit cocher lui-même la case d’acceptation avant de signer.'
          : 'Le loueur doit confirmer avoir lu le contrat.'
      );
      return;
    }
    if (!signLoueur || !signClient) {
      setError('Les deux signatures sont requises.');
      return;
    }

    setEnvoi(true);
    setError(null);

    // Les photos partent d'abord vers le bucket privé ; la route ne reçoit que
    // les chemins, et vérifie qu'ils appartiennent bien à cette réservation.
    const chemins: string[] = [];
    for (const [i, photo] of photos.entries()) {
      const ext = photo.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const chemin = `${donnees.id}/${etape}-${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(chemin, photo.file, { contentType: photo.file.type });
      if (upErr) {
        setError(`Envoi de la photo ${i + 1} impossible : ${upErr.message}`);
        setEnvoi(false);
        return;
      }
      chemins.push(chemin);
    }

    const res = await postJson('/api/inspections', {
      bookingId: donnees.id,
      type: etape,
      mileage: Number(form.mileage),
      fuelLevel: form.fuelLevel,
      isClean: form.isClean,
      damages: form.damages,
      comments: form.comments,
      conditions: form.conditions,
      photos: chemins,
      acceptations: { loueur: luLoueur, locataire: luClient },
      ownerSignature: { dataUrl: signLoueur },
      renterSignature: { dataUrl: signClient },
    });

    if (!res.ok) {
      setError(res.error);
      setEnvoi(false);
      return;
    }

    router.push('/loueur/dashboard?contrat=signe');
  };

  const v = donnees.vehicle;
  const km = Number(form.mileage);
  const kmDepart = depart?.mileage ?? null;

  // Les clauses se recalculent avec les conditions particulières saisies :
  // le loueur voit en direct ce que le locataire va lire et signer.
  const clauses = clausesContrat({
    kmInclusParJour: v?.mileage_limit_per_day ?? null,
    jours: donnees.total_days,
    caution: Number(donnees.deposit_amount ?? 0),
    conditionsParticulieres: form.conditions,
  });

  if (dejaFait) {
    return (
      <div className="page">
        <div className="container">
          <div className={`${styles.carte} card`}>
            <h1 className={styles.titre}>
              État des lieux de {etape === 'depart' ? 'départ' : 'retour'} déjà établi
            </h1>
            <p className={styles.texte}>
              Ce document a déjà été signé par les deux parties. Il ne peut pas être refait.
            </p>
            <Link href="/loueur/dashboard" className="btn btn-primary">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className={styles.entete}>
          <h1 className={styles.titre}>
            {etape === 'depart'
              ? 'Contrat de location et état des lieux de départ'
              : 'État des lieux de retour'}
          </h1>
          <p className={styles.sousTitre}>
            {etape === 'depart'
              ? 'Remplissez ce formulaire devant le locataire : il constitue le contrat.'
              : 'À remplir au retour du véhicule, en présence du locataire.'}
          </p>
        </div>

        {/* ── Parties et véhicule : préremplis, non modifiables ── */}
        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>1. Les parties</h2>
          <div className={styles.grille}>
            <div>
              <p className={styles.cle}>Loueur</p>
              <p className={styles.valeur}>
                {donnees.owner?.company_name || donnees.owner?.full_name}
              </p>
              {donnees.owner?.phone && <p className={styles.detail}>{donnees.owner.phone}</p>}
            </div>
            <div>
              <p className={styles.cle}>Locataire</p>
              <p className={styles.valeur}>{donnees.renter?.full_name}</p>
              {donnees.renter?.phone && <p className={styles.detail}>{donnees.renter.phone}</p>}
            </div>
          </div>
          <p className={styles.rappel}>
            🪪 Vérifiez la pièce d&apos;identité et le permis de conduire du locataire avant de
            signer. JELOUE ne conserve aucun document.
          </p>
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>2. Le véhicule</h2>
          <div className={styles.grille}>
            <div><p className={styles.cle}>Véhicule</p><p className={styles.valeur}>{v?.brand} {v?.model} {v?.year}</p></div>
            <div><p className={styles.cle}>Immatriculation</p><p className={styles.valeur}>{v?.license_plate}</p></div>
            <div><p className={styles.cle}>Prise en charge</p><p className={styles.valeur}>{v?.address || v?.city}</p></div>
            <div><p className={styles.cle}>Km inclus / jour</p><p className={styles.valeur}>{v?.mileage_limit_per_day ?? 'Illimité'}</p></div>
          </div>
        </section>

        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>3. La location</h2>
          <div className={styles.grille}>
            <div><p className={styles.cle}>Période</p><p className={styles.valeur}>{formatDate(donnees.start_date)} → {formatDate(donnees.end_date)}</p></div>
            <div><p className={styles.cle}>Durée</p><p className={styles.valeur}>{donnees.total_days} jour{donnees.total_days > 1 ? 's' : ''}</p></div>
            <div><p className={styles.cle}>Prix payé en ligne</p><p className={styles.valeur}>{formatCurrency(Number(donnees.total_amount))}</p></div>
            <div>
              <p className={styles.cle}>Caution</p>
              <p className={styles.valeur}>
                {Number(donnees.deposit_amount) > 0
                  ? `${formatCurrency(Number(donnees.deposit_amount))} — en direct`
                  : 'Aucune'}
              </p>
            </div>
          </div>
        </section>

        {/* ── Ce que le loueur constate ── */}
        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>
            4. État constaté {etape === 'depart' ? 'au départ' : 'au retour'}
          </h2>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Kilométrage relevé <span>*</span></label>
              <input type="number" className="form-input" min={0} placeholder="ex. 45230"
                value={form.mileage}
                onChange={e => setForm({ ...form, mileage: e.target.value })} />
              {etape === 'retour' && kmDepart !== null && km > 0 && (
                <p className="form-hint">
                  Départ : {kmDepart} km — distance parcourue :{' '}
                  <strong>{Math.max(0, km - kmDepart)} km</strong>
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Niveau de carburant</label>
              <select className="form-select" value={form.fuelLevel}
                onChange={e => setForm({ ...form, fuelLevel: Number(e.target.value) })}>
                {CARBURANT.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className={styles.caseLabel}>
              <input type="checkbox" checked={form.isClean}
                onChange={e => setForm({ ...form, isClean: e.target.checked })} />
              <span>Véhicule propre, intérieur et extérieur</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Dommages constatés</label>
            <textarea className="form-textarea" style={{ minHeight: 80 }}
              placeholder="Rayure portière avant droite, pare-chocs enfoncé… Laissez vide si aucun."
              value={form.damages}
              onChange={e => setForm({ ...form, damages: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Observations</label>
            <textarea className="form-textarea" style={{ minHeight: 60 }}
              value={form.comments}
              onChange={e => setForm({ ...form, comments: e.target.value })} />
          </div>

          {etape === 'depart' && (
            <div className="form-group">
              <label className="form-label">Conditions particulières</label>
              <textarea className="form-textarea" style={{ minHeight: 60 }}
                placeholder="Zone géographique autorisée, interdiction de fumer, conducteur unique…"
                value={form.conditions}
                onChange={e => setForm({ ...form, conditions: e.target.value })} />
              <p className="form-hint">
                Ces conditions font partie du contrat signé par les deux parties.
              </p>
            </div>
          )}
        </section>

        {/* ── Photos ── */}
        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>5. Photos du véhicule</h2>
          <p className={styles.texte}>
            Faites le tour du véhicule : les quatre faces, les roues, l&apos;intérieur et le
            compteur. Ces photos sont votre seule preuve en cas de litige sur les dommages.
          </p>
          <div className={styles.photos}>
            {photos.map((p, i) => (
              <div key={p.previewUrl} className={styles.photo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={`Photo ${i + 1}`} />
                <button type="button" className={styles.photoRetirer}
                  onClick={() => retirerPhoto(i)} aria-label={`Retirer la photo ${i + 1}`}>✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" className={styles.photoAjout}
                onClick={() => inputRef.current?.click()}>
                <span>📷</span><span>Ajouter</span>
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" hidden multiple
            accept={TYPES_ACCEPTES.join(',')}
            // `capture` ouvre directement l'appareil photo sur mobile.
            capture="environment"
            onChange={e => { ajouterPhotos(e.target.files); e.target.value = ''; }} />
          <p className="form-hint">{photos.length} / {MAX_PHOTOS} photos</p>
        </section>

        {/* ── Clauses ── */}
        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>6. Conditions du contrat</h2>
          <p className={styles.texte}>
            Faites lire ces conditions au locataire avant de signer. Elles font partie
            intégrante du contrat.
          </p>
          <div className={styles.clauses}>
            {clauses.map((c, i) => (
              <article key={i} className={styles.clause}>
                <h3 className={styles.clauseTitre}>{i + 1}. {c.titre}</h3>
                {c.paragraphes.map((p, j) => (
                  <p key={j} className={styles.clauseTexte}>{p}</p>
                ))}
              </article>
            ))}
          </div>
        </section>

        {/* ── Signatures ── */}
        <section className={`${styles.carte} card`}>
          <h2 className={styles.section}>7. Acceptation et signatures</h2>
          <p className={styles.texte}>
            Chaque partie coche sa propre case, puis signe. Les deux signent l&apos;une après
            l&apos;autre sur cet appareil ; le document est ensuite figé et consultable par
            chacun.
          </p>

          <div className={styles.acceptations}>
            <label className={`${styles.caseLabel} ${styles.acceptation}`}>
              <input type="checkbox" checked={luLoueur}
                onChange={e => setLuLoueur(e.target.checked)} />
              <span>
                <strong>{donnees.owner?.full_name}</strong> (loueur) déclare avoir lu le
                contrat et l&apos;état des lieux, et en accepter les conditions.
              </span>
            </label>
            <label className={`${styles.caseLabel} ${styles.acceptation} ${styles.acceptationClient}`}>
              <input type="checkbox" checked={luClient}
                onChange={e => setLuClient(e.target.checked)} />
              <span>
                <strong>{donnees.renter?.full_name}</strong> (locataire) déclare avoir lu le
                contrat et l&apos;état des lieux, en accepter les conditions, et avoir présenté
                une pièce d&apos;identité et un permis de conduire en cours de validité.
                <em className={styles.aCocherParClient}> À cocher par le locataire.</em>
              </span>
            </label>
          </div>

          <div className={styles.signatures}>
            <SignaturePad
              label={`Loueur — ${donnees.owner?.full_name ?? ''}`}
              onChange={setSignLoueur}
            />
            <SignaturePad
              label={`Locataire — ${donnees.renter?.full_name ?? ''}`}
              onChange={setSignClient}
            />
          </div>

          {error && <p className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}

          <div className={styles.actions}>
            <Link href="/loueur/dashboard" className="btn btn-outline">Annuler</Link>
            <button type="button" className="btn btn-primary" onClick={valider} disabled={envoi}>
              {envoi
                ? 'Enregistrement…'
                : etape === 'depart'
                  ? '✍️ Signer et remettre le véhicule'
                  : '✍️ Signer et clôturer la location'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
