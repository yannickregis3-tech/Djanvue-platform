# DJANVUƐ — migration progressive vers Next.js

Cette branche isole la migration vers Next.js App Router sans toucher à `main` ni interrompre la version actuellement publiée.

## Principes
- Conserver Supabase comme PostgreSQL et fournisseur d'authentification pendant la transition.
- Ne jamais exposer les clés privées R2, les secrets serveur ou une clé Supabase service-role au navigateur.
- Implémenter les actions avec persistance réelle; aucun faux succès pour les modules non connectés.
- Protéger chaque opération Cloud par l'identité authentifiée et la propriété `user_id` vérifiée côté serveur.
- Migrer par modules, avec vérifications de build et de comportement avant toute fusion.

## Ordre
1. Socle App Router, layout responsive et configuration TypeScript.
2. Couche d'accès serveur à Supabase et authentification.
3. Feed connecté aux tables existantes (posts, likes, comments, profiles).
4. Création de publication et médias; R2 via API serveur signée.
5. Messages, notifications et communautés.
6. Cloud privé, puis administration avec contrôle de rôle côté serveur.

## Important
Le dépôt `main` est actuellement une application React + Vite. Cette branche est une zone de migration indépendante. Ne pas basculer la production avant que les fonctionnalités existantes soient réimplémentées et testées.