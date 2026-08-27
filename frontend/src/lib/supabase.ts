import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jaagiioxpnbawfmoxoih.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYWdpaW94cG5iYXdmbW94b2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDU2MTYsImV4cCI6MjEwMzE4MTYxNn0.7I_ggd_NFddCe3AB__jYlKKSUa8vsBNWRjVVCuW-roQ';

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Retorna o cliente singleton do Supabase configurado para o NEXUS ERP.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClientInstance;
}

export const supabase = getSupabase();

export default supabase;
