'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VILLES_GUYANE } from '@/types';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  VEHICLE_COLORS,
  VEHICLE_COLOR_KEYS,
  type VehicleColor,
  type VehicleCategory,
  type DepositMode,
  type BookingMode,
  type VehicleStatus,
} from '@/types/db';
import styles from './vehicle-form.module.css';

const BUCKET = 'vehicle-photos';
const MAX_PHOTOS = 8;
const MAX_TAILLE_OCTETS = 5 * 1024 * 1024; // aligné sur file_size_limit du bucket
const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

/** Statuts qu'un loueur pilote lui-même. `suspendu` est réservé à la modération. */
const STATUTS_LOUEUR: { value: VehicleStatus; label: string; hint: string }[] = [
  { value: 'en_ligne', label: 'En ligne', hint: 'Visible dans le catalogue, réservable.' },
  { value: 'brouillon', label: 'Hors ligne', hint: 'Masqué du catalogue, vous seul le voyez.' },
  { value: 'archive', label: 'Archivé', hint: 'Rangé — réactivable à tout moment.' },
];

interface PhotoLocale {
  file: File;
  /** URL blob pour l'aperçu — à révoquer pour ne pas fuir de mémoire. */
  previewUrl: string;
}

export interface PhotoExistante {
  id: string;
  url: string;
  position: number;
}

export interface VehiculeAModifier {
  id: string;
  owner_id: string;
  category: VehicleCategory;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  seats: number | null;
  license_plate: string;
  transmission: string | null;
  fuel_type: string | null;
  insurance_included: boolean;
  daily_price: number | string;
  deposit_amount: number | string | null;
  deposit_mode: DepositMode;
  booking_mode: BookingMode;
  mileage_limit_per_day: number | null;
  min_rental_days: number;
  city: string;
  address: string | null;
  description: string | null;
  color: string | null;
  status: VehicleStatus;
  vehicle_photos: PhotoExistante[];
}

/**
 * Extrait le chemin de stockage d'une URL publique Supabase.
 *
 * On ne stocke que l'URL publique en base ; supprimer l'objet exige le chemin
 * relatif au bucket. Renvoie null si l'URL ne suit pas le format attendu —
 * la ligne est alors retirée de la base sans toucher au stockage.
 */
function cheminDepuisUrl(url: string): string | null {
  const marqueur = `/${BUCKET}/`;
  const index = url.indexOf(marqueur);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marqueur.length));
}

/**
 * Formulaire véhicule, partagé entre création et modification.
 *
 * Sans `vehicle`, il crée. Avec, il modifie : les champs sont préremplis, les
 * photos déjà en ligne sont éditables et le statut de publication apparaît.
 */
export default function VehicleForm({ vehicle }: { vehicle?: VehiculeAModifier }) {
  const modeEdition = Boolean(vehicle);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoLocale[]>([]);

  // Photos déjà en base : conservées, réordonnées ou retirées.
  const [photosExistantes, setPhotosExistantes] = useState<PhotoExistante[]>(
    [...(vehicle?.vehicle_photos ?? [])].sort((a, b) => a.position - b.position)
  );
  const [photosASupprimer, setPhotosASupprimer] = useState<PhotoExistante[]>([]);
  // Un véhicule créé reste hors ligne : la mise en vitrine appartient au
  // loueur, qui la déclenche explicitement ici ou depuis son tableau de bord.
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? 'brouillon');

  // Champs nommés comme les colonnes de la base : le mapping reste évident.
  // Mémorisées à part : elles servent aussi de référence pour détecter les
  // modifications non enregistrées au moment de quitter.
  const valeursInitiales = useMemo(() => ({
    category: vehicle?.category ?? ('citadine' as VehicleCategory),
    title: vehicle?.title ?? '',
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? new Date().getFullYear(),
    seats: vehicle?.seats ?? 5,
    license_plate: vehicle?.license_plate ?? '',
    transmission: vehicle?.transmission ?? 'automatique',
    fuel_type: vehicle?.fuel_type ?? 'essence',
    insurance_included: vehicle?.insurance_included ?? false,
    daily_price: vehicle ? String(vehicle.daily_price) : '',
    deposit_amount: vehicle?.deposit_amount != null ? String(vehicle.deposit_amount) : '',
    // Toujours `sur_place` : la plateforme n'encaisse pas la caution. La colonne
    // est conservée en base, mais n'a plus qu'une valeur possible.
    deposit_mode: 'sur_place' as DepositMode,
    booking_mode: vehicle?.booking_mode ?? ('manuel' as BookingMode),
    mileage_limit_per_day: vehicle?.mileage_limit_per_day ?? 300,
    min_rental_days: vehicle?.min_rental_days ?? 1,
    city: vehicle?.city ?? '',
    address: vehicle?.address ?? '',
    description: vehicle?.description ?? '',
    // Chaîne vide = « non renseignée », convertie en NULL à l'enregistrement.
    color: (vehicle?.color ?? '') as VehicleColor | '',
  }), [vehicle]);

  const [form, setForm] = useState(valeursInitiales);

  const steps = [
    { num: 1, label: 'Informations' },
    { num: 2, label: 'Équipements & Prix' },
    { num: 3, label: 'Localisation' },
    { num: 4, label: 'Description & Statut' },
  ];

  const handleNext = () => { if (step < 4) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const nbPhotosTotal = photosExistantes.length + photos.length;

  /** Ordre initial des photos, pour repérer un changement de photo principale. */
  const ordreInitialPhotos = useMemo(
    () => [...(vehicle?.vehicle_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(p => p.id)
      .join(','),
    [vehicle]
  );

  /**
   * Y a-t-il des changements non enregistrés ?
   *
   * `form` étant construit par recopie de `valeursInitiales`, l'ordre des clés
   * est identique et la comparaison JSON est fiable.
   */
  const aDesModifications =
    JSON.stringify(form) !== JSON.stringify(valeursInitiales) ||
    status !== (vehicle?.status ?? 'en_ligne') ||
    photos.length > 0 ||
    photosASupprimer.length > 0 ||
    photosExistantes.map(p => p.id).join(',') !== ordreInitialPhotos;

  /** Quitte sans enregistrer — on confirme si du travail serait perdu. */
  const quitter = () => {
    if (
      aDesModifications &&
      !window.confirm('Des modifications ne sont pas enregistrées. Quitter sans les enregistrer ?')
    ) {
      return;
    }
    router.push('/loueur/dashboard');
  };

  /**
   * Les URL blob fuient si on ne les révoque pas au démontage.
   *
   * La ref est indispensable : une cleanup à dépendances vides capturerait le
   * tableau du premier rendu (vide) et ne révoquerait jamais rien.
   */
  const photosRef = useRef<PhotoLocale[]>([]);

  // Synchronisation dans un effet : écrire une ref pendant le rendu est interdit.
  useEffect(() => { photosRef.current = photos; }, [photos]);

  useEffect(() => {
    return () => { photosRef.current.forEach(p => URL.revokeObjectURL(p.previewUrl)); };
  }, []);

  const ajouterPhotos = (fichiers: FileList | null) => {
    if (!fichiers) return;
    setError(null);

    const retenus: PhotoLocale[] = [];
    for (const file of Array.from(fichiers)) {
      if (nbPhotosTotal + retenus.length >= MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos.`);
        break;
      }
      if (!TYPES_ACCEPTES.includes(file.type)) {
        setError(`« ${file.name} » : format non accepté (JPEG, PNG ou WebP).`);
        continue;
      }
      if (file.size > MAX_TAILLE_OCTETS) {
        setError(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      retenus.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (retenus.length) setPhotos(prev => [...prev, ...retenus]);
  };

  const retirerPhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  /** Retire une photo déjà en ligne — supprimée en base à l'enregistrement. */
  const retirerPhotoExistante = (id: string) => {
    setPhotosExistantes(prev => {
      const cible = prev.find(p => p.id === id);
      if (cible) setPhotosASupprimer(anciennes => [...anciennes, cible]);
      return prev.filter(p => p.id !== id);
    });
  };

  /** Promeut une photo existante en photo principale (position 0). */
  const definirPrincipale = (id: string) => {
    setPhotosExistantes(prev => {
      const cible = prev.find(p => p.id === id);
      if (!cible) return prev;
      return [cible, ...prev.filter(p => p.id !== id)];
    });
  };

  /**
   * Validation explicite avant écriture.
   *
   * L'attribut `required` ne suffit pas : les champs des autres étapes ne sont
   * pas montés dans le DOM, donc le navigateur ne peut pas les valider. Sans
   * ce garde-fou, un véhicule partait en base avec une ville vide.
   *
   * Renvoie le numéro d'étape fautif, ou null si tout est bon.
   */
  const premiereEtapeInvalide = (): { etape: number; message: string } | null => {
    if (!form.brand.trim() || !form.model.trim()) {
      return { etape: 1, message: 'La marque et le modèle sont obligatoires.' };
    }
    if (!form.license_plate.trim()) {
      return { etape: 1, message: "L'immatriculation est obligatoire." };
    }
    if (!form.daily_price || Number(form.daily_price) <= 0) {
      return { etape: 2, message: 'Indiquez un prix par jour valide.' };
    }
    if (!form.city) {
      return { etape: 3, message: 'Sélectionnez la ville de prise en charge.' };
    }
    return null;
  };

  /** Colonnes communes à l'insertion et à la mise à jour. */
  const champsVehicule = () => ({
    // `title` est NOT NULL : on retombe sur marque + modèle si laissé vide.
    title: form.title.trim() || `${form.brand} ${form.model}`.trim(),
    category: form.category,
    brand: form.brand,
    model: form.model,
    year: Number(form.year),
    seats: Number(form.seats),
    license_plate: form.license_plate.trim().toUpperCase(),
    transmission: form.transmission,
    fuel_type: form.fuel_type,
    insurance_included: form.insurance_included,
    daily_price: Number(form.daily_price),
    deposit_amount: Number(form.deposit_amount || 0),
    deposit_mode: form.deposit_mode,
    booking_mode: form.booking_mode,
    mileage_limit_per_day: Number(form.mileage_limit_per_day) || null,
    min_rental_days: Number(form.min_rental_days) || 1,
    city: form.city,
    address: form.address || null,
    description: form.description || null,
    color: form.color || null,
  });

  /**
   * Envoie les nouvelles photos et renvoie true si l'une a échoué.
   *
   * Chemin {owner_id}/{vehicle_id}/… : le premier segment porte le contrôle
   * d'accès en écriture (cf. supabase/storage.sql).
   */
  const televerserPhotos = async (
    ownerId: string,
    vehicleId: string,
    positionDepart: number
  ): Promise<boolean> => {
    const lignes: { vehicle_id: string; url: string; position: number }[] = [];
    let echec = false;

    for (const [index, photo] of photos.entries()) {
      const extension = photo.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const chemin = `${ownerId}/${vehicleId}/${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(chemin, photo.file, { contentType: photo.file.type });

      if (uploadError) {
        echec = true;
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(chemin);
      lignes.push({ vehicle_id: vehicleId, url: publicUrl, position: positionDepart + index });
    }

    if (lignes.length) {
      const { error: photosError } = await supabase.from('vehicle_photos').insert(lignes);
      if (photosError) echec = true;
    }

    return echec;
  };

  /**
   * Enregistre. Déclenché uniquement par le bouton dédié.
   *
   * Rien dans le formulaire ne doit écrire en base sans un clic explicite du
   * loueur : ni la navigation entre étapes, ni la touche Entrée. Le `<form>`
   * neutralise donc sa soumission native et ce bouton est un `type="button"`.
   */
  const enregistrer = async () => {
    if (loading) return;

    const invalide = premiereEtapeInvalide();
    if (invalide) {
      setError(invalide.message);
      setStep(invalide.etape);
      return;
    }

    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Votre session a expiré. Reconnectez-vous.');
      setLoading(false);
      return;
    }

    if (modeEdition && vehicle) {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ ...champsVehicule(), status })
        .eq('id', vehicle.id);

      if (updateError) {
        setError(`Modification impossible : ${updateError.message}`);
        setLoading(false);
        return;
      }

      let photoEnEchec = false;

      // 1. Photos retirées : la ligne d'abord, l'objet ensuite. Un objet
      //    orphelin est bénin ; une ligne pointant vers un fichier absent
      //    afficherait une image cassée dans le catalogue.
      if (photosASupprimer.length) {
        const { error: deleteError } = await supabase
          .from('vehicle_photos')
          .delete()
          .in('id', photosASupprimer.map(p => p.id));

        if (deleteError) {
          photoEnEchec = true;
        } else {
          const chemins = photosASupprimer
            .map(p => cheminDepuisUrl(p.url))
            .filter((c): c is string => c !== null);
          if (chemins.length) await supabase.storage.from(BUCKET).remove(chemins);
        }
      }

      // 2. Réindexation des photos conservées : position 0 = photo principale.
      for (const [index, photo] of photosExistantes.entries()) {
        if (photo.position === index) continue;
        const { error: positionError } = await supabase
          .from('vehicle_photos')
          .update({ position: index })
          .eq('id', photo.id);
        if (positionError) photoEnEchec = true;
      }

      // 3. Nouvelles photos, à la suite des conservées.
      if (photos.length) {
        const echec = await televerserPhotos(user.id, vehicle.id, photosExistantes.length);
        if (echec) photoEnEchec = true;
      }

      router.push(`/loueur/dashboard?updated=1${photoEnEchec ? '&photos=erreur' : ''}`);
      return;
    }

    // Création : le véhicule d'abord, les photos ont besoin de son id.
    const { data: cree, error: vehicleError } = await supabase
      .from('vehicles')
      // `status` vient du choix du loueur, jamais d'une valeur imposée.
      .insert({ ...champsVehicule(), owner_id: user.id, status })
      .select('id')
      .single();

    if (vehicleError || !cree) {
      setError(`Enregistrement impossible : ${vehicleError?.message ?? 'erreur inconnue'}`);
      setLoading(false);
      return;
    }

    const photoEnEchec = await televerserPhotos(user.id, cree.id, 0);

    // Le véhicule existe déjà : on ne renvoie pas l'utilisateur sur le
    // formulaire (il le soumettrait deux fois). On signale via l'URL.
    router.push(`/loueur/dashboard?added=1${photoEnEchec ? '&photos=erreur' : ''}`);
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>
            {modeEdition ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h1>
          <p className={styles.subtitle}>
            {modeEdition
              ? 'Vos changements seront visibles immédiatement dans le catalogue.'
              : 'Renseignez les informations de votre véhicule'}
          </p>
        </div>

        {/* Steps */}
        <div className={styles.stepper}>
          {steps.map(s => (
            <button key={s.num} type="button"
              className={`${styles.stepperItem} ${step >= s.num ? styles.stepperActive : ''} ${step > s.num ? styles.stepperDone : ''}`}
              // En modification, tout est déjà rempli : on navigue librement
              // plutôt que de repasser par les quatre étapes pour un prix.
              onClick={() => { if (modeEdition) setStep(s.num); }}
              disabled={!modeEdition}
              aria-current={step === s.num ? 'step' : undefined}>
              <div className={styles.stepperCircle}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={styles.stepperLabel}>{s.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.formCard}>
          {/* Soumission native neutralisée : seul le bouton « Enregistrer »
              écrit en base. Entrée dans un champ ne déclenche donc rien. */}
          <form onSubmit={e => e.preventDefault()}>
            {/* STEP 1 — Informations */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Informations du véhicule</h2>

                <div className="form-group">
                  <label className="form-label">Catégorie <span>*</span></label>
                  <div className={styles.typeGrid}>
                    {(Object.keys(CATEGORY_LABELS) as VehicleCategory[]).map(category => (
                      <button key={category} type="button"
                        className={`${styles.typeBtn} ${form.category === category ? styles.typeBtnActive : ''}`}
                        onClick={() => setForm({...form, category})}>
                        <span>{CATEGORY_ICONS[category]}</span>
                        <span>{CATEGORY_LABELS[category]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Titre de l&apos;annonce</label>
                  <input type="text" className="form-input" placeholder="Toyota Corolla — parfaite pour la ville"
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <p className="form-hint">Laissé vide, il reprendra la marque et le modèle.</p>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Marque <span>*</span></label>
                    <input type="text" className="form-input" placeholder="Toyota, Renault..."
                      value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Modèle <span>*</span></label>
                    <input type="text" className="form-input" placeholder="Corolla, L200..."
                      value={form.model} onChange={e => setForm({...form, model: e.target.value})} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Année</label>
                    <input type="number" className="form-input" min={1990} max={2026}
                      value={form.year} onChange={e => setForm({...form, year: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre de places</label>
                    <input type="number" className="form-input" min={1} max={20}
                      value={form.seats} onChange={e => setForm({...form, seats: +e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Immatriculation <span>*</span></label>
                  <input type="text" className="form-input" placeholder="AB-123-CD"
                    value={form.license_plate}
                    onChange={e => setForm({...form, license_plate: e.target.value})} required />
                  <p className="form-hint">Obligatoire — sert à identifier le véhicule sur le contrat.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Couleur de ce véhicule</label>
                  <div className={styles.colorGrid}>
                    {VEHICLE_COLOR_KEYS.map(cle => {
                      const couleur = VEHICLE_COLORS[cle];
                      const choisie = form.color === cle;
                      return (
                        <button key={cle} type="button"
                          className={`${styles.colorBtn} ${choisie ? styles.colorBtnActive : ''}`}
                          // Un second clic désélectionne : la couleur est facultative.
                          onClick={() => setForm({ ...form, color: choisie ? '' : cle })}
                          aria-pressed={choisie}
                          title={couleur.label}>
                          <span className={styles.colorDot}
                            style={{
                              background: couleur.hex,
                              boxShadow: couleur.contour ? 'inset 0 0 0 1px rgba(0,0,0,.25)' : undefined,
                            }} />
                          <span>{couleur.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="form-hint">
                    Choisissez la couleur réelle de ce véhicule. Pour plusieurs voitures du même modèle,
                    créez une annonce par voiture : chacune aura ses photos et son calendrier.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2 — Équipements & Prix */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Équipements &amp; Tarification</h2>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Boîte de vitesse</label>
                    <select className="form-select" value={form.transmission ?? 'automatique'} onChange={e => setForm({...form, transmission: e.target.value})}>
                      <option value="automatique">Automatique</option>
                      <option value="manuelle">Manuelle</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Carburant</label>
                    <select className="form-select" value={form.fuel_type ?? 'essence'} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                      <option value="essence">Essence</option>
                      <option value="diesel">Diesel</option>
                      <option value="electrique">Électrique</option>
                      <option value="hybride">Hybride</option>
                    </select>
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={`${styles.checkbox} ${form.insurance_included ? styles.checkboxActive : ''}`}>
                    <input type="checkbox" checked={form.insurance_included}
                      onChange={e => setForm({...form, insurance_included: e.target.checked})} />
                    <span>🛡️</span> Assurance incluse
                  </label>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Prix par jour (€) <span>*</span></label>
                    <input type="number" className="form-input" placeholder="50" min={10}
                      value={form.daily_price} onChange={e => setForm({...form, daily_price: e.target.value})} required />
                    <p className="form-hint">ROULÉ prélève une commission sur le prix affiché</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caution (€)</label>
                    <input type="number" className="form-input" placeholder="200" min={0}
                      value={form.deposit_amount} onChange={e => setForm({...form, deposit_amount: e.target.value})} />
                    {/* JELOUE n'encaisse jamais la caution : pas de choix de mode,
                        pas de pré-autorisation carte. Le loueur la gère lui-même. */}
                    <p className="form-hint">
                      Montant indicatif affiché sur l&apos;annonce. Vous la percevez et la
                      restituez vous-même : JELOUE ne l&apos;encaisse pas.
                    </p>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Mode de réservation</label>
                    <select className="form-select" value={form.booking_mode}
                      onChange={e => setForm({...form, booking_mode: e.target.value as BookingMode})}>
                      <option value="manuel">Validation manuelle</option>
                      <option value="instantane">Réservation instantanée</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Km inclus par jour</label>
                    <input type="number" className="form-input" placeholder="300" min={0}
                      value={form.mileage_limit_per_day ?? 300}
                      onChange={e => setForm({...form, mileage_limit_per_day: +e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Durée minimum (jours)</label>
                    <input type="number" className="form-input" min={1}
                      value={form.min_rental_days}
                      onChange={e => setForm({...form, min_rental_days: +e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Localisation */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Localisation</h2>

                <div className="form-group">
                  <label className="form-label">Ville <span>*</span></label>
                  <select className="form-select" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required>
                    <option value="">Sélectionnez une ville</option>
                    {VILLES_GUYANE.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Lieu de prise en charge</label>
                  <input type="text" className="form-input" placeholder="Adresse exacte, parking, point de rencontre..."
                    value={form.address ?? ''} onChange={e => setForm({...form, address: e.target.value})} />
                  <p className="form-hint">Précisez où le client récupérera le véhicule</p>
                </div>

                <div className={styles.photoUploadSection}>
                  <h3>Photos du véhicule</h3>
                  <p>
                    Ajoutez au moins 3 photos de bonne qualité pour attirer plus de clients.
                    JPEG, PNG ou WebP — 5 Mo maximum par photo.
                  </p>
                  <p className="form-hint">
                    Les photos doivent montrer ce véhicule précis
                    {form.color ? ` (${VEHICLE_COLORS[form.color].label})` : ''}, avec sa couleur réelle.
                    La photo principale sera affichée dans le catalogue.
                  </p>
                  <div className={styles.photoGrid}>
                    {/* Photos déjà en ligne */}
                    {photosExistantes.map((photo, i) => (
                      <div key={photo.id} className={styles.photoPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={`Photo ${i + 1} du véhicule`} />
                        {i === 0 ? (
                          <span className={styles.photoBadge}>Principale</span>
                        ) : (
                          <button
                            type="button"
                            className={styles.photoBadge}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => definirPrincipale(photo.id)}
                          >
                            Définir principale
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.photoRemove}
                          onClick={() => retirerPhotoExistante(photo.id)}
                          aria-label={`Retirer la photo ${i + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Photos ajoutées dans cette session */}
                    {photos.map((photo, i) => (
                      <div key={photo.previewUrl} className={styles.photoPreview}>
                        {/* Aperçu d'une URL blob locale : next/image n'a rien à
                            optimiser ici, le fichier n'est pas encore envoyé. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.previewUrl} alt={`Nouvelle photo ${i + 1}`} />
                        {photosExistantes.length === 0 && i === 0 && (
                          <span className={styles.photoBadge}>Principale</span>
                        )}
                        <button
                          type="button"
                          className={styles.photoRemove}
                          onClick={() => retirerPhoto(i)}
                          aria-label={`Retirer la nouvelle photo ${i + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {nbPhotosTotal < MAX_PHOTOS && (
                      // <label> englobant un input caché : toute la zone devient
                      // cliquable, et le clavier y accède nativement.
                      <label className={styles.photoSlot}>
                        <span>📷</span>
                        <span>{nbPhotosTotal === 0 ? 'Photo principale' : 'Ajouter'}</span>
                        <input
                          type="file"
                          accept={TYPES_ACCEPTES.join(',')}
                          multiple
                          hidden
                          onChange={e => {
                            ajouterPhotos(e.target.files);
                            // Permet de resélectionner le même fichier après retrait.
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {nbPhotosTotal > 0 && (
                    <p className="form-hint">
                      {nbPhotosTotal} photo{nbPhotosTotal > 1 ? 's' : ''} — la première sert
                      de photo principale.
                      {photosASupprimer.length > 0 &&
                        ` ${photosASupprimer.length} photo${photosASupprimer.length > 1 ? 's' : ''} sera supprimée à l'enregistrement.`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4 — Description (+ statut en modification) */}
            {step === 4 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Description &amp; publication</h2>

                <div className="form-group">
                  <label className="form-label">Description du véhicule</label>
                  <textarea className="form-textarea" placeholder="Décrivez votre véhicule : état, caractéristiques, conditions de location, idéal pour..."
                    value={form.description ?? ''} onChange={e => setForm({...form, description: e.target.value})}
                    style={{minHeight: 140}} />
                </div>

                <div className="form-group">
                  <label className="form-label">Statut de publication</label>
                  <select className="form-select" value={status}
                    onChange={e => setStatus(e.target.value as VehicleStatus)}>
                    {STATUTS_LOUEUR.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <p className="form-hint">
                    {STATUTS_LOUEUR.find(s => s.value === status)?.hint}
                    {!modeEdition && status !== 'en_ligne' &&
                      ' Vous pourrez le publier quand vous voulez depuis votre tableau de bord.'}
                  </p>
                </div>

                <div className={styles.summary}>
                  <h3>Récapitulatif</h3>
                  <div className={styles.summaryGrid}>
                    <div><span>Catégorie</span><strong>{CATEGORY_LABELS[form.category]}</strong></div>
                    <div><span>Véhicule</span><strong>{form.brand} {form.model} {form.year}</strong></div>
                    <div><span>Immatriculation</span><strong>{form.license_plate || 'Non renseignée'}</strong></div>
                    <div><span>Prix</span><strong>{form.daily_price || '—'}€/jour</strong></div>
                    <div><span>Ville</span><strong>{form.city || 'Non renseignée'}</strong></div>
                    <div><span>Photos</span><strong>{nbPhotosTotal}</strong></div>
                    <div>
                      <span>Publication</span>
                      <strong>{STATUTS_LOUEUR.find(s => s.value === status)?.label}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="form-error" role="alert" style={{ marginTop: 16 }}>{error}</p>
            )}

            {/* Navigation */}
            <div className={styles.formNav}>
              {/* Sortie de secours, toujours visible : sans elle, le seul moyen
                  de quitter était la navigation du navigateur. */}
              <button type="button" className="btn btn-ghost" onClick={quitter} disabled={loading}>
                {modeEdition ? 'Annuler' : 'Quitter'}
              </button>
              {step > 1 && (
                <button type="button" className="btn btn-outline" onClick={handleBack}>← Retour</button>
              )}
              {modeEdition && vehicle && (
                <Link href={`/vehicule/${vehicle.id}`} className="btn btn-outline">
                  Voir l&apos;annonce
                </Link>
              )}
              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{marginLeft:'auto'}}>
                  Continuer →
                </button>
              ) : (
                <button type="button" className="btn btn-primary" disabled={loading}
                  onClick={enregistrer} style={{marginLeft:'auto'}}>
                  {loading
                    ? '⏳ Enregistrement...'
                    : (modeEdition ? '💾 Enregistrer les modifications' : '💾 Enregistrer le véhicule')}
                </button>
              )}
              {modeEdition && step < 4 && (
                <button type="button" className="btn btn-primary" disabled={loading}
                  onClick={() => { setStep(4); }}>
                  Aller au récapitulatif
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
