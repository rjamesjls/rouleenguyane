'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  return <div className={`page ${styles.authPage}`}><div className="container"><div className={styles.authCard}>
    <div className={styles.authHeader}><h1>Mot de passe oublié</h1><p>Recevez un lien pour choisir un nouveau mot de passe.</p></div>
    {sent ? <p role="status">Si un compte correspond à cette adresse, un lien de réinitialisation vous sera envoyé. Pensez à vérifier vos courriers indésirables.</p> :
      <form className={styles.form} onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError('');
        try {
          const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/recovery` });
          if (error) throw error;
          setSent(true);
        } catch { setError('L’envoi est momentanément indisponible. Veuillez réessayer.'); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="recovery-email">Votre adresse email</label>
        <input id="recovery-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir le lien'}</button>
      </form>}
    <p className={styles.authSwitch}><Link href="/auth/login">Retour à la connexion</Link></p>
  </div></div></div>;
}
