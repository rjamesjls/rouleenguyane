import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'inspections';

/** Une signature manuscrite envoyée par le navigateur (PNG en base64). */
interface SignatureEnvoyee {
  dataUrl: string;
}

function decoderSignature(sig: SignatureEnvoyee | undefined): Buffer | null {
  if (!sig?.dataUrl?.startsWith('data:image/png;base64,')) return null;
  const base64 = sig.dataUrl.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');
  // Une signature vide fait quelques centaines d'octets ; on refuse aussi
  // les fichiers absurdement gros qui trahiraient autre chose qu'un tracé.
  if (buffer.length < 300 || buffer.length > 2_000_000) return null;
  return buffer;
}

/**
 * Enregistre un état des lieux signé (départ ou retour).
 *
 * Le formulaire rempli par le loueur EST le contrat : les données de la
 * réservation, du véhicule et des deux parties sont figées ici dans
 * `contract_snapshot`. Une modification ultérieure de l'annonce ne doit pas
 * réécrire un document déjà signé.
 *
 * Les deux signatures sont exigées dans la même requête : elles sont
 * apposées l'une après l'autre sur le même appareil, ce qui atteste la
 * présence conjointe des parties.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connectez-vous.' }, { status: 401 });
  }

  let corps: {
    bookingId?: string;
    type?: 'depart' | 'retour';
    mileage?: number | null;
    fuelLevel?: number | null;
    isClean?: boolean;
    damages?: string;
    comments?: string;
    conditions?: string;
    photos?: string[];
    acceptations?: { loueur?: boolean; locataire?: boolean };
    ownerSignature?: SignatureEnvoyee;
    renterSignature?: SignatureEnvoyee;
  };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const { bookingId, type } = corps;
  if (!bookingId || (type !== 'depart' && type !== 'retour')) {
    return NextResponse.json({ error: 'Réservation et type requis.' }, { status: 400 });
  }

  // La RLS ne renvoie que les réservations dont l'utilisateur est partie.
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, owner_id, renter_id, status, start_date, end_date, total_days,
      daily_price, subtotal, service_fee, deposit_amount, total_amount,
      vehicle:vehicles(id, title, brand, model, year, license_plate, category,
                       city, address, mileage_limit_per_day, description),
      renter:profiles!bookings_renter_id_fkey(id, full_name, phone, city),
      owner:profiles!bookings_owner_id_fkey(id, full_name, phone, city, company_name),
      payments(kind, status)
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
  }

  // C'est le loueur qui conduit l'état des lieux, sur son appareil.
  if (booking.owner_id !== user.id) {
    return NextResponse.json(
      { error: 'Seul le propriétaire du véhicule peut établir l’état des lieux.' },
      { status: 403 }
    );
  }

  const payee = booking.payments.some(p => p.kind === 'location' && p.status === 'reussi');

  if (type === 'depart') {
    if (!payee) {
      return NextResponse.json(
        { error: 'La location doit être payée avant la remise du véhicule.' },
        { status: 409 }
      );
    }
    if (booking.status !== 'confirmee') {
      return NextResponse.json(
        { error: 'Seule une réservation confirmée peut faire l’objet d’un départ.' },
        { status: 409 }
      );
    }
  } else if (booking.status !== 'en_cours') {
    return NextResponse.json(
      { error: 'Le retour ne peut être établi que sur une location en cours.' },
      { status: 409 }
    );
  }

  // Chaque partie coche sa propre case : c'est ce qui donne sa valeur à la
  // déclaration de lecture. On refuse côté serveur, pas seulement dans l'écran.
  if (!corps.acceptations?.loueur || !corps.acceptations?.locataire) {
    return NextResponse.json(
      { error: 'Les deux parties doivent avoir accepté les conditions.' },
      { status: 400 }
    );
  }

  const signatureLoueur = decoderSignature(corps.ownerSignature);
  const signatureClient = decoderSignature(corps.renterSignature);
  if (!signatureLoueur || !signatureClient) {
    return NextResponse.json(
      { error: 'Les deux signatures sont requises.' },
      { status: 400 }
    );
  }

  // À partir d'ici on écrit : le client service role contourne la RLS, qui
  // n'autorise aucune écriture directe sur ces tables.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 503 }
    );
  }

  const maintenant = new Date().toISOString();

  // Le contrat, figé. On y recopie les valeurs plutôt que d'y mettre des
  // identifiants : le document doit rester lisible même si le véhicule ou le
  // profil est modifié ou supprimé par la suite.
  const contrat = {
    version: 1,
    etabli_le: maintenant,
    type,
    loueur: booking.owner,
    locataire: booking.renter,
    vehicule: booking.vehicle,
    location: {
      debut: booking.start_date,
      fin: booking.end_date,
      jours: booking.total_days,
      prix_jour: booking.daily_price,
      sous_total: booking.subtotal,
      frais_service: booking.service_fee,
      total_paye: booking.total_amount,
      caution: booking.deposit_amount,
    },
    etat: {
      kilometrage: corps.mileage ?? null,
      carburant_huitiemes: corps.fuelLevel ?? null,
      proprete: corps.isClean ?? null,
      dommages: corps.damages?.trim() || null,
      observations: corps.comments?.trim() || null,
    },
    conditions_particulieres: corps.conditions?.trim() || null,
    // Trace des acceptations : sans elle, la case cochée ne laisse rien
    // derrière et ne prouve rien en cas de contestation.
    acceptations: {
      loueur: { nom: booking.owner?.full_name ?? null, accepte_le: maintenant },
      locataire: { nom: booking.renter?.full_name ?? null, accepte_le: maintenant },
    },
  };

  const { data: inspection, error: insertError } = await admin
    .from('inspections')
    .insert({
      booking_id: booking.id,
      type,
      mileage: corps.mileage ?? null,
      fuel_level: corps.fuelLevel ?? null,
      is_clean: corps.isClean ?? null,
      damages: corps.damages?.trim() || null,
      comments: corps.comments?.trim() || null,
      contract_snapshot: contrat,
      owner_signed_at: maintenant,
      renter_signed_at: maintenant,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insertError || !inspection) {
    // UNIQUE (booking_id, type) : l'état des lieux existe déjà.
    const deja = insertError?.code === '23505';
    return NextResponse.json(
      { error: deja ? 'Cet état des lieux a déjà été établi.' : (insertError?.message ?? 'Erreur inconnue') },
      { status: deja ? 409 : 500 }
    );
  }

  // Signatures : bucket privé, chemin préfixé par la réservation pour que la
  // politique de lecture puisse vérifier l'appartenance.
  const base = `${booking.id}/${inspection.id}`;
  const chemins: Record<'owner' | 'renter', string> = {
    owner: `${base}/signature-loueur.png`,
    renter: `${base}/signature-locataire.png`,
  };

  await admin.storage.from(BUCKET).upload(chemins.owner, signatureLoueur, {
    contentType: 'image/png',
    upsert: true,
  });
  await admin.storage.from(BUCKET).upload(chemins.renter, signatureClient, {
    contentType: 'image/png',
    upsert: true,
  });

  await admin
    .from('inspections')
    .update({
      owner_signature_path: chemins.owner,
      renter_signature_path: chemins.renter,
    })
    .eq('id', inspection.id);

  // Photos : le client les a déjà téléversées, il n'envoie que les chemins.
  // On vérifie qu'ils sont bien sous le dossier de cette réservation, sinon
  // une requête forgée pourrait rattacher n'importe quel fichier.
  const photos = (corps.photos ?? []).filter(p => p.startsWith(`${booking.id}/`));
  if (photos.length) {
    await admin.from('inspection_photos').insert(
      photos.map((path, i) => ({
        inspection_id: inspection.id,
        path,
        position: i,
        label: type === 'depart' ? 'Départ' : 'Retour',
      }))
    );
  }

  // L'état des lieux signé fait avancer la location — c'est lui qui fait foi.
  const { error: statutError } = await admin
    .from('bookings')
    .update({
      status: type === 'depart' ? 'en_cours' : 'terminee',
      updated_at: maintenant,
    })
    .eq('id', booking.id);

  if (statutError) {
    return NextResponse.json(
      { error: `État des lieux enregistré, mais statut non mis à jour : ${statutError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ inspectionId: inspection.id });
}
