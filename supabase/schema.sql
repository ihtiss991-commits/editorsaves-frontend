-- EditorSaves Supabase schema
-- Run this script in the Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  upload_timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  status TEXT DEFAULT 'pending'
);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do everything" ON uploads;
CREATE POLICY "Service role can do everything"
  ON uploads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Private storage bucket for uploaded save files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('save-files', 'save-files', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- The application uses the Supabase service-role client server-side, which bypasses
-- Storage RLS. These policies make the intended access model explicit and prevent
-- browser sessions from reading or writing the bucket.
DROP POLICY IF EXISTS "Service role can manage save files" ON storage.objects;
CREATE POLICY "Service role can manage save files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'save-files' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'save-files' AND auth.role() = 'service_role');
