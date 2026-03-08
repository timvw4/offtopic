-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0021 : déplace les dessins de la DB vers Supabase Storage
--
-- Avant : la colonne "data_url" contenait un énorme texte base64 (~150 Ko/dessin)
-- Après : "data_url" contient une URL courte (~80 chars) vers le fichier dans Storage
--
-- Le bucket "drawings" est public → les URL publiques fonctionnent sans auth.
-- La clé service_role utilisée par l'API contourne le RLS pour les writes.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Crée le bucket "drawings" (public, limite 512 Ko par image PNG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'drawings',
  'drawings',
  true,
  524288,
  ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique de lecture publique : n'importe qui peut afficher les dessins
--    (nécessaire pour que les URL publiques fonctionnent dans les navigateurs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read drawings'
  ) THEN
    CREATE POLICY "Public can read drawings"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'drawings');
  END IF;
END $$;
