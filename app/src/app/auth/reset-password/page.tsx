'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../login/page.module.css';

function ResetForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  return <div className={`page ${styles.authPage}`}><div className="container"><div className={styles.authCard}>
    <div className={styles.authHeader}><h1>Nouveau mot de passe</h1></div>
    {params.has('invalid') ? <p role="alert">Ce lien est invalide ou a expiré. <Link href="/auth/forgot-password">Demander un nouveau lien</Link></p> : done ? <p role="status">Votre mot de passe a été modifié. <Link href="/auth/login">Se connecter</Link></p> :
      <form className={styles.form} onSubmit={async e => {
        e.preventDefault(); setError('');
        if (password !== confirmation) { setError('Les mots de passe doivent être identiques.'); return; }
        setBusy(true);
        try {
          const client = createClient();
          const { data: { user } } = await client.auth.getUser();
          if (!user) { setError('Votre lien a expiré. Demandez un nouveau lien.'); return; }
          const { error } = await client.auth.updateUser({ password });
          if (error) throw error;
          await client.auth.signOut(); setDone(true);
        } catch { setError('Modification impossible pour le moment. Réessayez.'); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="new-password">Nouveau mot de passe (8 caractères minimum)</label><input id="new-password" className="form-input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
        <label htmlFor="confirm-password">Confirmer le mot de passe</label><input id="confirm-password" className="form-input" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</button>
        <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
      </form>}
  </div></div></div>;
}
export default function ResetPasswordPage() { return <Suspense fallback={<div className="page">Chargement…</div>}><ResetForm /></Suspense>; }
