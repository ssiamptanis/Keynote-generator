"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client, used from client components (login form,
// generate form, deck viewer). Relies on the anon key + RLS policies —
// never put the service-role key here.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
