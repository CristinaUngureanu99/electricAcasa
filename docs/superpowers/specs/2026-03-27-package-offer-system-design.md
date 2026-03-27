# Package Offer System — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Approach:** Extend existing package_requests system (Approach A)

---

## Overview

Clients submit package requests via `/generator-pachet` (requires login). Admin reviews the request, creates an offer with catalog products, custom items, and personalized pricing. Client receives email notification, views the offer in their account, and can accept or reject. Accepting creates a direct order (no cart involved). Admin can close offers manually.

---

## Database Changes

### New table: `package_offer_items`

| Column       | Type                         | Description                                         |
| ------------ | ---------------------------- | --------------------------------------------------- |
| id           | uuid PK                      | Auto-generated                                      |
| request_id   | uuid FK → package_requests   | Parent request                                      |
| product_id   | uuid FK → products, nullable | Catalog product (null for custom)                   |
| product_name | text NOT NULL                | Snapshot of product name (catalog or custom)        |
| quantity     | integer NOT NULL             | Quantity                                            |
| unit_price   | numeric NOT NULL             | Price per unit (may differ from catalog = discount) |
| created_at   | timestamptz                  | Default now()                                       |

For catalog products: `product_id` is set, `product_name` is copied from the product at offer creation time.
For custom items: `product_id` is null, `product_name` is the custom name entered by admin.

### New columns on `package_requests`

| Column           | Type                  | Description                                   |
| ---------------- | --------------------- | --------------------------------------------- |
| offer_total      | numeric, nullable     | Calculated total of the offer                 |
| offer_status     | text, nullable        | null / pending / accepted / rejected / closed |
| offer_created_at | timestamptz, nullable | When offer was created                        |
| offer_notes      | text, nullable        | Admin message to client about the offer       |

Check constraint on offer_status: `IN ('pending', 'accepted', 'rejected', 'closed')` or null.

### New column on `orders`

| Column             | Type                                 | Description                  |
| ------------------ | ------------------------------------ | ---------------------------- |
| package_request_id | uuid FK → package_requests, nullable | Links order to package offer |

### New column on `order_items`

| Column       | Type           | Description                           |
| ------------ | -------------- | ------------------------------------- |
| product_name | text, nullable | Name for custom items (no product_id) |

### RLS Policies for `package_offer_items`

- SELECT: users can read items where request.user_id = auth.uid(), admins can read all
- INSERT/UPDATE/DELETE: admins only

---

## Status Flow

```
Request created (status: new, offer_status: null)
    |
    v
Admin reviews (status: in_review, offer_status: null)
    |
    v
Admin creates offer (status: answered, offer_status: pending)
    |
    +---> Client accepts (offer_status: accepted) --> Order created automatically
    |
    +---> Client rejects (offer_status: rejected)
    |
    +---> Admin closes (offer_status: closed)
```

---

## Admin Panel Changes

### Location: `/admin/cereri-pachet` (existing page)

When admin expands a request, a new "Oferta" section appears below existing details.

**Creating an offer (offer_status is null):**

- "Creeaza oferta" button reveals the offer form
- Product search field: type to search catalog products, select to add with pre-filled price
- "Adauga produs custom" button: adds empty row for name + price
- Offer items table: Product | Quantity | Unit Price | Subtotal | Delete
- Auto-calculated total
- Message textarea for client (offer_notes)
- "Trimite oferta" button: saves items, sets offer_status=pending, sends email

**Existing offer (offer_status is pending):**

- Items table displayed (editable)
- Admin can edit/delete items and resend
- "Inchide oferta" button sets offer_status=closed

**Completed offers (accepted/rejected/closed):**

- Items table displayed (read-only)
- Status badge
- If accepted: link to created order

---

## Client Pages

### New page: `/client/cereri-pachet`

**Request list:**

- Cards showing: Date | Description (first 100 chars) | Status badge | Offer status badge
- Sorted by date descending

**Request detail (expanded):**

- Full description
- Attachment download link (if exists)
- If offer_status=pending:
  - Products table: Product | Quantity | Unit Price | Subtotal
  - Total
  - Admin message
  - "Accepta oferta" button (green) with confirmation dialog
  - "Refuza oferta" button (gray/red)
- If accepted: badge + link to order
- If rejected/closed: badge, no actions

### Dashboard update: `/client/dashboard`

- New card: "Cererile mele de pachet" with count + link to `/client/cereri-pachet`

---

## API Endpoints

### POST `/api/admin/package-offer` (admin only)

Creates or updates an offer for a package request.

**Request body:**

```json
{
  "requestId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 45.0 },
    { "customName": "Manopera instalare", "quantity": 1, "unitPrice": 500.0 }
  ],
  "offerNotes": "Am inclus si manopera"
}
```

**Actions:**

1. Validates admin role
2. Deletes existing offer items (if updating)
3. Inserts new offer items
4. Calculates and saves offer_total
5. Sets offer_status=pending, offer_created_at=now()
6. Sets request status=answered
7. Sends email to client with offer details
8. Returns success

### POST `/api/package-offer/accept` (authenticated user)

Client accepts an offer.

**Request body:**

```json
{
  "requestId": "uuid"
}
```

**Actions:**

1. Validates user owns the request
2. Validates offer_status=pending
3. For catalog products: checks stock availability
4. If stock insufficient: returns error with details
5. Creates order (status=confirmed, package_request_id set)
6. Creates order_items from offer items (product_name for custom items)
7. For catalog products: decrements stock
8. Sets offer_status=accepted
9. Returns order ID + redirects to order completion page (address + payment)

### POST `/api/package-offer/reject` (authenticated user)

Client rejects an offer.

**Request body:**

```json
{
  "requestId": "uuid"
}
```

**Actions:**

1. Validates user owns the request
2. Validates offer_status=pending
3. Sets offer_status=rejected
4. Returns success

### POST `/api/admin/package-offer/close` (admin only)

Admin closes an offer.

**Actions:**

1. Validates admin role
2. Sets offer_status=closed
3. Returns success

---

## Email

### New template: Package Offer Ready

- Subject: "Oferta ta de pachet personalizat — electricAcasa"
- Content: products table with quantities and prices, total, admin message
- CTA button: "Vezi oferta" linking to `/client/cereri-pachet`
- Same layout as existing email templates (blue header, white body, footer)

---

## Package Request Form Changes

### Location: `/generator-pachet`

**Single change:** require authentication.

- Not logged in: show message "Logheaza-te pentru a trimite o cerere de pachet personalizat" with login button (redirects back after login)
- Logged in: form works exactly as now
- API change: user_id becomes required (reject requests without auth token)

---

## Edge Cases

- **Stock check at acceptance:** if a catalog product is out of stock, show error and suggest contacting admin
- **Offer already accepted/rejected:** API returns error if offer_status is not pending
- **Admin edits offer after sending:** deletes old items, inserts new, resends email
- **Product deleted from catalog after offer created:** offer item displays saved product_name (snapshot from creation time), so display is unaffected
- **Multiple offers:** not supported. One offer per request. Admin can edit and resend.

---

## What Does NOT Change

- Cart system (unrelated to offers)
- Normal checkout flow
- Existing order system (we add to it, not modify)
- Existing email templates
- Admin categories, products, orders pages
- Search, filters on admin cereri-pachet (only the expanded detail view changes)
