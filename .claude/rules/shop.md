---
description: Rules for public shop pages
paths:
  - "src/app/(shop)/**"
  - "src/components/ui/ProductCard.tsx"
  - "src/components/ui/ProductGallery.tsx"
---

- Use anon Supabase client + RLS policies. Never use service role key.
- Price display: always use formatPrice() from src/lib/utils.ts.
- Price fallback: use sale_price ?? price (nullish coalescing), never ||.
- Images: use getStorageUrl() for Supabase storage images.
- Keep layouts airy with off-white background and blue accents per design spec.
- Show Skeleton components while data loads, not blank screens.
