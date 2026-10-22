'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getInitials } from '@/lib/utils';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  // Le schéma ne distingue pas « client » et « loueur » : `role` ne vaut que
  // `utilisateur` ou `admin`. Tout le monde peut à la fois réserver et mettre
  // un véhicule en location, donc les deux espaces sont toujours proposés.
  const dashboardLink = profile?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🚗</span>
          <span className={styles.logoText}>JE<span>LOUE</span></span>
        </Link>

        {/* Nav links */}
        <nav id="main-navigation" className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} onClick={e => { if ((e.target as HTMLElement).closest('a')) setMenuOpen(false); }} onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }}>
          {!user && <Link href="/auth/login" className={`${styles.navLink} ${styles.mobileLogin}`}>Connexion</Link>}
          <Link href="/catalogue" className={`${styles.navLink} ${isActive('/catalogue') ? styles.navLinkActive : ''}`}>
            Véhicules
          </Link>
          <Link href="/catalogue?type=suv" className={styles.navLink}>4x4 & Aventure</Link>
          <Link href="/catalogue?type=utilitaire" className={styles.navLink}>Utilitaires</Link>
          {!user && (
            <Link href="/auth/register?role=loueur_particulier" className={`${styles.navLink} ${styles.navLinkHighlight}`}>
              Devenir loueur
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Changer le thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className={styles.userMenu} onMouseLeave={() => setDropdownOpen(false)}>
              <button
                className={styles.userBtn}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar avatar-sm">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : getInitials(profile?.full_name || 'U')
                  }
                </div>
                <span className={styles.userName}>{profile?.full_name?.split(' ')[0]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{profile?.full_name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownItems}>
                    <Link href={dashboardLink} className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <span>📊</span> Mes réservations
                    </Link>
                    <Link href="/loueur/dashboard" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <span>🔑</span> Espace loueur
                    </Link>
                    <Link href="/loueur/vehicule/new" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <span>➕</span> Ajouter un véhicule
                    </Link>
                    <Link href="/profil" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <span>👤</span> Mon profil
                    </Link>
                    <div className={styles.dropdownDivider}/>
                    <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={signOut}>
                      <span>🚪</span> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">S'inscrire</Link>
            </div>
          )}

          {/* Mobile burger */}
          <button className={styles.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen} aria-controls="main-navigation">
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen1 : ''}`}/>
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen2 : ''}`}/>
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen3 : ''}`}/>
          </button>
        </div>
      </div>
    </header>
  );
}
