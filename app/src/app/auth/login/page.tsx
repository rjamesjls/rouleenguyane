'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) { setError(error.message); setLoading(false); }
    else router.push(redirect);
  };

  return (
    <div className={`page ${styles.authPage}`}>
      <div className={styles.authBg}/>
      <div className="container">
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <Link href="/" className={styles.authLogo}>🚗 JE<span>LOUE</span></Link>
            <h1>Connexion</h1>
            <p>Accédez à votre espace JELOUE</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBox}>
                ⚠️ {error === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input type="email" className="form-input" placeholder="votre@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe <span>*</span></label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <Link href="/auth/forgot-password" className={styles.forgotLink}>Mot de passe oublié ?</Link>
            </div>
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? '⏳ Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="page flex-center"><p>Chargement...</p></div>}><LoginContent /></Suspense>;
}
