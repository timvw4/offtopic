# OFF-TOPIC (Next.js + Supabase)

Jeu de dessin + déduction multijoueur, mobile-first.

- **Mode classique** : 3 à 15 joueurs
- **Mode Duel** : 2 joueurs (même mot, comparaison des dessins)

## Démarrer vite

1. Copie `env.sample` en `.env.local` et remplis les clés Supabase.
2. `npm install`
3. Crée la base : applique **toutes** les migrations SQL dans l'ordre, dans l'éditeur SQL Supabase :
   - `supabase/migrations/0001_off_topic.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - … jusqu'à …
   - `supabase/migrations/0024_pop_culture_theme.sql`
   
   Les fichiers doivent être exécutés **dans l'ordre numérique** (0001 → 0024).
4. `npm run dev`

## Architecture

- Front : Next.js App Router (`app/`)
- Realtime : Supabase (tables + events)
- State machine : `lib/stateMachine.ts`
- Canvas : `components/DrawingCanvas.tsx`
- API sécurisées (service key) : `app/api/*`

## Flux jeu

Lobby → Mot secret → Dessin (30/45/60/90/120 s) → Révélation → Vote secret + accusation Caméléon → Résultat → boucle.

## Règles backend clés

- Pseudo unique par salle (contrainte DB)
- 1 vote par joueur et par manche (contrainte unique)
- 1 accusation Caméléon par joueur (contrainte unique)
- Plusieurs Hors-Thème possibles
- Égalité au vote : l'hôte peut relancer un vote ciblé entre les ex æquo depuis l'écran résultats

## Ajout de mots

Ajoute des lignes dans `word_pairs` (FR/EN), ou crée une nouvelle migration seed.

## À tester

- Multi onglets pour simuler plusieurs joueurs
- Timer et blocage de dessin après expiration
- Égalités de vote et revote (bouton « Relancer un vote » côté hôte)
- Mode Duel à 2 joueurs
