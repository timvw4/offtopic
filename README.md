# OFF-TOPIC (Next.js + Supabase)

Jeu de dessin + déduction multijoueur (3-8 joueurs), mobile-first.

## Démarrer vite
1) Copie `env.sample` en `.env.local` et remplis les clés Supabase.
2) `npm install`
3) Crée la base : applique `supabase/migrations/0001_off_topic.sql` dans Supabase SQL editor.
4) `npm run dev`

## Architecture
- Front: Next.js App Router (`app/`)
- Realtime: Supabase (tables + events)
- State machine: `lib/stateMachine.ts`
- Canvas: `components/DrawingCanvas.tsx`
- API sécurisées (service key) : `app/api/*`

## Flux jeu
Lobby → Mot secret → Dessin (30/60/90s) → Révélation → Vote secret + accusation Caméléon → Résultat → boucle.

## Règles backend clés
- Pseudo unique par salle (contrainte DB)
- 1 vote par joueur et par manche (contrainte unique)
- 1 accusation Caméléon par joueur (contrainte unique)
- Plusieurs Hors-Thème possibles

## Ajout de mots
Ajoute des lignes dans `word_pairs` (FR/EN).

## À tester
- Multi onglets pour simuler plusieurs joueurs
- Timer et blocage de dessin après expiration
- Égalités de vote: à compléter côté backend selon règle (revote ou statu quo)
