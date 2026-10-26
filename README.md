# DJANVUƐ — plateforme sociale et cloud

## Architecture en cours de migration

La branche `architecture/nextjs-postgres-r2` introduit le socle cible **Next.js App Router + TypeScript + Tailwind CSS**, avec des adaptateurs serveur PostgreSQL et Cloudflare R2.

La migration est progressive : l'application React/Vite historique reste dans le dépôt pour référence et ne doit pas être supprimée avant l'audit et la migration des fonctionnalités.

## Démarrage local du nouveau socle

1. Utiliser une version de Node.js compatible avec Next.js 16 (Node.js 20.9 ou plus récente).
2. Installer les dépendances : `npm install`.
3. Copier `.env.example` vers `.env.local`, puis renseigner les variables nécessaires côté serveur.
4. Lancer `npm run dev`.
5. Vérifier `npm run lint` et `npm run build` avant de déployer.

Ne jamais committer `.env.local`. Les variables `DATABASE_URL`, `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY` sont strictement serveur et ne doivent jamais être préfixées par `NEXT_PUBLIC_`.

## Sécurité et état des fonctions

- Le client PostgreSQL et l'adaptateur R2 sont isolés côté serveur.
- Le code d'initialisation ne constitue pas encore une API de fichiers : chaque route devra authentifier l'utilisateur, vérifier sa propriété en base et n'émettre une URL signée qu'après autorisation.
- La stratégie d'authentification doit être arrêtée après audit de Supabase Auth, des tables et des politiques RLS existantes.
- Le nouveau frontend est un socle visuel; il ne prétend pas encore offrir le feed connecté, la messagerie persistante ou les uploads.
- Voir `docs/ARCHITECTURE-MIGRATION.md` pour les phases, les critères de sécurité et les conditions de bascule.
