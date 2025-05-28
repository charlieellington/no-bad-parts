import { createClient } from "@supabase/supabase-js";

// For server-side queries that need elevated privileges we ideally use the
// Supabase **service role** key. During local development this secret may be
// omitted; to avoid hard-crashing the app we gracefully fall back to the
// public **anon** key which still has `SELECT` access to the
// `waitlist_public` view (but nothing else).

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      // We are only running this on the server; no session persistence needed.
      persistSession: false,
    },
  });
}; 