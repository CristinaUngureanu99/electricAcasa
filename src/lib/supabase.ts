import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.replace(/\s+/g, '')
  );

  return client;
}

// Clear all Supabase cookies and destroy the cached client.
// Call this before auth operations to ensure a clean state.
export function resetAuthState() {
  document.cookie.split(';').forEach(c => {
    const name = c.trim().split('=')[0];
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  });
  client = null;
}
