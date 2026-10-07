import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  const trimmedKey = serviceRoleKey.trim();

  if (!trimmedKey.startsWith('eyJ')) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY must be a legacy JWT starting with "eyJ". Got prefix: "${trimmedKey.substring(0, 15)}"`
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, trimmedKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
