import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_LABELS, decrireCouleur, type Profile, type Vehicle } from '@/types/db';
import styles from './VehicleCard.module.css';

/** Véhicule tel qu'affiché dans une liste : photos et loueur joints. */
export type VehiculeCarte = Vehicle & {
  vehicle_photos?: { url: string; position: number }[];
  owner?: Pick<Profile, 'full_name' | 'avatar_url' | 'average_rating' | 'verification_status'> | null;
};

interface VehicleCardProps {
  vehicle: VehiculeCarte;
  featured?: boolean;
}

export default function VehicleCard({ vehicle, featured }: VehicleCardProps) {
  // `position` 0 = photo principale.
  const photos = [...(vehicle.vehicle_photos ?? [])].sort((a, b) => a.position - b.position);
  const photoPrincipale = photos[0];
  const note = vehicle.owner?.average_rating;
  const couleur = decrireCouleur(vehicle.color);

  return (
    <Link href={`/vehicule/${vehicle.id}`} className={`${styles.card} ${featured ? styles.featured : ''} card card-hover`}>
      <div className={styles.imageWrap}>
        {photoPrincipale ? (
          // Les photos viennent de Supabase Storage ; next/image demanderait
          // une configuration de domaine distante, non mise en place ici.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPrincipale.url} alt={`${vehicle.brand} ${vehicle.model}`} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>{CATEGORY_ICONS[vehicle.category]}</span>
          </div>
        )}
        <div className={styles.typeBadge}>
          <span>{CATEGORY_ICONS[vehicle.category]}</span>
          <span>{CATEGORY_LABELS[vehicle.category]}</span>
        </div>
        {vehicle.status !== 'en_ligne' && (
          <div className={styles.unavailableBadge}>Indisponible</div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.name}>{vehicle.brand} {vehicle.model}</h3>
            <p className={styles.year}>
              {[vehicle.year, vehicle.transmission, vehicle.seats && `${vehicle.seats} places`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className={styles.price}>
            <span className={styles.priceAmount}>{formatCurrency(Number(vehicle.daily_price))}</span>
            <span className={styles.priceUnit}>/jour</span>
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.city}>📍 {vehicle.city}</span>
          {note ? (
            <span className={styles.rating}>
              <span className={styles.stars}>⭐</span>
              <strong>{Number(note).toFixed(1)}</strong>
            </span>
          ) : (
            <span className={styles.noRating}>Nouveau</span>
          )}
        </div>

        {vehicle.owner && (
          <div className={styles.loueur}>
            <div className="avatar avatar-sm">
              {vehicle.owner.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={vehicle.owner.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : vehicle.owner.full_name.charAt(0).toUpperCase()
              }
            </div>
            <span>{vehicle.owner.full_name}</span>
            {vehicle.owner.verification_status === 'verifie' && (
              <span className={styles.verifiedBadge}>✓ Vérifié</span>
            )}
          </div>
        )}

        <div className={styles.features}>
          {couleur && (
            <span className={styles.feature}>
              <span
                className={styles.colorDot}
                style={{
                  background: couleur.hex,
                  boxShadow: couleur.contour ? 'inset 0 0 0 1px rgba(0,0,0,.25)' : undefined,
                }}
              />
              {couleur.label}
            </span>
          )}
          {vehicle.insurance_included && <span className={styles.feature}>🛡️ Assurance</span>}
          {vehicle.fuel_type && <span className={styles.feature}>⛽ {vehicle.fuel_type}</span>}
          {Number(vehicle.deposit_amount) > 0 && (
            <span className={styles.feature}>🔒 Caution {formatCurrency(Number(vehicle.deposit_amount))}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
