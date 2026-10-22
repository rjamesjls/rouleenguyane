'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../login/page.module.css';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'client';
  const VILLES_GUYANE = ['Cayenne','Kourou','Saint-Laurent-du-Maroni','Matoury','Rémire-Montjoly','Macouria','Sinnamary','Saint-Georges','Maripasoula'];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    role: defaultRole, ville: '', siret: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const isLoueur = form.role.startsWith('loueur');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && isLoueur) { setStep(2); return; }
    setError(''); setLoading(true);
    // Ces métadonnées sont lues par le trigger `handle_new_user` qui crée la
    // ligne dans `profiles` (cf. supabase/07_profile_on_signup.sql). Les clés
    // doivent correspondre au schéma réel : `city` et `profile_type`, pas
    // `preferred_city` ni `role` (en base, `role` vaut utilisateur|admin et
    // n'a rien à voir avec le choix client/loueur fait ici).
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: {
        full_name: form.full_name,
        phone: form.phone,
        city: form.ville,
        profile_type: form.role === 'loueur_pro' ? 'professionnel' : 'particulier',
        siret: form.siret,
      } }
    });
    if (error) { setError(error.message); setLoading(false); }
    else router.push(isLoueur ? '/loueur/dashboard?welcome=1' : '/dashboard?welcome=1');
  };

  return (
    <div className={`page ${styles.authPage}`}>
      <div className={styles.authBg}/>
      <div className="container">
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <Link href="/" className={styles.authLogo}>🚗 JE<span>LOUE</span></Link>
            <h1>Créer un compte</h1>
            <p>Rejoignez la communauté JELOUE en Guyane</p>
          </div>

          <div className={styles.roleSelector}>
            {[
              { role: 'client', icon: '👤', label: 'Je veux louer', desc: 'Trouver un véhicule' },
              { role: 'loueur_particulier', icon: '🏠', label: 'Loueur particulier', desc: 'Louer mon véhicule' },
              { role: 'loueur_pro', icon: '🏢', label: 'Agence / Pro', desc: 'Flotte professionnelle' },
            ].map(r => (
              <button key={r.role} type="button"
                className={`${styles.roleBtn} ${form.role === r.role ? styles.roleBtnActive : ''}`}
                onClick={() => setForm({...form, role: r.role})}>
                <span className={styles.roleIcon}>{r.icon}</span>
                <span className={styles.roleLabel}>{r.label}</span>
                <span className={styles.roleDesc}>{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorBox}>⚠️ {error}</div>}
            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label">Nom complet <span>*</span></label>
                  <input type="text" className="form-input" placeholder="Jean Dupont"
                    value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input type="email" className="form-input" placeholder="votre@email.com"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input type="tel" className="form-input" placeholder="+594 6 94 XX XX XX"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe <span>*</span></label>
                  <input type="password" className="form-input" placeholder="Minimum 8 caractères"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville principale</label>
                  <select className="form-select" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}>
                    <option value="">Sélectionnez une ville</option>
                    {VILLES_GUYANE.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </>
            )}
            {step === 2 && isLoueur && (
              <>
                <div className={styles.stepHeader}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-ghost btn-sm">← Retour</button>
                  <p>Informations professionnelles</p>
                </div>
                {form.role === 'loueur_pro' && (
                  <div className="form-group">
                    <label className="form-label">Numéro SIRET</label>
                    <input type="text" className="form-input" placeholder="123 456 789 00012"
                      value={form.siret} onChange={e => setForm({...form, siret: e.target.value})} />
                  </div>
                )}
                <div className={styles.infoBox}>
                  <p>📋 Votre compte sera examiné par notre équipe. Vous pourrez ajouter vos véhicules dès validation.</p>
                </div>
              </>
            )}
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? '⏳ Création...' : (step === 1 && isLoueur ? 'Continuer →' : 'Créer mon compte')}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Déjà un compte ? <Link href="/auth/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="page flex-center"><p>Chargement...</p></div>}><RegisterContent /></Suspense>;
}
