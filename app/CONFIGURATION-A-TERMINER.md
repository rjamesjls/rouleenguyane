# Configuration à terminer avant mise en service

- Le projet Supabase existant est de nouveau joignable après confirmation de son URL par l’éditeur. La requête complète du catalogue retourne deux véhicules en ligne sans erreur. Aucune modification des identifiants n’a été nécessaire.
- Ajouter `http://localhost:3000/auth/recovery` aux URL de redirection autorisées dans Supabase Auth pour le test local. Ajouter l’équivalent HTTPS du domaine de production lors du déploiement. Le parcours utilise un code PKCE, échangé côté serveur avant le choix du nouveau mot de passe.
- Tester réellement l’envoi et l’ouverture d’un email de récupération une fois Supabase rétabli. Un lien expiré doit proposer un nouvel envoi.
- Adresse générale approuvée par l’éditeur : `contact@rouleenguyane.fr`, affichée sur Contact et dans les mentions légales. `SUPPORT_EMAIL` peut remplacer l’adresse sur la page Contact. Les éventuels contacts spécialisés restent à confirmer.
- Finaliser les renseignements et conditions marqués par le composant `AC` dans les sources des pages légales. Les notes de travail restent dans les fichiers ; les visiteurs voient une mention d’information en cours de validation. Ces documents ne sont pas considérés comme finalisés.
- Retester les disponibilités avec deux locations consécutives : le jour de retour de la première doit pouvoir être le jour de départ de la seconde (intervalle de location `[départ, retour[`).

## Contrôles réalisés

Informations de l’éditeur recoupées avec https://www.starplay.fr/legal le 22 octobre 2026 : JAMES LEGEND STUDIO - JLS, siège à Mana, directeur Romario JAMES, hébergeur Vercel. L’éditeur a confirmé que le numéro à retenir est celui du SIRET 85301261500011 : SIREN 853 012 615, RCS Cayenne 853 012 615. Le numéro contradictoire de Starplay n’est pas repris. Forme juridique, capital, TVA, téléphone et médiateur ne sont pas renseignés dans cette source. L’adresse contact@rouleenguyane.fr fournie par l’éditeur est utilisée pour le contact, les réclamations, les signalements et les demandes relatives aux données personnelles de JELOUE.

Compilation de production et TypeScript réussis. Navigation vers les pages d’information, FAQ, récupération de mot de passe, changement de catégorie, fermeture du menu mobile et fermeture des filtres vérifiés dans le navigateur. Aucune réservation, création de compte ni transaction de paiement effectuée.
