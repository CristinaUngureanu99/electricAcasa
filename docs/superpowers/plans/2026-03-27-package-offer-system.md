# Package Offer System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create personalized offers for package requests, and let clients view/accept offers which auto-create orders.

**Architecture:** Extend existing `package_requests` with offer columns + new `package_offer_items` table. Admin builds offers in the existing cereri-pachet page. Clients see offers in a new `/client/cereri-pachet` page. Accepting creates an order directly (no cart). Email notification via Resend.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + RLS), Resend email, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-27-package-offer-system-design.md`

---

### Task 1: Database Migration

**Files:**

- Create: `supabase/migrations/012_package_offer_system.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/012_package_offer_system.sql`:

```sql
-- Package offer system: offer items table, new columns on package_requests, orders, order_items
-- Allows admins to create personalized offers for package requests

-- New columns on package_requests
ALTER TABLE public.package_requests
  ADD COLUMN offer_total numeric(10,2),
  ADD COLUMN offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'closed')),
  ADD COLUMN offer_created_at timestamptz,
  ADD COLUMN offer_notes text;

-- New column on orders to link to package request
ALTER TABLE public.orders
  ADD COLUMN package_request_id uuid REFERENCES public.package_requests(id) ON DELETE SET NULL;

-- Package offer items table
CREATE TABLE public.package_offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.package_requests(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- RLS for package_offer_items
ALTER TABLE public.package_offer_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own offer items (via package_requests.user_id)
CREATE POLICY "Users can view own offer items"
  ON public.package_offer_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.package_requests pr
      WHERE pr.id = request_id AND pr.user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins full access to offer items"
  ON public.package_offer_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Update RLS on package_requests: users should also see offer columns (already covered by existing SELECT policy)
-- Update RLS on orders: the existing user SELECT policy already covers package_request_id
```

- [ ] **Step 2: Run migration against Supabase**

Run: `npx supabase db push`

Verify in Supabase dashboard that:

- `package_requests` has 4 new columns
- `orders` has `package_request_id` column
- `package_offer_items` table exists with RLS enabled
- 2 RLS policies exist on `package_offer_items`

- [ ] **Step 3: Update TypeScript types**

In `src/types/database.ts`, update `PackageRequest` interface (line 137-148):

```typescript
export type PackageRequestStatus = 'new' | 'in_review' | 'answered' | 'closed';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'closed';

export interface PackageRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  attachment_url: string | null;
  status: PackageRequestStatus;
  admin_notes: string | null;
  created_at: string;
  offer_total: number | null;
  offer_status: OfferStatus | null;
  offer_created_at: string | null;
  offer_notes: string | null;
}

export interface PackageOfferItem {
  id: string;
  request_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}
```

Add `package_request_id` to `Order` interface (after line 100, add before `notes`):

```typescript
package_request_id: string | null;
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/012_package_offer_system.sql src/types/database.ts
git commit -m "feat: add package offer system database schema"
```

---

### Task 2: Email Template for Offer Notification

**Files:**

- Modify: `src/lib/email-templates.ts`

- [ ] **Step 1: Add package offer email template**

Add at the end of `src/lib/email-templates.ts` (after `contactFormEmail`, before the closing of the file):

```typescript
interface PackageOfferEmailData {
  clientName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  offerNotes: string | null;
}

export function packageOfferEmail(data: PackageOfferEmailData): { subject: string; html: string } {
  const itemsHtml = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb;">
          <th style="text-align:left;padding:8px 0;font-size:13px;color:#6b7280;">Produs</th>
          <th style="text-align:center;padding:8px;font-size:13px;color:#6b7280;">Cant.</th>
          <th style="text-align:right;padding:8px;font-size:13px;color:#6b7280;">Pret unitar</th>
          <th style="text-align:right;padding:8px 0;font-size:13px;color:#6b7280;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px 0;font-size:14px;">${escapeHtml(item.name)}</td>
            <td style="text-align:center;padding:8px;font-size:14px;">${item.quantity}</td>
            <td style="text-align:right;padding:8px;font-size:14px;">${formatPrice(item.unitPrice)}</td>
            <td style="text-align:right;padding:8px 0;font-size:14px;">${formatPrice(item.unitPrice * item.quantity)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>`;

  const notesHtml = data.offerNotes
    ? `<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;font-weight:600;">Mesaj de la echipa noastra:</p>
        <p style="font-size:14px;color:#1f2937;margin:0;white-space:pre-line;">${escapeHtml(data.offerNotes)}</p>
      </div>`
    : '';

  return {
    subject: `Oferta ta de pachet personalizat — ${site.name}`,
    html: layout(`
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 8px;">Salut, ${escapeHtml(data.clientName)}!</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">
        Am pregatit oferta pentru cererea ta de pachet personalizat.
      </p>
      ${itemsHtml}
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937;">Total: ${formatPrice(data.total)}</p>
      </div>
      ${notesHtml}
      <div style="text-align:center;margin:24px 0;">
        <a href="${site.url}/cereri-pachet" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;">
          Vezi oferta
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;text-align:center;">
        Poti accepta sau refuza oferta din contul tau.
      </p>
    `),
  };
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/email-templates.ts
git commit -m "feat: add email template for package offer notification"
```

---

### Task 3: Admin API — Create/Update Offer

**Files:**

- Create: `src/app/api/admin/package-offer/route.ts`

- [ ] **Step 1: Create the admin offer API route**

Create `src/app/api/admin/package-offer/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';
import { packageOfferEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const body = await request.json();
  const { requestId, items, offerNotes } = body as {
    requestId: string;
    items: { productId?: string; productName: string; quantity: number; unitPrice: number }[];
    offerNotes?: string;
  };

  if (!requestId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Date incomplete' }, { status: 400 });
  }

  // Validate items
  for (const item of items) {
    if (!item.productName || item.quantity < 1 || item.unitPrice < 0) {
      return NextResponse.json({ error: 'Produs invalid in oferta' }, { status: 400 });
    }
  }

  // Fetch the package request
  const { data: pkgRequest, error: reqError } = await supabase
    .from('package_requests')
    .select('id, user_id, name, email, offer_status')
    .eq('id', requestId)
    .single();

  if (reqError || !pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  // Only allow creating/updating if not already accepted
  if (pkgRequest.offer_status === 'accepted') {
    return NextResponse.json({ error: 'Oferta a fost deja acceptata' }, { status: 400 });
  }

  // Calculate total
  const offerTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // Delete existing offer items (if updating)
  await supabase.from('package_offer_items').delete().eq('request_id', requestId);

  // Insert new offer items
  const offerItems = items.map((i) => ({
    request_id: requestId,
    product_id: i.productId || null,
    product_name: i.productName,
    quantity: i.quantity,
    unit_price: i.unitPrice,
  }));

  const { error: insertError } = await supabase.from('package_offer_items').insert(offerItems);
  if (insertError) {
    return NextResponse.json({ error: 'Eroare la salvarea ofertei' }, { status: 500 });
  }

  // Update package request
  const { error: updateError } = await supabase
    .from('package_requests')
    .update({
      offer_total: offerTotal,
      offer_status: 'pending',
      offer_created_at: new Date().toISOString(),
      offer_notes: offerNotes?.trim() || null,
      status: 'answered',
    })
    .eq('id', requestId);

  if (updateError) {
    return NextResponse.json({ error: 'Eroare la actualizarea cererii' }, { status: 500 });
  }

  // Send email to client
  try {
    const { subject, html } = packageOfferEmail({
      clientName: pkgRequest.name,
      items: items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total: offerTotal,
      offerNotes: offerNotes?.trim() || null,
    });
    await sendEmail(pkgRequest.email, subject, html);
  } catch {
    // Email failure is non-blocking
    console.error('Failed to send offer email');
  }

  return NextResponse.json({ success: true, offerTotal });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/package-offer/route.ts
git commit -m "feat: admin API route to create/update package offers"
```

---

### Task 4: Admin API — Close Offer

**Files:**

- Create: `src/app/api/admin/package-offer/close/route.ts`

- [ ] **Step 1: Create the close offer API route**

Create `src/app/api/admin/package-offer/close/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { requestId } = (await request.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: 'requestId lipseste' }, { status: 400 });
  }

  const { error } = await supabase
    .from('package_requests')
    .update({ offer_status: 'closed' })
    .eq('id', requestId)
    .in('offer_status', ['pending']);

  if (error) {
    return NextResponse.json({ error: 'Eroare la inchiderea ofertei' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/package-offer/close/route.ts
git commit -m "feat: admin API route to close package offers"
```

---

### Task 5: Client API — Accept Offer

**Files:**

- Create: `src/app/api/package-offer/accept/route.ts`

- [ ] **Step 1: Create the accept offer API route**

Create `src/app/api/package-offer/accept/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { requestId } = (await request.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: 'requestId lipseste' }, { status: 400 });
  }

  // Fetch the package request — RLS ensures user owns it
  const { data: pkgRequest, error: reqError } = await supabase
    .from('package_requests')
    .select('id, user_id, offer_status, offer_total')
    .eq('id', requestId)
    .single();

  if (reqError || !pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  if (pkgRequest.user_id !== user.id) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  if (pkgRequest.offer_status !== 'pending') {
    return NextResponse.json({ error: 'Oferta nu mai este disponibila' }, { status: 400 });
  }

  // Fetch offer items
  const { data: offerItems, error: itemsError } = await supabase
    .from('package_offer_items')
    .select('product_id, product_name, quantity, unit_price')
    .eq('request_id', requestId);

  if (itemsError || !offerItems || offerItems.length === 0) {
    return NextResponse.json({ error: 'Oferta nu contine produse' }, { status: 400 });
  }

  // Check stock for catalog products
  const catalogItems = offerItems.filter((i) => i.product_id);
  if (catalogItems.length > 0) {
    const productIds = catalogItems.map((i) => i.product_id!);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    const stockMap = new Map((products || []).map((p) => [p.id, p]));
    const outOfStock: string[] = [];

    for (const item of catalogItems) {
      const product = stockMap.get(item.product_id!);
      if (!product || product.stock < item.quantity) {
        outOfStock.push(item.product_name);
      }
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          error: `Stoc insuficient pentru: ${outOfStock.join(', ')}. Contacteaza-ne pentru actualizarea ofertei.`,
        },
        { status: 400 },
      );
    }
  }

  // Decrement stock for catalog products
  const decremented: { productId: string; quantity: number }[] = [];
  for (const item of catalogItems) {
    const { data: ok } = await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id!,
      p_quantity: item.quantity,
    });
    if (!ok) {
      // Rollback
      for (const dec of decremented) {
        await supabase.rpc('increment_stock', {
          p_product_id: dec.productId,
          p_quantity: dec.quantity,
        });
      }
      return NextResponse.json(
        { error: 'Stoc insuficient. Te rugam sa ne contactezi.' },
        { status: 400 },
      );
    }
    decremented.push({ productId: item.product_id!, quantity: item.quantity });
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'confirmed',
      subtotal: pkgRequest.offer_total,
      shipping_cost: 0,
      total: pkgRequest.offer_total,
      shipping_address: {},
      payment_method: 'ramburs',
      payment_status: 'pending',
      shipping_method: 'curier',
      package_request_id: requestId,
      notes: 'Comanda din oferta de pachet personalizat',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    // Rollback stock
    for (const dec of decremented) {
      await supabase.rpc('increment_stock', {
        p_product_id: dec.productId,
        p_quantity: dec.quantity,
      });
    }
    return NextResponse.json({ error: 'Eroare la crearea comenzii' }, { status: 500 });
  }

  // Create order items
  const orderItems = offerItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);

  if (orderItemsError) {
    // Rollback: delete order + restore stock
    await supabase.from('orders').delete().eq('id', order.id);
    for (const dec of decremented) {
      await supabase.rpc('increment_stock', {
        p_product_id: dec.productId,
        p_quantity: dec.quantity,
      });
    }
    return NextResponse.json({ error: 'Eroare la salvarea produselor' }, { status: 500 });
  }

  // Update offer status
  await supabase.from('package_requests').update({ offer_status: 'accepted' }).eq('id', requestId);

  return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/package-offer/accept/route.ts
git commit -m "feat: client API route to accept package offer and create order"
```

---

### Task 6: Client API — Reject Offer

**Files:**

- Create: `src/app/api/package-offer/reject/route.ts`

- [ ] **Step 1: Create the reject offer API route**

Create `src/app/api/package-offer/reject/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { requestId } = (await request.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: 'requestId lipseste' }, { status: 400 });
  }

  // RLS ensures user can only see their own requests
  const { data: pkgRequest } = await supabase
    .from('package_requests')
    .select('id, user_id, offer_status')
    .eq('id', requestId)
    .single();

  if (!pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  if (pkgRequest.user_id !== user.id) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  if (pkgRequest.offer_status !== 'pending') {
    return NextResponse.json({ error: 'Oferta nu mai este disponibila' }, { status: 400 });
  }

  const { error } = await supabase
    .from('package_requests')
    .update({ offer_status: 'rejected' })
    .eq('id', requestId);

  if (error) {
    return NextResponse.json({ error: 'Eroare la refuzarea ofertei' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/package-offer/reject/route.ts
git commit -m "feat: client API route to reject package offer"
```

---

### Task 7: Admin UI — Offer Section in Cereri Pachet

**Files:**

- Modify: `src/app/(admin)/admin/cereri-pachet/CereriContent.tsx`
- Modify: `src/app/(admin)/admin/cereri-pachet/page.tsx`

- [ ] **Step 1: Update admin page to fetch offer items**

In `src/app/(admin)/admin/cereri-pachet/page.tsx`, update the query to also fetch offer items. Replace lines 13-16:

```typescript
const { data } = await supabase
  .from('package_requests')
  .select('*, package_offer_items(*)')
  .order('created_at', { ascending: false });
```

- [ ] **Step 2: Add product search API route**

Create `src/app/api/admin/product-search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, sale_price, stock')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(10);

  return NextResponse.json({ products: products || [] });
}
```

- [ ] **Step 3: Rewrite CereriContent with offer management**

Replace the entire content of `src/app/(admin)/admin/cereri-pachet/CereriContent.tsx` with the new version that includes offer creation, editing, product search, and offer status management.

The key additions to the existing component:

**New state variables** (add after existing state at line 44):

```typescript
const [offerItems, setOfferItems] = useState<Record<string, OfferItem[]>>({});
const [offerNotes, setOfferNotes] = useState('');
const [showOfferForm, setShowOfferForm] = useState(false);
const [productQuery, setProductQuery] = useState('');
const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
const [searching, setSearching] = useState(false);
const [sendingOffer, setSendingOffer] = useState(false);
const [closingOffer, setClosingOffer] = useState(false);
```

**New interfaces** (add after imports):

```typescript
interface OfferItem {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  stock: number;
}
```

**New functions:**

- `searchProducts(query)`: debounced fetch to `/api/admin/product-search?q=...`
- `addCatalogProduct(product)`: adds product to offer items with catalog price
- `addCustomItem()`: adds empty row for custom product
- `removeOfferItem(index)`: removes item from list
- `updateOfferItem(index, field, value)`: updates quantity or price
- `sendOffer(requestId)`: POST to `/api/admin/package-offer`
- `closeOffer(requestId)`: POST to `/api/admin/package-offer/close`

**New JSX** (inside the expanded request section, after the existing save button):

- Divider
- "Oferta" section header with status badge
- If no offer: "Creeaza oferta" button
- If offer form open: product search + items table + notes + send button
- If offer pending: read/edit items table + "Inchide oferta" button
- If offer accepted/rejected/closed: read-only items table + status

This is a large component change. The full implementation should follow the existing patterns in CereriContent (using Card, Badge, Button, toast, etc.) and maintain the same visual style.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/product-search/route.ts src/app/(admin)/admin/cereri-pachet/
git commit -m "feat: admin UI for creating and managing package offers"
```

---

### Task 8: Client Page — Cereri Pachet

**Files:**

- Create: `src/app/(client)/cereri-pachet/page.tsx`
- Create: `src/app/(client)/cereri-pachet/CereriPachetContent.tsx`

- [ ] **Step 1: Create the server page component**

Create `src/app/(client)/cereri-pachet/page.tsx`:

```typescript
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CereriPachetContent from './CereriPachetContent';

export const metadata: Metadata = {
  title: 'Cererile mele de pachet',
};

export default async function CereriPachetPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: requests } = await supabase
    .from('package_requests')
    .select('*, package_offer_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <CereriPachetContent requests={requests || []} />;
}
```

- [ ] **Step 2: Create the client content component**

Create `src/app/(client)/cereri-pachet/CereriPachetContent.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, Package, CheckCircle, XCircle } from 'lucide-react';
import type { PackageRequest, PackageOfferItem, OfferStatus } from '@/types/database';

type RequestWithItems = PackageRequest & { package_offer_items: PackageOfferItem[] };

interface Props {
  requests: RequestWithItems[];
}

const offerStatusLabels: Record<OfferStatus, string> = {
  pending: 'Oferta primita',
  accepted: 'Acceptata',
  rejected: 'Refuzata',
  closed: 'Inchisa',
};

const offerStatusVariants: Record<OfferStatus, 'warning' | 'success' | 'neutral' | 'info'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'neutral',
  closed: 'neutral',
};

const requestStatusLabels: Record<string, string> = {
  new: 'Noua',
  in_review: 'In analiza',
  answered: 'Oferta trimisa',
  closed: 'Inchisa',
};

export default function CereriPachetContent({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function handleAccept(requestId: string) {
    setAccepting(true);
    try {
      const res = await fetch('/api/package-offer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Eroare la acceptarea ofertei', 'error');
        return;
      }
      toast('Oferta acceptata! Comanda a fost creata.', 'success');
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, offer_status: 'accepted' as OfferStatus } : r)),
      );
      setConfirmAccept(null);
      router.push(`/comenzi/${data.orderId}`);
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject(requestId: string) {
    setRejecting(true);
    try {
      const res = await fetch('/api/package-offer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Eroare', 'error');
        return;
      }
      toast('Oferta refuzata.', 'success');
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, offer_status: 'rejected' as OfferStatus } : r)),
      );
    } catch {
      toast('Eroare de retea', 'error');
    } finally {
      setRejecting(false);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nicio cerere de pachet</h2>
        <p className="text-gray-500">Nu ai trimis inca nicio cerere de pachet personalizat.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cererile mele de pachet</h1>

      {requests.map((req) => (
        <Card key={req.id}>
          <button onClick={() => setExpandedId(expandedId === req.id ? null : req.id)} className="w-full text-left">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm text-gray-500">{formatDate(req.created_at)}</span>
                  <Badge variant="info">{requestStatusLabels[req.status] || req.status}</Badge>
                  {req.offer_status && (
                    <Badge variant={offerStatusVariants[req.offer_status]}>
                      {offerStatusLabels[req.offer_status]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-1">{req.description.slice(0, 100)}</p>
              </div>
              {expandedId === req.id ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
            </div>
          </button>

          {expandedId === req.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descrierea cererii</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{req.description}</p>
              </div>

              {/* Offer section */}
              {req.offer_status && req.package_offer_items.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Oferta</p>
                    <Badge variant={offerStatusVariants[req.offer_status]}>
                      {offerStatusLabels[req.offer_status]}
                    </Badge>
                  </div>

                  {/* Items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Produs</th>
                          <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Pret</th>
                          <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.package_offer_items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 text-gray-700">{item.product_name}</td>
                            <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-700">{formatPrice(item.unit_price)}</td>
                            <td className="py-2 text-right font-medium text-gray-900">{formatPrice(item.unit_price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(req.offer_total ?? 0)}</span>
                  </div>

                  {req.offer_notes && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Mesaj de la echipa:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{req.offer_notes}</p>
                    </div>
                  )}

                  {/* Accept/Reject buttons */}
                  {req.offer_status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      {confirmAccept === req.id ? (
                        <div className="flex items-center gap-3 w-full">
                          <p className="text-sm text-gray-600 flex-1">
                            Confirmi acceptarea ofertei de <strong>{formatPrice(req.offer_total ?? 0)}</strong>? Se va crea o comanda.
                          </p>
                          <Button size="sm" variant="primary" onClick={() => handleAccept(req.id)} loading={accepting}>
                            <CheckCircle size={16} className="mr-1" /> Da, accept
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmAccept(null)}>
                            Anuleaza
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="primary" onClick={() => setConfirmAccept(req.id)}>
                            <CheckCircle size={16} className="mr-1" /> Accepta oferta
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} loading={rejecting}>
                            <XCircle size={16} className="mr-1" /> Refuza
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No offer yet */}
              {!req.offer_status && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">Cererea este in curs de analiza. Te vom notifica cand oferta este gata.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/(client)/cereri-pachet/
git commit -m "feat: client page to view package requests and accept/reject offers"
```

---

### Task 9: Dashboard Card for Package Requests

**Files:**

- Modify: `src/app/(client)/dashboard/page.tsx`
- Modify: `src/app/(client)/dashboard/DashboardContent.tsx`

- [ ] **Step 1: Fetch package request count in dashboard page**

In `src/app/(client)/dashboard/page.tsx`, add to the parallel queries (line 16-20). Add a 4th query:

```typescript
const [profileRes, ordersRes, addressCountRes, packageRequestCountRes] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  supabase
    .from('orders')
    .select('id, order_number, status, total, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3),
  supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  supabase
    .from('package_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id),
]);
```

Pass the count as prop (update the return JSX):

```typescript
  return (
    <DashboardContent
      profile={profileRes.data}
      recentOrders={(ordersRes.data as Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[]) || []}
      addressCount={addressCountRes.count || 0}
      packageRequestCount={packageRequestCountRes.count || 0}
    />
  );
```

- [ ] **Step 2: Add package requests card to DashboardContent**

In `src/app/(client)/dashboard/DashboardContent.tsx`:

Add `Package` to lucide imports (line 9):

```typescript
import { ShoppingBag, MapPin, User, Shield, Package } from 'lucide-react';
```

Update Props interface (line 12-16):

```typescript
interface Props {
  profile: Profile | null;
  recentOrders: Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[];
  addressCount: number;
  packageRequestCount: number;
}
```

Update destructuring (line 18):

```typescript
export default function DashboardContent({ profile, recentOrders, addressCount, packageRequestCount }: Props) {
```

Change grid from 3 to 2x2 (line 40):

```typescript
      <div className="grid md:grid-cols-2 gap-6">
```

Add package requests card after the Addresses card (after line 91, before the Profile card):

```typescript
        {/* Cereri pachet */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-violet-50">
              <Package size={24} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cereri pachet</h3>
              <p className="text-sm text-gray-500 mt-1">
                {packageRequestCount === 0
                  ? 'Nicio cerere trimisa'
                  : `${packageRequestCount} ${packageRequestCount === 1 ? 'cerere' : 'cereri'} de pachet`}
              </p>
              <Link href="/cereri-pachet" className="text-sm text-accent hover:underline font-medium mt-2 inline-block">
                Vezi cererile
              </Link>
            </div>
          </div>
        </Card>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/(client)/dashboard/
git commit -m "feat: add package requests card to client dashboard"
```

---

### Task 10: Require Login on Package Request Form

**Files:**

- Modify: `src/app/(shop)/generator-pachet/page.tsx`
- Modify: `src/app/api/package-request/route.ts`

- [ ] **Step 1: Add login gate to generator-pachet page**

In `src/app/(shop)/generator-pachet/page.tsx`, find the section where the form renders (the main return JSX). Add a login check at the very beginning of the component's JSX return. Before the form, if `!isLoggedIn` and after the initial auth check completes, show a login prompt instead of the form.

After the existing `useEffect` for auth check (around line 80), find the `if (submitted)` success screen and add a similar early return for not-logged-in state:

```typescript
  if (!isLoggedIn && !loading) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Logheaza-te pentru a trimite o cerere</h2>
        <p className="text-gray-500 mb-6">
          Ai nevoie de un cont pentru a trimite cereri de pachet si a urmari statusul ofertelor.
        </p>
        <Link
          href={`/login?redirect=/generator-pachet`}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
        >
          Logheaza-te
        </Link>
      </div>
    );
  }
```

Add necessary imports at the top: `Link` from `next/link`, `Package` from `lucide-react`, and add a `loading` state for the auth check.

- [ ] **Step 2: Enforce auth in API route**

In `src/app/api/package-request/route.ts`, change the auth handling so `user_id` is required. Find the auth section (lines 14-22) and after extracting the user, add:

```typescript
if (!userId) {
  return NextResponse.json({ error: 'Autentificare necesara' }, { status: 401 });
}
```

Remove the fallback to IP-based rate limiting for anonymous users — all requests now require auth.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/(shop)/generator-pachet/page.tsx src/app/api/package-request/route.ts
git commit -m "feat: require login to submit package requests"
```

---

### Task 11: Build & Lint Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Manual smoke test**

Test in browser:

1. `/generator-pachet` — shows login prompt if not logged in, form if logged in
2. `/admin/cereri-pachet` — can expand a request, see offer section
3. `/cereri-pachet` — shows client's requests (empty or with data)
4. `/dashboard` — shows package requests card

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build/lint issues in package offer system"
```
