import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});

// Required env vars for E2E (set in shell or .env before running):
// E2E_USER_EMAIL    — test user email (must exist in Supabase)
// E2E_USER_PASSWORD — test user password
// E2E_ADMIN_EMAIL   — admin email
// E2E_ADMIN_PASSWORD — admin password
