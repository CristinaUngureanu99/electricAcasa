'use client';

import { useEffect } from 'react';

/**
 * Detects and clears corrupt Supabase auth cookies that cause
 * "Authorization header invalid value" or "Failed to execute fetch" errors.
 *
 * This runs once on app load. If cookies look corrupt, it clears them
 * so the auth client can start fresh.
 */
export default function AuthCookieGuard() {
  useEffect(() => {
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const supabaseCookies = cookies.filter(c => c.startsWith('sb-'));

      for (const cookie of supabaseCookies) {
        const [name, ...valueParts] = cookie.split('=');
        const value = valueParts.join('=');

        if (!value || value === 'undefined' || value === 'null') {
          // Corrupt cookie — clear it
          document.cookie = `${name}=; path=/; max-age=0`;
          continue;
        }

        // Check for non-base64url cookies that might be from old SSR versions
        // Valid values either start with "base64-" or are URL-safe base64
        if (value.includes('{') && value.includes('"')) {
          // Raw JSON in cookie — old format, clear it
          document.cookie = `${name}=; path=/; max-age=0`;
        }
      }
    } catch {
      // Silently ignore — cookie guard is best-effort
    }
  }, []);

  return null;
}
