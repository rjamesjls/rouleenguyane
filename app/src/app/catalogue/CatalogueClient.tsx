'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import VehicleCard, { type VehiculeCarte } from '@/components/vehicles/VehicleCard';
import { VILLES_GUYANE } from '@/types';
import { CATEGORY_LABELS, decrireCouleur, type VehicleCategory } from '@/types/db';
import styles from './page.module.css';

interface Filtres {
  city: string;
  category: VehicleCategory | '';
  date_debut: string;
  date_fin: string;
  prix_max?: number;
  seats_min?: number;
  transmission: string;
  color: string;
}

function CatalogueContent({ vehicles, loadError }: { vehicles: VehiculeCarte[]; loadError: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filtres>({
    city: searchParams.get('ville') || '',
    // Le lien historique `?type=` est conservé : il porte désormais une
    // catégorie du schéma (citadine, suv, …).
    category: (searchParams.get('type') as VehicleCategory) || '',
    date_debut: searchParams.get('date_debut') || '',
    date_fin: searchParams.get('date_fin') || '',
    prix_max: undefined,
    seats_min: undefined,
    transmission: '',
    color: searchParams.get('couleur') || '',
  });
  const [sort, setSort] = useState('pertinence');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availability, setAvailability] = useState<{ key: string; ids: string[]; error: boolean } | null>(null);
  const dateKey = `${filters.date_debut}/${filters.date_fin}`;
  const hasDates = Boolean(filters.date_debut || filters.date_fin);
  const datesValid = Boolean(filters.date_debut && filters.date_fin && filters.date_fin > filters.date_debut);
  const checkingDates = datesValid && availability?.key !== dateKey;

  useEffect(() => {
    if (!datesValid || loadError) return;
    let cancelled = false;
    const client = createClient();
    Promise.all(vehicles.map(async v => {
      const { data, error } = await client.rpc('dates_indisponibles', {
        p_vehicle: v.id, p_depuis: filters.date_debut, p_jusqu_a: filters.date_fin,
      });
      if (error) throw error;
      // Le jour de restitution reste réservable : intervalle [départ, retour[.
      return { id: v.id, available: !(data ?? []).some(d => d.jour >= filters.date_debut && d.jour < filters.date_fin) };
    })).then(results => {
      if (!cancelled) setAvailability({ key: dateKey, ids: results.filter(r => r.available).map(r => r.id), error: false });
    }).catch(() => {
      if (!cancelled) setAvailability({ key: dateKey, ids: [], error: true });
    });
    return () => { cancelled = true; };
  }, [vehicles, filters.date_debut, filters.date_fin, dateKey, datesValid, loadError]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [sidebarOpen]);

  /** Tous les critères sauf la couleur — sert aussi à compter les couleurs. */
  const correspondSaufCouleur = (v: VehiculeCarte) => {
    if (hasDates && (!datesValid || checkingDates || availability?.error || !availability?.ids.includes(v.id))) return false;
    if (filters.city && v.city !== filters.city) return false;
    if (filters.category && v.category !== filters.category) return false;
    if (filters.prix_max && Number(v.daily_price) > filters.prix_max) return false;
    if (filters.seats_min && (v.seats ?? 0) < filters.seats_min) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    return true;
  };

  /**
   * Couleurs réellement proposées, comptées sur les véhicules qui passent les
   * *autres* filtres. On n'affiche donc jamais une couleur menant à zéro
   * résultat, et les compteurs suivent la ville ou la catégorie choisie.
   */
  const couleursDisponibles = (() => {
    const compte = new Map<string, number>();
    for (const v of vehicles) {
      if (!v.color || !correspondSaufCouleur(v)) continue;
      compte.set(v.color, (compte.get(v.color) ?? 0) + 1);
    }
    return [...compte.entries()]
      .map(([cle, nombre]) => ({ cle, nombre, ...decrireCouleur(cle)! }))
      .sort((a, b) => b.nombre - a.nombre || a.label.localeCompare(b.label, 'fr'));
  })();

  const filtered = vehicles.filter(v => {
    if (!correspondSaufCouleur(v)) return false;
    if (filters.color && v.color !== filters.color) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'prix_asc') return Number(a.daily_price) - Number(b.daily_price);
    if (sort === 'prix_desc') return Number(b.daily_price) - Number(a.daily_price);
    if (sort === 'note') return Number(b.owner?.average_rating ?? 0) - Number(a.owner?.average_rating ?? 0);
    return 0;
  });

  const resetFilters = () => setFilters({
    city: '', category: '', date_debut: '', date_fin: '',
    prix_max: undefined, seats_min: undefined, transmission: '', color: '',
  });

  return (
    <div className={`page ${styles.cataloguePage}`}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Tous les véhicules</h1>
            <p className={styles.pageSubtitle}>
              {loadError ? 'Disponibilités momentanément indisponibles' : checkingDates ? 'Vérification des disponibilités…' : `${filtered.length} véhicule${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''} en Guyane`}
            </p>
          </div>
          <div className={styles.headerActions}>
            <select className="form-select" style={{width:'auto'}} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="pertinence">Pertinence</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="note">Meilleures notes</option>
            </select>
            <button className={`btn btn-outline btn-sm ${styles.filterToggle}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
              ⚙️ Filtres {Object.values(filters).some(Boolean) ? '●' : ''}
            </button>
          </div>
        </div>

        {loadError && (
          <div className="card" style={{ padding: 16, marginBottom: 24, borderLeft: '4px solid #EF4444' }}>
            <p role="alert">Impossible de charger les annonces pour le moment. Veuillez réessayer.</p>
            <button className="btn btn-outline btn-sm" onClick={() => router.refresh()}>Réessayer</button>
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar */}
          {sidebarOpen && <button className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-label="Fermer les filtres" />}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.sidebarHeader}>
              <h3>Filtres</h3>
              <button className="btn btn-ghost btn-sm" onClick={resetFilters}>Effacer tout</button>
              <button className={styles.closeFilters} onClick={() => setSidebarOpen(false)} aria-label="Fermer le panneau de filtres">×</button>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">📍 Ville</label>
              <select className="form-select" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})}>
                <option value="">Toute la Guyane</option>
                {VILLES_GUYANE.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">🚗 Catégorie</label>
              <div className={styles.typeGrid}>
                {(Object.keys(CATEGORY_LABELS) as VehicleCategory[]).map(k => (
                  <button
                    key={k}
                    className={`${styles.typeChip} ${filters.category === k ? styles.typeChipActive : ''}`}
                    onClick={() => setFilters({...filters, category: filters.category === k ? '' : k})}
                  >{CATEGORY_LABELS[k]}</button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">
                🎨 Couleurs disponibles
                {couleursDisponibles.length > 0 && (
                  <span className={styles.filterCount}> ({couleursDisponibles.length})</span>
                )}
              </label>
              {couleursDisponibles.length === 0 ? (
                <p className="form-hint">
                  {checkingDates ? 'Vérification des couleurs disponibles à ces dates…' : 'Aucune couleur renseignée sur les véhicules correspondants.'}
                </p>
              ) : (
                <div className={styles.colorGrid}>
                  {couleursDisponibles.map(c => (
                    <button
                      key={c.cle}
                      className={`${styles.colorChip} ${filters.color === c.cle ? styles.colorChipActive : ''}`}
                      onClick={() => setFilters({ ...filters, color: filters.color === c.cle ? '' : c.cle })}
                      aria-pressed={filters.color === c.cle}
                      title={`${c.label} — ${c.nombre} véhicule${c.nombre > 1 ? 's' : ''}`}
                    >
                      <span
                        className={styles.colorSwatch}
                        style={{
                          background: c.hex,
                          boxShadow: c.contour ? 'inset 0 0 0 1px rgba(0,0,0,.25)' : undefined,
                        }}
                      />
                      <span>{c.label}</span>
                      <span className={styles.colorCount}>{c.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">📅 Dates</label>
              <div className="form-group">
                <input type="date" className="form-input" aria-label="Date de départ"
                  value={filters.date_debut} onChange={e => setFilters({...filters, date_debut: e.target.value})} />
              </div>
              <div className="form-group" style={{marginTop: 8}}>
                <input type="date" className="form-input" aria-label="Date de retour" min={filters.date_debut || undefined}
                  value={filters.date_fin} onChange={e => setFilters({...filters, date_fin: e.target.value})} />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">💰 Prix max par jour</label>
              <div className={styles.priceRange}>
                <input type="range" min={20} max={200} step={5}
                  value={filters.prix_max || 200}
                  onChange={e => setFilters({...filters, prix_max: +e.target.value})}
                  className={styles.rangeInput}
                />
                <span className={styles.priceValue}>{filters.prix_max ? `${filters.prix_max} €` : 'Tous'}</span>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">👥 Places minimum</label>
              <select className="form-select" value={filters.seats_min || ''}
                onChange={e => setFilters({...filters, seats_min: e.target.value ? +e.target.value : undefined})}>
                <option value="">Peu importe</option>
                <option value="2">2+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
                <option value="7">7+</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className="form-label">⚙️ Boîte de vitesse</label>
              <div style={{display:'flex', gap:8}}>
                {['', 'automatique', 'manuelle'].map(bv => (
                  <button key={bv} className={`${styles.typeChip} ${filters.transmission === bv ? styles.typeChipActive : ''}`}
                    onClick={() => setFilters({...filters, transmission: bv})}>
                    {bv === '' ? 'Toutes' : bv === 'automatique' ? 'Auto' : 'Manuelle'}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className={styles.results}>
            {loadError ? null : hasDates && !datesValid ? <p role="status">Choisissez une date de retour postérieure au départ.</p> : checkingDates ? <p role="status">Vérification des disponibilités…</p> : hasDates && availability?.error ? <p role="alert">Impossible de vérifier les dates. Modifiez la période pour réessayer.</p> : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <h3>{vehicles.length === 0 ? 'Aucun véhicule publié' : 'Aucun véhicule trouvé'}</h3>
                <p>
                  {vehicles.length === 0
                    ? 'Soyez le premier à proposer un véhicule en Guyane.'
                    : 'Modifiez vos filtres pour voir plus de résultats.'}
                </p>
                {vehicles.length > 0 && (
                  <button className="btn btn-primary" onClick={resetFilters}>Effacer les filtres</button>
                )}
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map(v => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogueClient(props: { vehicles: VehiculeCarte[]; loadError: string | null }) {
  return (
    <Suspense fallback={<div className="page flex-center"><p>Chargement...</p></div>}>
      <CatalogueWithParams {...props} />
    </Suspense>
  );
}

function CatalogueWithParams(props: { vehicles: VehiculeCarte[]; loadError: string | null }) {
  const params = useSearchParams();
  return <CatalogueContent key={params.toString()} {...props} />;
}
