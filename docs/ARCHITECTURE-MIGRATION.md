# DJANVUƐ — Architecture cible et plan de migration

## Décision
Le dépôt actuel est une application React 19 + Vite + TypeScript utilisant Supabase JS côté navigateur. La cible est Next.js App Router + TypeScript + Tailwind CSS, PostgreSQL et Cloudflare R2.
La migration se fait dans cette branche isolée. Ne pas remplacer la branche de production ni supprimer l'application existante avant validation fonctionnelle, sécurité et responsive.

## Principes non négociables
- Branding visible : **DJANVUƐ**, avec le caractère grec epsilon Ɛ.
- Mobile-first : vérifier les vues à 360 px, 390 px, 768 px et desktop.
- Pas de faux succès : toutes les mutations doivent avoir un état de chargement, un résultat persistant ou une erreur explicite.
- Les secrets R2, clés PostgreSQL privées et secrets de session ne sont jamais exposés au client.
- L'autorisation est vérifiée côté serveur pour chaque ressource; un identifiant fourni par le client n'est jamais une preuve de propriété.
- PostgreSQL applique contraintes, index et clés étrangères; les API vérifient l'utilisateur et les permissions.
- Médias privés R2 accessibles uniquement via API autorisée et URL signée à courte durée, si applicable.
- Les erreurs ne doivent pas divulguer les secrets ou détails internes.

## État constaté du dépôt
- package.json : React 19, Vite 7, TypeScript et @supabase/supabase-js; aucun Next.js ni Tailwind n'est configuré actuellement.
- src/App.tsx : application frontend existante à conserver comme référence fonctionnelle durant la migration.
- src/lib/supabase.ts : client Supabase navigateur utilisant uniquement l'URL et la clé publishable.
- .env.example : variables Vite/Supabase uniquement.
- README.md : plusieurs fonctions (flux en direct, communautés, notifications, médias) restent en développement ou en aperçu. Auditer chaque module avant de le déclarer terminé.

## Architecture cible
- src/app/ : App Router, layout, pages, handlers API sous api/**/route.ts.
- src/components/ : composants UI par domaine; Server Components par défaut, Client Components lorsque l'interactivité l'exige.
- src/lib/db.ts : pool PostgreSQL côté serveur et validation stricte des variables d'environnement.
- src/lib/auth/ : intégration d'une authentification unique. Décider si Supabase Auth est conservé; ne pas ajouter JWT et bcrypt en parallèle sans besoin justifié.
- src/lib/storage/r2.ts : adaptateur serveur S3-compatible utilisant les variables privées R2.
- src/lib/validation/ : validation stricte des entrées.
- src/app/api/auth/, posts/, messages/, cloud/, admin/ : handlers protégés par identité et autorisation.
- database/schema.sql et database/migrations/ : schéma et migrations reproductibles.
- tests/ : tests de règles d'accès, API et responsive.

## Modèle de données minimal à concevoir
- profiles : profil public lié à l'identité authentifiée.
- posts, post_media, post_likes, comments : publications et interactions.
- follows : relation d'abonnement avec contrainte d'unicité.
- conversations, conversation_members, messages : conversations, participants, messages et statut de lecture.
- notifications : destinataire, type, référence, lu/non lu.
- cloud_files : propriétaire, clé R2 non publique, nom, type MIME, taille, visibilité, dates et statut.
- audit_events (si nécessaire) : opérations sensibles avec données minimales.
Comparer le schéma définitif au schéma Supabase existant avant toute migration afin d'éviter les pertes et doublons.

## Isolation et sécurité Cloud
1. L'API identifie l'utilisateur depuis une session vérifiée côté serveur.
2. Pour lire, modifier, supprimer ou signer un fichier, la requête SQL filtre aussi par user_id (ou par une permission explicite de partage).
3. La clé d'objet R2 est générée côté serveur; ne jamais accepter une clé arbitraire du client comme autorisation.
4. Vérifier taille, type réel, limites et quotas d'upload.
5. Les buckets restent privés par défaut. Une URL signée n'est émise qu'après vérification des droits et avec expiration courte.
6. Ne jamais exposer R2_SECRET_ACCESS_KEY, DATABASE_URL ou AUTH_SECRET dans des variables NEXT_PUBLIC_*.
7. Ajouter des tests négatifs : l'utilisateur A ne peut ni lire, ni signer, ni supprimer le fichier de B.

## Variables d'environnement cibles
Variables serveur (exemples de noms, sans valeurs secrètes) : DATABASE_URL, AUTH_SECRET uniquement si nécessaire, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT.
Variables publiques uniquement si nécessaires : URL publique du site et identifiants conçus pour être publics, par exemple la clé publishable Supabase si Supabase Auth reste côté client.
Ne jamais committer .env.local.

## Phases de migration
### Phase 0 — audit et inventaire
- Lister pages, composants, appels Supabase, tables, RPC, politiques RLS et variables.
- Distinguer les fonctionnalités persistées des aperçus et données de démonstration.
- Sauvegarder et inventorier les migrations SQL avant toute modification du schéma.
### Phase 1 — socle Next.js
- Initialiser Next.js App Router, TypeScript strict et Tailwind.
- Installer les dépendances nécessaires après choix de l'authentification et de la base.
- Ajouter validation de configuration, journalisation sans secrets, lint, build et tests.
- Garder le socle dans une branche dédiée, sans bascule production.
### Phase 2 — identité et base de données
- Implémenter une stratégie d'authentification unique.
- Définir migrations SQL, contraintes, index et contrôle d'accès.
- Tester accès anonymes, autorisés et accès croisés interdits.
### Phase 3 — système visuel et navigation
- Construire tokens visuels, typographie, boutons, formulaires et cartes.
- Navigation mobile adaptée, fil centré sur les contenus, vues cloud et messages distinctes.
- Tests aux largeurs 360, 390, 768 px et desktop.
### Phase 4 — migration fonctionnelle progressive
- Profils et flux; réactions, commentaires et abonnements; messagerie et notifications; stockage R2 et médiathèque; administration et modération.
- Chaque module n'est déclaré prêt qu'après tests de persistance, permissions, erreurs et expérience mobile.
### Phase 5 — validation et bascule
- Tests de build, tests d'intégration et de sécurité.
- Vérification des migrations et stratégie de retour arrière.
- Déploiement de prévisualisation, validation manuelle, puis bascule explicite.

## Critères de sortie
- Build et tests réussis.
- Aucun secret dans le bundle navigateur.
- Tests démontrant l'isolation des fichiers entre utilisateurs.
- Les interactions critiques persistent en base.
- Les écrans principaux sont utilisables à 360/390/768 px et desktop.
- Aucune migration destructive sans sauvegarde et plan de retour arrière.