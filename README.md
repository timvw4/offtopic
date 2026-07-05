# OFF-TOPIC (Next.js + Supabase)

Jeu de dessin + déduction multijoueur, mobile-first.

- **Mode classique** : 3 à 15 joueurs (Civil + Hors-Thème)
- Rôles spéciaux et mode Duel désactivés par défaut (voir `lib/gameFeatures.ts`)

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

## Feature flags

Fichier central : `lib/gameFeatures.ts`

```typescript
export const GAME_FEATURES = {
  duelMode: false,
  cameleon: false,
  dictator: false,
  fantome: false,
};
```

Passe un flag à `true` pour réactiver un mode ou un rôle spécial sans toucher au reste du code.

## Architecture

- Front : Next.js App Router (`app/`)
- Realtime : Supabase (tables + events)
- State machine : `lib/stateMachine.ts`
- Feature flags : `lib/gameFeatures.ts`
- Canvas : `components/DrawingCanvas.tsx`
- API sécurisées (service key) : `app/api/*`

## Flux jeu

Lobby → Mot secret → Dessin (30/45/60/90/120 s) → Révélation → Vote secret → Résultat → boucle.

## Règles backend clés

- Pseudo unique par salle (contrainte DB)
- 1 vote par joueur et par manche (contrainte unique)
- Plusieurs Hors-Thème possibles (réglage hôte)
- Égalité au vote : l'hôte peut relancer un vote ciblé entre les ex æquo depuis l'écran résultats

## Ajout de mots

Ajoute des lignes dans `word_pairs` (FR/EN), ou crée une nouvelle migration seed.

## À tester

- Multi onglets pour simuler plusieurs joueurs
- Timer et blocage de dessin après expiration
- Égalités de vote et revote (bouton « Relancer un vote » côté hôte)

## Déploiement (Vercel)

Le jeu est en ligne sur **[https://www.off-topic.ch](https://www.off-topic.ch)**.

### Jouer depuis un téléphone

1. Ouvre **https://www.off-topic.ch** dans Safari (iPhone) ou Chrome (Android).
2. Crée une partie et partage le **code de salle** à tes amis.
3. (Optionnel) Sur iPhone : bouton **Partager → Sur l’écran d’accueil** pour l’ajouter comme une app.

### Redéployer après des modifications

Variables d’environnement déjà configurées sur Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Commandes :

```bash
npm run build          # vérifier en local d'abord
vercel deploy --prod   # publier la version actuelle
```

### Première installation Vercel (référence)

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local   # récupère les clés depuis Vercel
vercel deploy --prod
```
