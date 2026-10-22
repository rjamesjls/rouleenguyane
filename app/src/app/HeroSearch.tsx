'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VILLES_GUYANE } from '@/types';
import { CATEGORY_LABELS, type VehicleCategory } from '@/types/db';
import styles from './page.module.css';

/** Formulaire de recherche de la page d'accueil — redirige vers le catalogue. */
export default function HeroSearch() {
  const router = useRouter();
  const [search, setSearch] = useState({ ville: '', date_debut: '', date_fin: '', type: '' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.ville) params.set('ville', search.ville);
    if (search.date_debut) params.set('date_debut', search.date_debut);
    if (search.date_fin) params.set('date_fin', search.date_fin);
    if (search.type) params.set('type', search.type);
    router.push(`/catalogue?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={styles.searchForm}>
      <div className={styles.searchField}>
        <label>📍 Ville</label>
        <select
          value={search.ville}
          onChange={e => setSearch({...search, ville: e.target.value})}
          className={styles.searchSelect}
        >
          <option value="">Toute la Guyane</option>
          {VILLES_GUYANE.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div className={styles.searchDivider}/>
      <div className={styles.searchField}>
        <label>📅 Départ</label>
        <input
          type="date" value={search.date_debut}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setSearch({...search, date_debut: e.target.value})}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.searchDivider}/>
      <div className={styles.searchField}>
        <label>📅 Retour</label>
        <input
          type="date" value={search.date_fin}
          min={search.date_debut || new Date().toISOString().split('T')[0]}
          onChange={e => setSearch({...search, date_fin: e.target.value})}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.searchDivider}/>
      <div className={styles.searchField}>
        <label>🚗 Catégorie</label>
        <select
          value={search.type}
          onChange={e => setSearch({...search, type: e.target.value})}
          className={styles.searchSelect}
        >
          <option value="">Toutes catégories</option>
          {(Object.keys(CATEGORY_LABELS) as VehicleCategory[]).map(k => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
      </div>
      <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
        🔍 Rechercher
      </button>
    </form>
  );
}
