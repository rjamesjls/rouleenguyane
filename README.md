# ROULÉ en Guyane / JELOUE

Plateforme de location de véhicules en Guyane. Application Next.js dans `app/`, avec Supabase et Stripe.

## Lancement local

Depuis `app/` :

```sh
npm ci
cp .env.example .env.local
# Renseigner les variables dans .env.local
npm run dev
```

Contrôles : `npm run typecheck` et `npm run build` depuis `app/`.
Pour Vercel, définir `app` comme répertoire racine et configurer les variables d’environnement dans le projet.

## Véhicules, couleurs et photos

Une annonce représente un véhicule physique identifié par son immatriculation. Le propriétaire choisit sa couleur et ajoute ses photos, avec une photo principale. Chaque véhicule conserve son tarif, ses réservations et son calendrier. Pour plusieurs voitures du même modèle, créer une annonce par voiture ; aucune substitution de couleur à la réservation.

Le catalogue propose uniquement les couleurs des véhicules correspondant aux critères actifs, y compris les dates une fois leur disponibilité vérifiée. La fiche affiche la couleur et les photos du véhicule effectivement réservé.

## Configuration et données

Consulter `app/CONFIGURATION-A-TERMINER.md` pour les vérifications de mise en service. Les fichiers SQL dans `supabase/` comprennent un ancien schéma historique : ne pas les appliquer aveuglément à la base active. Les types actuels se trouvent dans `app/src/types/database.ts` ; un export complet et à jour des migrations reste nécessaire pour recréer une base vierge.

Les secrets, dépendances et fichiers générés ne sont pas inclus dans Git. Aucun déploiement n’est déclenché par ce dépôt lui-même.
