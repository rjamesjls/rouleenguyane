# 🚗 JELOUE — Plateforme de location de véhicules en Guyane
### Vision globale & Architecture du projet

---

## 1. POSITIONNEMENT

**Nom suggéré :** ROULÉ *(ou à affiner selon ta sensibilité culturelle locale)*
**Tagline :** *Le véhicule qu'il te faut, quand tu en as besoin.*

**Concept :** Une marketplace de mise en relation entre loueurs locaux (professionnels et particuliers) et clients en Guyane française, couvrant voitures, motos/scooters et utilitaires.

**Différenciation locale :**
- Adapté aux réalités guyanaises (paiement mobile, zones peu couvertes, véhicules 4x4 pour l'intérieur)
- Interface disponible en français
- Confiance renforcée par un système de vérification identité/permis intégré

---

## 2. LES DEUX FACES DE LA PLATEFORME

### 👤 Côté CLIENT
- Rechercher un véhicule par ville, dates, type, budget
- Voir les disponibilités en temps réel
- Réserver et payer en ligne (ou confirmer paiement en espèces)
- Gérer ses réservations et laisser des avis
- Contacter le loueur directement

### 🏢 Côté LOUEUR
- Créer son profil (particulier ou professionnel)
- Ajouter ses véhicules (photos, tarifs, disponibilités, conditions)
- Gérer les demandes de réservation (accepter / refuser / négocier)
- Suivre ses revenus et ses avis
- Tableau de bord simple, complet et rapide

---

## 3. ARCHITECTURE FONCTIONNELLE

```
JELOUE
├── Authentification
│   ├── Inscription client (email / téléphone)
│   ├── Inscription loueur (vérification SIRET ou pièce d'identité)
│   └── KYC : vérification permis de conduire du client
│
├── Catalogue véhicules
│   ├── Filtres : type, ville, dates, prix, nombre de places
│   ├── Fiches véhicules (photos, specs, conditions, assurance)
│   └── Calendrier de disponibilité en temps réel
│
├── Réservation
│   ├── Sélection dates + lieu de prise en charge
│   ├── Devis automatique (tarif × jours + frais de service)
│   ├── Confirmation loueur (immédiate ou sous 24h)
│   └── Contrat de location généré automatiquement (PDF)
│
├── Paiement
│   ├── Carte bancaire (Stripe)
│   ├── Virement / espèces confirmé manuellement
│   └── Caution bloquée et libérée à la restitution
│
├── Communication
│   ├── Messagerie in-app loueur ↔ client
│   └── Notifications SMS / push (réservation, rappels, alertes)
│
├── Avis & confiance
│   ├── Notation client par le loueur
│   ├── Notation loueur / véhicule par le client
│   └── Badges de vérification (ID, permis, pro)
│
└── Back-office admin
    ├── Validation des comptes loueurs
    ├── Gestion des litiges
    └── Statistiques plateforme
```

---

## 4. STACK TECHNIQUE RECOMMANDÉE

| Couche | Technologie | Raison |
|---|---|---|
| Frontend web | React (Next.js) | SEO, performance, SSR |
| App mobile | React Native (Expo) | iOS + Android, code partagé |
| Backend | Node.js (NestJS) ou Supabase | Rapide à déployer, scalable |
| Base de données | PostgreSQL (via Supabase) | Relationnelle, robuste |
| Paiement | Stripe | Disponible en DOM-TOM |
| Stockage fichiers | Supabase Storage / Cloudflare R2 | Photos véhicules, documents |
| Notifications | Firebase Cloud Messaging + Twilio SMS | Push + SMS |
| Auth | Supabase Auth | Simple, sécurisé |
| Hébergement | Vercel (frontend) + Supabase (backend) | Gratuit au démarrage |

---

## 5. LES RÔLES UTILISATEURS

| Rôle | Description |
|---|---|
| **Client** | Cherche, réserve, paie, note |
| **Loueur particulier** | Loue son propre véhicule |
| **Loueur professionnel** | Agence / flotte, dashboard avancé |
| **Admin** | Valide, modère, supervise |

---

## 6. MODÈLE ÉCONOMIQUE

### Commission plateforme
- **8 à 12 %** prélevés sur chaque réservation confirmée (côté loueur)
- Option : frais de service client (1–3 €) par réservation

### Abonnement loueur Pro *(optionnel)*
- Visibilité boostée, analytics avancés, contrats personnalisés
- Ex : 29 €/mois pour les agences

### Assurance partenaire *(à terme)*
- Partenariat avec un assureur pour proposer une assurance courte durée intégrée
- Commission sur chaque souscription

---

## 7. PARCOURS UTILISATEUR CLÉS

### Client : de la recherche à la clé en main
```
Accueil → Recherche (ville + dates + type) → Liste véhicules
→ Fiche véhicule → Réservation → Paiement → Confirmation
→ Contrat PDF → Prise en charge → Restitution → Avis
```

### Loueur : de l'inscription à l'encaissement
```
Inscription → Vérification identité → Ajout véhicule
→ Publication → Réception demande → Acceptation
→ Remise des clés → Restitution → Paiement reçu → Avis
```

---

## 8. PHASES DE LANCEMENT

### Phase 1 — MVP (0–3 mois)
- [ ] Inscription loueurs + clients
- [ ] Ajout et consultation de véhicules
- [ ] Réservation manuelle (confirmation par téléphone/message)
- [ ] Paiement en espèces confirmé manuellement
- [ ] Interface web simple

### Phase 2 — Automatisation (3–6 mois)
- [ ] Paiement en ligne (Stripe)
- [ ] Génération automatique du contrat PDF
- [ ] Messagerie in-app
- [ ] Notifications push / SMS
- [ ] Avis et notation

### Phase 3 — Croissance (6–12 mois)
- [ ] App mobile iOS + Android
- [ ] Dashboard analytics loueurs
- [ ] Abonnement Pro loueur
- [ ] Assurance intégrée
- [ ] Extension vers Martinique / Guadeloupe

---

## 9. POINTS DE VIGILANCE LOCAUX

1. **Connectivité** : prévoir un mode dégradé (affichage hors ligne des réservations)
2. **Espèces** : une large partie des transactions en Guyane restent cash → prévoir validation manuelle
3. **Confiance** : vérification rigoureuse des identités (fraude, accidents sans assurance)
4. **Saisonnalité** : pics pendant les fêtes, vacances scolaires, carnaval → gérer la surcharge
5. **Multilinguisme** : français + créole guyanais en priorité, portugais (diaspora brésilienne) à terme

---

## 10. PROCHAINES ÉTAPES

| Priorité | Action |
|---|---|
| 🔴 Court terme | Valider le nom de la marque |
| 🔴 Court terme | Prototyper les écrans clés (maquette) |
| 🟠 Moyen terme | Recruter 5–10 loueurs pilotes à Cayenne |
| 🟠 Moyen terme | Lancer le MVP web |
| 🟢 Long terme | Lever des fonds / chercher des partenaires |

---

*Document préparé dans le cadre du projet de plateforme de location de véhicules en Guyane française.*
