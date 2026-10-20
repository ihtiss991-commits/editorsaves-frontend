-- EditorSaves upload schema
-- Run this script in the Supabase SQL Editor before enabling production uploads.
-- The uploads table is intentionally private: only the service-role server route writes/reads it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  ip_address TEXT,
  file_hash TEXT NOT NULL,
  reported_game_title TEXT,
  reported_game_title_key TEXT,
  content_status TEXT NOT NULL DEFAULT 'user_uploaded',
  upload_timestamp TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending'
);

-- Upgrade an existing installation of the earlier schema without dropping saved records.
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS reported_game_title TEXT;
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS reported_game_title_key TEXT;
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS content_status TEXT DEFAULT 'user_uploaded';
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS upload_timestamp TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS uploads_ip_address_idx ON public.uploads (ip_address);
CREATE INDEX IF NOT EXISTS uploads_file_hash_idx ON public.uploads (file_hash);
CREATE INDEX IF NOT EXISTS uploads_reported_game_title_key_idx ON public.uploads (reported_game_title_key);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do everything" ON public.uploads;
CREATE POLICY "Service role can do everything"
  ON public.uploads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Private storage bucket for uploaded save files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('save-files', 'save-files', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage is only accessible through the server-side service-role client.
DROP POLICY IF EXISTS "Service role can manage save files" ON storage.objects;
CREATE POLICY "Service role can manage save files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'save-files' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'save-files' AND auth.role() = 'service_role');
