#!/usr/bin/env node

import { createInterface } from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log('\n--- Business App Skeleton Bootstrap ---\n');

  const name = await ask('App name (e.g. "My Store"): ');
  const url = await ask('Site URL (e.g. "https://mystore.com"): ');
  const email = await ask('Contact email (e.g. "hello@mystore.com"): ');
  const phone = await ask('Contact phone (e.g. "+40700000000"): ');

  if (!name.trim()) {
    console.error('App name is required.');
    process.exit(1);
  }

  const root = resolve(import.meta.dirname, '..');
  const siteUrl = url.trim() || 'https://example.com';
  const contactEmail = email.trim() || 'hello@example.com';
  const contactPhone = phone.trim() || '+40700000000';
  const appName = name.trim();
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Escape single quotes for safe string interpolation into TypeScript
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // 1. Update src/config/site.ts
  const sitePath = resolve(root, 'src/config/site.ts');
  const domain = siteUrl.replace(/^https?:\/\//, '');
  const siteContent = `export const site = {
  name: '${esc(appName)}',
  nameFull: '${esc(appName)}',
  tagline: 'Welcome to ${esc(appName)}',
  welcome: 'Welcome to ${esc(appName)}',
  team: 'The ${esc(appName)} Team',
  logoAlt: '${esc(appName)}',

  url: process.env.NEXT_PUBLIC_SITE_URL || '${esc(siteUrl)}',
  fromEmail: process.env.EMAIL_FROM || '${esc(appName)} <noreply@${esc(domain)}>',

  contact: {
    email: '${esc(contactEmail)}',
    phone: '${esc(contactPhone)}',
  },
} as const;
`;
  writeFileSync(sitePath, siteContent);
  console.log('  Updated src/config/site.ts');

  // 2. Update package.json name
  const pkgPath = resolve(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = slug;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('  Updated package.json');

  // 3. Update public/manifest.json
  const manifestPath = resolve(root, 'public/manifest.json');
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    manifest.name = appName;
    manifest.short_name = appName;
    manifest.description = `Welcome to ${appName}`;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log('  Updated public/manifest.json');
  } catch {
    console.log('  Skipped manifest.json (not found)');
  }

  console.log('\nDone! Next steps:');
  console.log('  1. Replace public/logo.png and public/favicon.png');
  console.log('  2. Fill in .env.local with your Supabase credentials');
  console.log('  3. Apply supabase/migrations/001_initial_schema.sql');
  console.log('  4. Run: npm run dev\n');

  rl.close();
}

main();
